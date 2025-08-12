
import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, User, Calendar, Check, Clock, Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function Fiado() {
  const { fiadoClients, payFiado, markFiadoAsPaid } = useApp();
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 2 colunas em mobile, 3 em desktop

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
  };

  const handleMarkAsPaid = (clientId: string, transactionId: string, clientName: string, amount: number) => {
    markFiadoAsPaid(clientId, transactionId);
    toast({
      title: "Pagamento confirmado!",
      description: `Fiado de ${clientName} marcado como pago (R$ ${amount.toFixed(2)})`,
    });
  };

  const totalFiado = fiadoClients.reduce((sum, client) => sum + client.totalDebt, 0);
  const clientsWithDebt = fiadoClients.filter(client => client.totalDebt > 0);
  const totalPendingTransactions = fiadoClients.reduce((sum, client) => 
    sum + client.transactions.filter(t => t.status === 'pending').length, 0
  );

  // Filtrar clientes por telefone
  const filteredClients = clientsWithDebt.filter(client => {
    if (!phoneFilter) return true;
    return client.phone?.includes(phoneFilter) || false;
  });

  // Paginação para clientes filtrados
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  // Reset para página 1 quando filtro muda
  useEffect(() => {
    setCurrentPage(1);
  }, [phoneFilter]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiado</h1>
          <p className="text-gray-600">Controle de vendas a prazo</p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-600">Total em fiado</p>
          <p className="text-2xl font-bold text-red-600">
            R$ {totalFiado.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalFiado.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <User className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{clientsWithDebt.length}</div>
            <p className="text-xs text-gray-600">
              com débito pendente
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalPendingTransactions}</div>
            <p className="text-xs text-gray-600">
              aguardando pagamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="phoneFilter">Filtrar por Telefone</Label>
            <Input
              id="phoneFilter"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="Digite o telefone para filtrar..."
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de clientes */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Clientes com Débito</h2>
          {phoneFilter && (
            <p className="text-sm text-gray-600">
              Mostrando {filteredClients.length} de {clientsWithDebt.length} clientes
            </p>
          )}
        </div>
        
        {filteredClients.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {phoneFilter ? 'Nenhum cliente encontrado' : 'Nenhum débito pendente'}
              </h3>
              <p className="text-gray-600">
                {phoneFilter ? 'Ajuste o filtro ou verifique o telefone' : 'Todos os clientes estão em dia com os pagamentos!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {currentClients.map(client => (
              <Card key={client.id} className="border-gray-200">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <CardDescription>
                        {client.phone && (
                          <span className="block">Tel: {client.phone}</span>
                        )}
                        {client.transactions.length} transação(ões)
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">
                        R$ {client.totalDebt.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Histórico de Transações:</h4>
                    {client.transactions.map(transaction => (
                      <div key={transaction.id} className="flex flex-col md:flex-row md:justify-between md:items-center p-3 bg-gray-50 rounded-lg gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'} 
                                   className={transaction.status === 'paid' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}>
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
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Calendar className="h-3 w-3" />
                            {transaction.date.toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">
                            R$ {transaction.amount.toFixed(2)}
                          </span>
                          
                          {transaction.status === 'pending' && (
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedClient(client);
                                      setSelectedTransaction(transaction);
                                    }}
                                    className="border-gray-300 hover:bg-gray-50"
                                  >
                                    Pagamento Parcial
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Receber Pagamento Parcial</DialogTitle>
                                    <DialogDescription>
                                      Cliente: {client.name} - Valor: R$ {transaction.amount.toFixed(2)}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <form onSubmit={handlePayment} className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="amount">Valor Recebido (R$)</Label>
                                      <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        max={transaction.amount}
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="0.00"
                                        required
                                      />
                                    </div>
                                    
                                    <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                                      Registrar Pagamento
                                    </Button>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                size="sm" 
                                onClick={() => handleMarkAsPaid(client.id, transaction.id, client.name, transaction.amount)}
                                className="bg-gray-900 hover:bg-gray-800 text-white"
                              >
                                Marcar como Pago
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
                ({filteredClients.length} clientes)
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
