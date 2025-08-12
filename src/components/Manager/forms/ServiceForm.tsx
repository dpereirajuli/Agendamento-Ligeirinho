
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ServiceFormProps {
  editingService?: any;
  onSubmit: (data: { type: string; price: number }) => void;
  isLoading?: boolean;
}

export default function ServiceForm({ editingService, onSubmit, isLoading }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    type: editingService?.type || '',
    price: editingService?.price?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: formData.type,
      price: parseFloat(formData.price),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Tipo de Serviço</Label>
        <Input
          id="type"
          value={formData.type}
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
          placeholder="Ex: Corte Masculino"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Preço (R$)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
          placeholder="25.00"
          required
          disabled={isLoading}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
        disabled={isLoading}
      >
        {editingService ? 'Atualizar Serviço' : 'Adicionar Serviço'}
      </Button>
    </form>
  );
}
