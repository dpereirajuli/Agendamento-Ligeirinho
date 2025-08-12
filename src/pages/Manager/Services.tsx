
import { useState } from 'react';
import { Plus, Edit, Trash2, Scissors } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ServiceForm from '@/components/Manager/forms/ServiceForm';

export default function Services() {
  const { services, addService, updateService, deleteService, user } = useApp();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid
  const totalPages = Math.ceil(services.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentServices = services.slice(startIndex, endIndex);

  const handleSubmit = (data: { type: string; price: number }) => {
    setIsLoading(true);
    try {
      if (editingService) {
        updateService(editingService.id, data);
        toast({
          title: "Serviço atualizado!",
          description: "As informações foram salvas com sucesso.",
        });
        setEditingService(null);
      } else {
        addService(data);
        toast({
          title: "Serviço adicionado!",
          description: "O serviço foi cadastrado com sucesso.",
        });
        setIsAddOpen(false);
      }
    } catch (error: any) {
      console.error('Error handling service:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar solicitação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
  };

  const handleDelete = (id: string, type: string) => {
    if (confirm(`Tem certeza que deseja excluir "${type}"?`)) {
      deleteService(id);
      toast({
        title: "Serviço excluído!",
        description: "O serviço foi removido com sucesso.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-600">Gerencie os serviços oferecidos</p>
        </div>

        {user?.role === 'admin' && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Serviço</DialogTitle>
                <DialogDescription>
                  Cadastre um novo tipo de serviço
                </DialogDescription>
              </DialogHeader>
              <ServiceForm onSubmit={handleSubmit} isLoading={isLoading} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentServices.map(service => (
          <Card key={service.id} className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-gray-600" />
                {service.type}
              </CardTitle>
              <CardDescription>
                Serviço profissional
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold text-gray-900">
                  R$ {service.price.toFixed(2)}
                </div>
                
                <p className="text-sm text-gray-600">
                  Preço por atendimento
                </p>

                {user?.role === 'admin' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      className="flex-1 border-gray-300 hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(service.id, service.type)}
                      className="flex-1 bg-red-600 hover:bg-red-700"
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

      {/* Estado vazio */}
      {services.length === 0 && (
        <div className="text-center py-12">
          <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum serviço cadastrado
          </h3>
          <p className="text-gray-600 mb-4">
            Comece adicionando os serviços que sua barbearia oferece
          </p>
          {user?.role === 'admin' && (
            <Button onClick={() => setIsAddOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Serviço
            </Button>
          )}
        </div>
      )}

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            Anterior
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <span className="text-sm text-gray-500">
              ({services.length} serviços)
            </span>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
            <DialogDescription>
              Atualize as informações do serviço
            </DialogDescription>
          </DialogHeader>
          <ServiceForm 
            editingService={editingService}
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
