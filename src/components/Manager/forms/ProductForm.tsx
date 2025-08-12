
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductFormProps {
  editingProduct?: any;
  onSubmit: (data: { name: string; price: number; stock: number; minStock: number }) => void;
  isLoading?: boolean;
}

export default function ProductForm({ editingProduct, onSubmit, isLoading }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: editingProduct?.name || '',
    price: editingProduct?.price?.toString() || '',
    stock: editingProduct?.stock?.toString() || '',
    minStock: editingProduct?.minStock?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Produto</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Shampoo"
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="25.90"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Estoque</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
            placeholder="10"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minStock">Estoque Mínimo</Label>
        <Input
          id="minStock"
          type="number"
          value={formData.minStock}
          onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
          placeholder="5"
          required
          disabled={isLoading}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading}
      >
        {editingProduct ? 'Atualizar Produto' : 'Adicionar Produto'}
      </Button>
    </form>
  );
}
