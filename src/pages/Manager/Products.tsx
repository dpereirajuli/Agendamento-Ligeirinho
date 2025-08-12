
import { useState } from 'react';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ProductForm from '@/components/Manager/forms/ProductForm';

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct, user } = useApp();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handleSubmit = (data: { name: string; price: number; stock: number; minStock: number }) => {
    setIsLoading(true);
    try {
      if (editingProduct) {
        updateProduct(editingProduct.id, data);
        toast({
          title: "Produto atualizado!",
          description: "As informações foram salvas com sucesso.",
        });
        setEditingProduct(null);
      } else {
        addProduct(data);
        toast({
          title: "Produto adicionado!",
          description: "O produto foi cadastrado com sucesso.",
        });
        setIsAddOpen(false);
      }
    } catch (error: any) {
      console.error('Error handling product:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar solicitação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      deleteProduct(id);
      toast({
        title: "Produto excluído!",
        description: "O produto foi removido com sucesso.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie seu estoque</p>
        </div>

        {user?.role === 'admin' && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Produto</DialogTitle>
                <DialogDescription>
                  Preencha as informações do novo produto
                </DialogDescription>
              </DialogHeader>
              <ProductForm onSubmit={handleSubmit} isLoading={isLoading} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentProducts.map(product => (
          <Card key={product.id} className="relative">
            {product.stock <= product.minStock && (
              <div className="absolute top-3 right-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription>
                R$ {product.price.toFixed(2)}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Estoque:</span>
                  <span className={`font-medium ${
                    product.stock <= product.minStock ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {product.stock} unidades
                  </span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Mínimo:</span>
                  <span>{product.minStock} unidades</span>
                </div>

                {user?.role === 'admin' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id, product.name)}
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

      {/* Estado vazio */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum produto cadastrado
          </h3>
          <p className="text-gray-600 mb-4">
            Comece adicionando produtos ao seu estoque
          </p>
          {user?.role === 'admin' && (
            <Button onClick={() => setIsAddOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Produto
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
              ({products.length} produtos)
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

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize as informações do produto
            </DialogDescription>
          </DialogHeader>
          <ProductForm 
            editingProduct={editingProduct}
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
