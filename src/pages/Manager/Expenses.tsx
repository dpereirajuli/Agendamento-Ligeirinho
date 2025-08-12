import { useState, useEffect } from 'react';
import { Receipt, Filter, Calendar, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  user?: string;
}

export default function Expenses() {
  const { user } = useApp();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: ''
  });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar despesas por data
  const filteredExpenses = expenses.filter(expense => {
    if (dateFilter) {
      const expenseDate = expense.date.toISOString().split('T')[0];
      return expenseDate === dateFilter;
    }
    return true;
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  // Paginação para despesas filtradas
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);

  // Reset para página 1 quando filtro muda
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter]);

  // Carregar despesas do localStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
      const parsedExpenses = JSON.parse(savedExpenses).map((expense: any) => ({
        ...expense,
        date: new Date(expense.date)
      }));
      setExpenses(parsedExpenses);
    }
  }, []);

  // Salvar despesas no localStorage
  const saveExpenses = (newExpenses: Expense[]) => {
    localStorage.setItem('expenses', JSON.stringify(newExpenses));
    setExpenses(newExpenses);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newExpense.description.trim() || !newExpense.amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const expense: Expense = {
        id: Date.now().toString(),
        description: newExpense.description.trim(),
        amount: parseFloat(newExpense.amount),
        date: new Date(), // Data atual automaticamente
        user: user?.name || 'Usuário'
      };

      const updatedExpenses = [...expenses, expense];
      saveExpenses(updatedExpenses);

      toast({
        title: "Gasto registrado!",
        description: "O gasto foi cadastrado com sucesso.",
      });

      setNewExpense({
        description: '',
        amount: ''
      });
      setIsAddOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar gasto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este gasto?')) {
      const updatedExpenses = expenses.filter(expense => expense.id !== id);
      saveExpenses(updatedExpenses);
      
      toast({
        title: "Gasto excluído!",
        description: "O gasto foi removido com sucesso.",
      });
    }
  };

  const clearFilters = () => {
    setDateFilter('');
  };

  // Cálculos
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const todayExpenses = filteredExpenses.filter(expense => 
    expense.date.toDateString() === new Date().toDateString()
  ).reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonthExpenses = filteredExpenses.filter(expense => {
    const expenseDate = expense.date;
    const currentDate = new Date();
    return expenseDate.getMonth() === currentDate.getMonth() && 
           expenseDate.getFullYear() === currentDate.getFullYear();
  }).reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-gray-600">Controle de despesas da barbearia</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4" />
              Novo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Novo Gasto</DialogTitle>
              <DialogDescription>
                Adicione uma nova despesa ao controle.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Compra de produtos, Manutenção, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>



              <Button 
                type="submit" 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Registrando...' : 'Registrar Gasto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">
              {filteredExpenses.length} despesas
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {todayExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">
              {filteredExpenses.filter(expense => 
                expense.date.toDateString() === new Date().toDateString()
              ).length} despesas hoje
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos do Mês</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {thisMonthExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">
              {filteredExpenses.filter(expense => {
                const expenseDate = expense.date;
                const currentDate = new Date();
                return expenseDate.getMonth() === currentDate.getMonth() && 
                       expenseDate.getFullYear() === currentDate.getFullYear();
              }).length} despesas este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-4 pt-4 border-t gap-2">
            <div className="text-sm text-gray-600">
              Mostrando {filteredExpenses.length} de {expenses.length} gastos
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-900 hover:text-gray-700 underline self-start md:self-auto"
            >
              Limpar filtros
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de gastos */}
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum gasto encontrado
              </h3>
              <p className="text-gray-600">
                {dateFilter ? 'Ajuste os filtros ou registre um novo gasto' : 'Comece registrando os gastos da barbearia'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentExpenses.map(expense => (
              <Card key={expense.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">
                        {expense.description}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                        <span>Por: {expense.user}</span>
                        <span>{expense.date.toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-600">
                          R$ {expense.amount.toFixed(2)}
                        </p>
                      </div>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                ({filteredExpenses.length} gastos)
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
      </div>
    </div>
  );
} 