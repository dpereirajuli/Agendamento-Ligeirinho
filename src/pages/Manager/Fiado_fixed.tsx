import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Phone, Search, Clock, Check, ChevronDown, CreditCard, Calendar as CalendarIcon, Filter } from 'lucide-react';

export default function Fiado() {
  const { fiadoClients, payFiado, markFiadoAsPaid, products, services } = useApp();
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !selectedTransaction) return;
    
    const amount = parseFloat(paymentAmount);
    payFiado(selectedClient.id, selectedTransaction.id, amount);
    
    toast({
      title: "Pagamento registrado!",
      description: `R$ ${amount.toFixed(2)} recebido de ${selectedClient.name}`,
    });
    
    setSelectedClient(null);
    setSelectedTransaction(null);
    setPaymentAmount('');
    setIsPaymentDialogOpen(false);
  };

  const handleMarkAsPaid = (clientId: string, transactionId: string, clientName: string, amount: number) => {
    markFiadoAsPaid(clientId, transactionId);
    toast({
      title: "Pagamento confirmado!",
      description: `Fiado de ${clientName} marcado como pago (R$ ${amount.toFixed(2)})`,
    });
  };

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  // Função para calcular o valor unitário correto
  const getUnitPrice = (description: string, transactionAmount: number) => {
    try {
      // Extrair o nome do item da descrição (remover quantidade e barbeiro)
      const itemName = description.replace(/^\d+x\s*/, '').replace(/\s*\([^)]*\)$/, '').trim();
      
      // Buscar o preço atual do produto
      const product = products.find(p => p.name.toLowerCase() === itemName.toLowerCase());
      if (product) {
        return product.price;
      }
      
      // Buscar o preço atual do serviço
      const service = services.find(s => s.type.toLowerCase() === itemName.toLowerCase());
      if (service) {
        return service.price;
      }
      
      // Se não encontrar, usar o valor da transação dividido pela quantidade (fallback)
      const quantity = parseInt(description.match(/^(\d+)x/)?.[1] || '1');
      return transactionAmount / quantity;
    } catch (error) {
      console.error('Erro ao calcular valor unitário:', error);
      // Fallback seguro
      const quantity = parseInt(description.match(/^(\d+)x/)?.[1] || '1');
      return transactionAmount / quantity;
    }
  };

  // Funções para formatação de data (igual ao dashboard)
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

  // Cálculos para resumo
  const totalFiado = fiadoClients.reduce((sum, client) => sum + client.totalDebt, 0);
  const totalClients = fiadoClients.length;
  const totalPendingTransactions = fiadoClients.reduce((sum, client) => 
    sum + client.transactions.filter(t => t.status === 'pending').length, 0
  );

  // Filtros
  const filteredClients = fiadoClients.filter(client => {
    // Filtro por telefone
    const phoneMatch = !phoneFilter || 
      (client.phone && client.phone.includes(phoneFilter)) ||
      client.name.toLowerCase().includes(phoneFilter.toLowerCase());

    // Filtro por data
    let dateMatch = true;
    if (dateFrom || dateTo) {
      const clientHasTransactionInRange = client.transactions.some(transaction => {
        const transactionDate = new Date(transaction.date);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate && toDate) {
          return transactionDate >= fromDate && transactionDate <= toDate;
        } else if (fromDate) {
          return transactionDate >= fromDate;
        } else if (toDate) {
          return transactionDate <= toDate;
        }
        return true;
      });
      dateMatch = clientHasTransactionInRange;
    }
    
    return phoneMatch && dateMatch;
  }).sort((a, b) => {
    // Ordenar por data da transação mais recente
    const aLatestDate = a.transactions.length > 0 ? new Date(a.transactions[0].date) : new Date(0);
    const bLatestDate = b.transactions.length > 0 ? new Date(b.transactions[0].date) : new Date(0);
    return bLatestDate.getTime() - aLatestDate.getTime();
  });

  // Paginação para clientes filtrados
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  // Reset para página 1 quando filtro muda
  useEffect(() => {
    setCurrentPage(1);
  }, [phoneFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fiado</h1>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pendente</p>
                <p className="text-xl font-bold text-destructive">R$ {totalFiado.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-xl font-bold text-foreground">{totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transações</p>
                <p className="text-xl font-bold text-foreground">{totalPendingTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Filtro por telefone */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="Buscar por telefone..."
              className="pl-10 h-11"
            />
          </div>
        </div>
        
        {/* Filtros por data */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-40 justify-start text-left font-normal h-11"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? (
                  format(parseDateFromInput(dateFrom) || new Date(), "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Data inicial</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={parseDateFromInput(dateFrom)}
                onSelect={(date) => setDateFrom(formatDateForInput(date))}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-40 justify-start text-left font-normal h-11"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? (
                  format(parseDateFromInput(dateTo) || new Date(), "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Data final</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={parseDateFromInput(dateTo)}
                onSelect={(date) => setDateTo(formatDateForInput(date))}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Botão limpar filtros */}
        {(phoneFilter || dateFrom || dateTo) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPhoneFilter('');
              setDateFrom('');
              setDateTo('');
            }}
            className="w-full sm:w-auto h-11 whitespace-nowrap"
          >
            Limpar
          </Button>
        )}
      </div>
      
      {/* Contador de resultados */}
      {(phoneFilter || dateFrom || dateTo) && (
        <p className="text-sm text-muted-foreground">
          {filteredClients.length} cliente(s) encontrado(s)
        </p>
      )}

      {/* Lista de clientes */}
      {currentClients.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Nenhum cliente com fiado encontrado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {currentClients.map(client => (
            <Card key={client.id} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleClientExpansion(client.id)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg flex-shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">{client.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs sm:text-sm text-muted-foreground">
                        {client.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        <span>{client.transactions.length} {client.transactions.length === 1 ? 'transação' : 'transações'}</span>
                        {client.transactions.length > 0 && client.transactions[0].date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{client.transactions[0].date.toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="text-right">
                      <p className="text-sm sm:text-lg font-bold text-destructive">
                        R$ {client.totalDebt.toFixed(2)}
                      </p>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                        expandedClients.has(client.id) ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </div>
                
                {expandedClients.has(client.id) && (
                  <div className="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Transações:</h4>
                      {client.transactions.map(transaction => (
                        <div key={transaction.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={transaction.status === 'paid' ? 'default' : 'destructive'}>
                                  {transaction.status === 'paid' ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Pago
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pendente
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm">{transaction.description}</p>
                            </div>
                            
                            <div className="text-right">
                              <span className="text-sm text-muted-foreground">Valor unitário:</span>
                              <div className="font-bold text-lg">
                                R$ {getUnitPrice(transaction.description, transaction.amount).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          {transaction.status === 'pending' && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="w-full sm:w-auto text-xs sm:text-sm"
                                    onClick={() => {
                                      setSelectedClient(client);
                                      setSelectedTransaction(transaction);
                                      setIsPaymentDialogOpen(true);
                                    }}
                                  >
                                    Pagamento Parcial
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="mx-4 sm:mx-0 max-w-md sm:max-w-lg w-full">
                                  <DialogHeader>
                                    <DialogTitle className="text-lg sm:text-xl">Receber Pagamento Parcial</DialogTitle>
                                    <DialogDescription className="text-sm sm:text-base">
                                      Cliente: {client.name} - Valor: R$ {transaction.amount.toFixed(2)}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <form onSubmit={handlePayment} className="space-y-6">
                                    <div className="space-y-3">
                                      <Label htmlFor="amount" className="text-base font-medium">Valor Recebido</Label>
                                      <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                          <span className="text-gray-500 sm:text-sm">R$</span>
                                        </div>
                                        <Input
                                          id="amount"
                                          type="number"
                                          step="0.01"
                                          max={transaction.amount}
                                          value={paymentAmount}
                                          onChange={(e) => setPaymentAmount(e.target.value)}
                                          placeholder="0,00"
                                          className="pl-10 h-12 text-lg font-medium border-2 focus:border-primary transition-colors"
                                          required
                                        />
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        Valor restante: R$ {(transaction.amount - parseFloat(paymentAmount || '0')).toFixed(2)}
                                      </p>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="flex-1 h-12"
                                        onClick={() => {
                                          setSelectedClient(null);
                                          setSelectedTransaction(null);
                                          setPaymentAmount('');
                                          setIsPaymentDialogOpen(false);
                                        }}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button type="submit" className="flex-1 h-12 text-base font-medium">
                                        Registrar Pagamento
                                      </Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="default" className="w-full sm:w-auto text-xs sm:text-sm">
                                    Marcar como Pago
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="mx-4 sm:mx-0 max-w-md">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-lg">Confirmar Pagamento</AlertDialogTitle>
                                    <AlertDialogDescription className="text-base">
                                      Tem certeza que deseja marcar esta transação como paga?
                                      <br />
                                      <br />
                                      <strong>Cliente:</strong> {client.name}
                                      <br />
                                      <strong>Item:</strong> {transaction.description}
                                      <br />
                                      <strong>Valor:</strong> R$ {transaction.amount.toFixed(2)}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                    <AlertDialogCancel className="w-full sm:w-auto">
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                                      onClick={() => handleMarkAsPaid(client.id, transaction.id, client.name, transaction.amount)}
                                    >
                                      Confirmar Pagamento
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="w-full sm:w-auto"
          >
            Anterior
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Página {currentPage} de {totalPages}</span>
            <span>({filteredClients.length} clientes)</span>
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
  );
}
