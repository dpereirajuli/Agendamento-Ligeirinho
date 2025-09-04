
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Shield } from 'lucide-react';
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
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários do sistema</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <Card key={user.id} className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {user.role === 'admin' ? (
                  <Shield className="h-5 w-5 text-destructive" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
                {user.name}
                <span className={`text-xs px-2 py-1 rounded ${user.approval_status === 'approved' ? 'bg-success/20 text-success' : user.approval_status === 'rejected' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                  {user.approval_status === 'approved' ? 'Aprovado' : user.approval_status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                </span>
              </CardTitle>
              <CardDescription>
                {user.email}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Função:</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    user.role === 'admin' 
                      ? 'bg-destructive/20 text-destructive' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </span>
                </div>
                
                <div className="flex gap-2 pt-2 flex-wrap">
                  {user.approval_status === 'pending' && (
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(user.id)}
                        className="flex-1 border-success hover:bg-success/10 text-success"
                      >
                        Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(user.id)}
                        className="flex-1 border-destructive hover:bg-destructive/10 text-destructive"
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      className="flex-1 border-border hover:bg-muted"
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
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
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
