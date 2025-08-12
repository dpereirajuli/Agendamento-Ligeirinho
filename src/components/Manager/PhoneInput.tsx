
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';

interface PhoneInputProps {
  value: string;
  onChange: (value: string, clientName?: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function PhoneInput({ 
  value, 
  onChange, 
  label = "Telefone", 
  placeholder = "(11) 99999-9999",
  required = false,
  id = "phone"
}: PhoneInputProps) {
  const { transactions } = useApp();
  const [displayValue, setDisplayValue] = useState('');
  const [existingClient, setExistingClient] = useState<string | null>(null);

  useEffect(() => {
    setDisplayValue(formatPhone(value));
  }, [value]);

  const formatPhone = (phone: string) => {
    // Remove tudo que não for número
    const numbers = phone.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhone(inputValue);
    setDisplayValue(formatted);
    
    // Extrair apenas números para armazenar
    const numbersOnly = inputValue.replace(/\D/g, '');
    
    // Verificar se o telefone já existe nas transações
    if (numbersOnly.length >= 10) {
      const existingTransaction = transactions.find(t => 
        t.clientPhone && t.clientPhone.replace(/\D/g, '') === numbersOnly
      );
      
      if (existingTransaction && existingTransaction.clientName) {
        setExistingClient(existingTransaction.clientName);
        onChange(formatted, existingTransaction.clientName);
      } else {
        setExistingClient(null);
        onChange(formatted);
      }
    } else {
      setExistingClient(null);
      onChange(formatted);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} {required && '*'}</Label>
      <Input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        maxLength={15}
      />
      {existingClient && (
        <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
          📞 Cliente encontrado: <strong>{existingClient}</strong>
        </p>
      )}
    </div>
  );
}
