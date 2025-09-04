import { useState, useEffect } from 'react';
import { Receipt, Filter, Calendar, DollarSign, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  // Funções para formatação de data (igual ao fiado)
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateFromInput = (dateString: string) => {
    if (!dateString) return undefined;
    return new Date(dateString + 'T00:00:00');
  };

  // Reset para página 1 quando filtro ou itemsPerPage muda
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, itemsPerPage]);

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
          <h1 className="text-2xl font-bold text-foreground">Gastos</h1>
          <p className="text-muted-foreground">Controle de despesas da barbearia</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
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
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Registrando...' : 'Registrar Gasto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Gastos</p>
                <p className="text-xl font-bold text-destructive">R$ {totalExpenses.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {filteredExpenses.length} despesas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gastos Hoje</p>
                <p className="text-xl font-bold text-destructive">R$ {todayExpenses.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {filteredExpenses.filter(expense => 
                    expense.date.toDateString() === new Date().toDateString()
                  ).length} despesas hoje
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gastos do Mês</p>
                <p className="text-xl font-bold text-destructive">R$ {thisMonthExpenses.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {filteredExpenses.filter(expense => {
                    const expenseDate = expense.date;
                    const currentDate = new Date();
                    return expenseDate.getMonth() === currentDate.getMonth() && 
                           expenseDate.getFullYear() === currentDate.getFullYear();
                  }).length} despesas este mês
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="space-y-2">
            <Label className="text-sm">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-11"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? (
                    format(parseDateFromInput(dateFilter) || new Date(), "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={parseDateFromInput(dateFilter)}
                  onSelect={(date) => setDateFilter(formatDateForInput(date))}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Botão limpar filtros */}
        {dateFilter && (
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="w-full sm:w-auto h-11 whitespace-nowrap"
          >
            Limpar Filtros
          </Button>
        )}
      </div>
      
      {/* Contador de resultados */}
      {dateFilter && (
        <p className="text-sm text-muted-foreground">
          {filteredExpenses.length} gasto(s) encontrado(s)
        </p>
      )}

      {/* Lista de gastos */}
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <Card className="border-border">
            <CardContent className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum gasto encontrado
              </h3>
              <p className="text-muted-foreground">
                {dateFilter ? 'Ajuste os filtros ou registre um novo gasto' : 'Comece registrando os gastos da barbearia'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentExpenses.map(expense => (
              <Card key={expense.id} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground mb-2">
                          {expense.description}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          <span>Por: {expense.user}</span>
                          <span>{expense.date.toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xl font-bold text-destructive">
                          R$ {expense.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Botão de deletar */}
                    <div className="flex justify-end pt-2 border-t border-border">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        className="text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Controles de Paginação */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
          {/* Seletor de itens por página */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Itens por página:</Label>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
              className="w-20 h-8 px-2 border border-border rounded-md bg-background text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Controles de navegação */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto"
              >
                Anterior
              </Button>
              
              <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-muted-foreground">
                <span>Página {currentPage} de {totalPages}</span>
                <span className="hidden sm:inline">•</span>
                <span>{filteredExpenses.length} gastos</span>
                <span className="hidden sm:inline">•</span>
                <span>Mostrando {startIndex + 1}-{Math.min(endIndex, filteredExpenses.length)}</span>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-full sm:w-auto"
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 