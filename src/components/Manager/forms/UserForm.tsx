
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserFormProps {
  editingUser?: any;
  onSubmit: (data: { name: string; email: string; password: string; role: 'admin' | 'user' }) => void;
  isLoading?: boolean;
}

export default function UserForm({ editingUser, onSubmit, isLoading }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: editingUser?.name || '',
    email: editingUser?.email || '',
    password: '',
    role: (editingUser?.role || 'user') as 'admin' | 'user'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Nome completo"
          required
          autoComplete="off"
          disabled={isLoading}
        />
      </div>

      {!editingUser && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              required
              autoComplete="off"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="role">Função</Label>
        <Select 
          value={formData.role} 
          onValueChange={(value: 'admin' | 'user') => setFormData(prev => ({ ...prev, role: value }))}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
        disabled={isLoading}
      >
        {editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
      </Button>
    </form>
  );
}
