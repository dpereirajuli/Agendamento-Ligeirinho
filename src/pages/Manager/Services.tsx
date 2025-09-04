import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Scissors } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';

interface Service {
  id: string;
  type: string;
  price: number;
  duration: number;
}

function ServiceForm({
  onSubmit,
  isLoading,
  editingService,
}: {
  onSubmit: (data: { type: string; price: number; duration: number }) => void;
  isLoading: boolean;
  editingService?: Service | null;
}) {
  const [form, setForm] = useState({ type: '', price: '', duration: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingService) {
      setForm({
        type: editingService.type,
        price: editingService.price.toString(),
        duration: editingService.duration.toString(),
      });
    } else {
      setForm({ type: '', price: '', duration: '' });
    }
  }, [editingService]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.type.trim() || !form.price || !form.duration) {
      setError('Preencha todos os campos');
      return;
    }
    if (isNaN(Number(form.price)) || isNaN(Number(form.duration))) {
      setError('Preço e duração devem ser números');
      return;
    }

    onSubmit({
      type: form.type,
      price: Number(form.price),
      duration: Number(form.duration),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Nome do Serviço</label>
        <Input
          placeholder="Nome do serviço"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          required
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Preço (R$)</label>
          <Input
            type="number"
            step="0.01"
            placeholder="Preço"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Duração (minutos)</label>
          <Input
            type="number"
            placeholder="Duração"
            value={form.duration}
            onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
            required
          />
        </div>
      </div>
      {error && <div className="text-destructive text-sm mb-4">{error}</div>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}

export default function Services() {
  const { toast } = useToast();
  const { user } = useApp();
  const [services, setServices] = useState<Service[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid
  const totalPages = Math.ceil(services.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServices = services.slice(startIndex, endIndex);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('services').select('*').order('type');
      if (error) throw error;
      
      if (data) {
                 setServices(
           data.map((item: any) => ({
             id: item.id,
             type: item.type,
             price: parseFloat(item.price.toString()),
             duration: item.duration || 30,
           }))
         );
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar serviços.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: { type: string; price: number; duration: number }) => {
    setIsLoading(true);
    try {
      if (editingService) {
        const { error: updateError } = await supabase
          .from('services')
          .update({
            type: data.type,
            price: data.price,
            duration: data.duration,
          })
          .eq('id', editingService.id);
        if (updateError) throw updateError;
        toast({
          title: 'Serviço atualizado!',
          description: 'As informações foram salvas com sucesso.',
        });
        setEditingService(null);
      } else {
        const { error: insertError } = await supabase.from('services').insert({
          type: data.type,
          price: data.price,
          duration: data.duration,
        });
        if (insertError) throw insertError;
        toast({
          title: 'Serviço adicionado!',
          description: 'O serviço foi cadastrado com sucesso.',
        });
        setIsAddOpen(false);
      }
      fetchServices();
    } catch (error: any) {
      console.error('Error handling service:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar solicitação',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
  };

  const handleDelete = async (id: string, type: string) => {
    if (confirm(`Tem certeza que deseja excluir "${type}"?`)) {
      setIsLoading(true);
      try {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) throw error;
        toast({
          title: 'Serviço excluído!',
          description: 'O serviço foi removido com sucesso.',
        });
        fetchServices();
      } catch (error: any) {
        toast({
          title: 'Erro',
          description: 'Erro ao remover serviço.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Acesso Restrito
          </h3>
          <p className="text-muted-foreground">
            Apenas administradores podem gerenciar serviços
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Serviço</DialogTitle>
              <DialogDescription>Cadastre um novo tipo de serviço</DialogDescription>
            </DialogHeader>
            <ServiceForm onSubmit={handleSubmit} isLoading={isLoading} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentServices.map((service) => (
            <Card key={service.id} className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-muted-foreground" />
                  {service.type}
                </CardTitle>
                <CardDescription>Serviço profissional</CardDescription>
              </CardHeader>
              <CardContent>
                                 <div className="space-y-3">
                   <div className="text-2xl font-bold text-foreground">R$ {service.price.toFixed(2)}</div>
                   <p className="text-sm text-muted-foreground">{service.duration} minutos</p>
                   <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(service.id, service.type)}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {services.length === 0 && !loading && (
        <div className="text-center py-12">
          <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum serviço cadastrado</h3>
          <p className="text-muted-foreground mb-4">Comece adicionando os serviços que sua barbearia oferece</p>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Serviço
          </Button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            Anterior
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
            <span className="text-sm text-muted-foreground">({services.length} serviços)</span>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2"
          >
            Próxima
          </Button>
        </div>
      )}

      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
            <DialogDescription>Atualize as informações do serviço</DialogDescription>
          </DialogHeader>
          <ServiceForm editingService={editingService} onSubmit={handleSubmit} isLoading={isLoading} />
        </DialogContent>
      </Dialog>
    </div>
  );
}