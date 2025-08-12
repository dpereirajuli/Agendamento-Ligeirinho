
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BarberFormProps {
  editingBarber?: any;
  onSubmit: (data: { name: string }) => void;
  isLoading?: boolean;
}

export default function BarberForm({ editingBarber, onSubmit, isLoading }: BarberFormProps) {
  const [formData, setFormData] = useState({ 
    name: editingBarber?.name || '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ name: e.target.value })}
          placeholder="Ex: João Silva"
          required
          autoComplete="off"
          disabled={isLoading}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
        disabled={isLoading}
      >
        {editingBarber ? 'Atualizar Barbeiro' : 'Adicionar Barbeiro'}
      </Button>
    </form>
  );
}
