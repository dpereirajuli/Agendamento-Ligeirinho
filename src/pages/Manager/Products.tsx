
import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ProductForm from '@/components/Manager/forms/ProductForm';
import { Badge } from '@/components/ui/badge';

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct, user } = useApp();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Lista com 10 itens por página
  // Ordenar produtos por ordem alfabética
  const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
        </div>

        {user?.role === 'admin' && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Produto</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 sm:mx-0">
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

      <div className="space-y-3">
        {currentProducts.map(product => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {/* Layout Desktop */}
              <div className="hidden md:flex items-center justify-between w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-6 flex-1">
                    <h3 className="text-lg font-semibold text-foreground min-w-0 flex-1">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center space-x-1 text-sm">
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="font-medium text-foreground">
                        R$ {product.price.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm">
                      <span className="text-muted-foreground">Qtde:</span>
                      <span className={`font-medium ${
                        product.stock <= product.minStock ? 'text-destructive' : 'text-green-600'
                      }`}>
                        {product.stock} unidades
                      </span>
                    </div>
                    
                    {product.stock <= product.minStock && (
                      <Badge variant="destructive" className="text-xs">
                        Baixo Estoque
                      </Badge>
                    )}
                  </div>
                </div>

                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id, product.name)}
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
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center space-x-1 text-sm">
                      <span className="text-muted-foreground">R$</span>
                      <span className="font-bold text-foreground">
                        {product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-sm">
                      <span className="text-muted-foreground">Qtde.:</span>
                      <span className={`font-medium ${
                        product.stock <= product.minStock ? 'text-destructive' : 'text-green-600'
                      }`}>
                        {product.stock} unidades
                      </span>
                    </div>
                    
                    {product.stock <= product.minStock && (
                      <Badge variant="destructive" className="text-xs">
                        Baixo Estoque
                      </Badge>
                    )}
                  </div>
                </div>

                {user?.role === 'admin' && (
                  <div className="flex space-x-2 pt-2">
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
          <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">📦</span>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum produto cadastrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando produtos ao seu estoque
          </p>
          {user?.role === 'admin' && (
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Produto
            </Button>
          )}
        </div>
      )}

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            Anterior
          </Button>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <span className="text-sm text-muted-foreground">
              ({products.length} produtos)
            </span>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            Próxima
          </Button>
        </div>
      )}

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="mx-4 sm:mx-0">
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
