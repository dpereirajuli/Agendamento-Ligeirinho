
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import UserForm from '@/components/Manager/forms/UserForm';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

export default function Users() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Lista com 10 itens por página
  // Ordenar usuários por ordem alfabética
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = sortedUsers.slice(startIndex, endIndex);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedUsers: UserProfile[] = (data || []).map(user => ({
        ...user,
        role: user.role as 'admin' | 'user',
        approval_status: user.approval_status as 'pending' | 'approved' | 'rejected'
      }));
      
      setUsers(typedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: { name: string; email: string; password: string; role: 'admin' | 'user' }) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Update user
        const { error } = await supabase
          .from('profiles')
          .update({ 
            name: data.name,
            role: data.role,
            approval_status: data.role === 'admin' ? 'approved' : 'pending'
          })
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: "Usuário atualizado!",
          description: "As informações foram salvas com sucesso.",
        });
        setEditingUser(null);
      } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name,
              role: data.role
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Create profile manually to ensure it's created
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              name: data.name,
              email: data.email,
              role: data.role,
              approval_status: data.role === 'admin' ? 'approved' : 'pending'
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }

        toast({
          title: "Usuário criado!",
          description: "O usuário foi cadastrado com sucesso.",
        });
        setIsAddOpen(false);
      }
      
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating/updating user:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar solicitação",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      try {
        // Delete profile first
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);

        if (profileError) throw profileError;

        // Then delete auth user if admin access is available
        try {
          const { error: authError } = await supabase.auth.admin.deleteUser(id);
          if (authError) console.warn('Could not delete auth user:', authError);
        } catch (authError) {
          console.warn('Admin delete not available:', authError);
        }

        toast({
          title: "Usuário excluído!",
          description: "O usuário foi removido com sucesso.",
        });
        fetchUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast({
          title: "Erro ao excluir usuário",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Acesso Restrito
          </h3>
          <p className="text-muted-foreground">
            Apenas administradores podem gerenciar usuários
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4">Carregando usuários...</div>;
  }

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuário aprovado",
        description: "O usuário agora pode acessar o sistema."
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar usuário",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'rejected' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Usuário rejeitado",
        description: "O acesso do usuário foi negado."
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao rejeitar usuário",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Usuário</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Adicionar Usuário</DialogTitle>
              <DialogDescription>
                Cadastre um novo usuário no sistema
              </DialogDescription>
            </DialogHeader>
            <UserForm onSubmit={handleSubmit} isLoading={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {currentUsers.map(user => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Layout Desktop */}
              <div className="hidden md:flex items-center justify-between w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-6 flex-1">
                    <h3 className="text-lg font-semibold text-foreground min-w-0 flex-1">
                      {user.name}
                    </h3>
                    
                    <div className="flex items-center space-x-1 text-sm">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium text-foreground">
                        {user.email}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm">
                      <span className="text-muted-foreground">Função:</span>
                      <span className={`font-medium ${
                        user.role === 'admin' ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Usuário'}
                      </span>
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 
                      user.approval_status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.approval_status === 'approved' ? 'Aprovado' : 
                       user.approval_status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center space-x-2 ml-4">
                    {user.approval_status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(user.id)}
                          className="border-green-500 hover:bg-green-50 text-green-700"
                        >
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(user.id)}
                          className="border-red-500 hover:bg-red-50 text-red-700"
                        >
                          Rejeitar
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.id, user.name)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                )}
              </div>

              {/* Layout Mobile */}
              <div className="md:hidden">
                <div className="space-y-3">
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-base font-semibold text-foreground flex-1">
                      {user.name}
                    </h3>
                    
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 
                      user.approval_status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.approval_status === 'approved' ? 'Aprovado' : 
                       user.approval_status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-foreground">
                      {user.email}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-sm">
                    <span className="text-muted-foreground">Função:</span>
                    <span className={`font-medium ${
                      user.role === 'admin' ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex space-x-2 pt-2">
                    {user.approval_status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(user.id)}
                          className="flex-1 border-green-500 hover:bg-green-50 text-green-700"
                        >
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(user.id)}
                          className="flex-1 border-red-500 hover:bg-red-50 text-red-700"
                        >
                          Rejeitar
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.id, user.name)}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            Anterior
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
            <span className="text-sm text-muted-foreground">({users.length} usuários)</span>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            Próxima
          </Button>
        </div>
      )}

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <UserForm 
            editingUser={editingUser}
            onSubmit={handleSubmit} 
            isLoading={isSubmitting} 
          />
        </DialogContent>
      </Dialog>

      {users.length === 0 && (
        <div className="text-center py-12">
          <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum usuário cadastrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando usuários ao sistema
          </p>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Usuário
          </Button>
        </div>
      )}
    </div>
  );
}
