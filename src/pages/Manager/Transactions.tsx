import { useState, useEffect } from 'react';
import { Receipt, Filter, Calendar, DollarSign, User, Trash2, Scissors, Package } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import AdminPasswordDialog from '@/components/Manager/AdminPasswordDialog';
import { useToast } from '@/hooks/use-toast';

export default function Transactions() {
  const { transactions, barbers, deleteTransaction } = useApp();
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [barberFilter, setBarberFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 10 transações por página

  // Função para separar e organizar itens da descrição
  const parseTransactionDescription = (description: string, transactionType: string) => {
    const items = description.split(', ').map(item => item.trim());
    const services: string[] = [];
    const products: string[] = [];

    // Se a transação é do tipo 'service', todos os itens são serviços
    if (transactionType === 'service') {
      services.push(...items);
    }
    // Se a transação é do tipo 'product', todos os itens são produtos
    else if (transactionType === 'product') {
      products.push(...items);
    }
    // Se é uma transação mista (contém ambos), separar por padrão
    else {
      items.forEach(item => {
        // Verificar se o item contém o nome de algum barbeiro
        const containsBarberName = barbers.some(barber => 
          item.includes(barber.name)
        );
        
        // Verificar se contém palavras-chave de serviços
        const serviceKeywords = [
          'corte', 'barba', 'sobrancelha', 'pigmentação', 'hidratação', 
          'escova', 'pintura', 'progressiva', 'relaxamento', 'selagem',
          'botox', 'botox capilar', 'luzes', 'mechas', 'coloração'
        ];
        const containsServiceKeyword = serviceKeywords.some(keyword => 
          item.toLowerCase().includes(keyword)
        );
        
        // Se contém parênteses e nome de barbeiro, é um serviço
        if (item.includes('(') && item.includes(')') && containsBarberName) {
          services.push(item);
        } 
        // Se contém parênteses e palavras-chave de serviço, é um serviço
        else if (item.includes('(') && item.includes(')') && containsServiceKeyword) {
          services.push(item);
        }
        // Se contém apenas palavras-chave de serviço (sem parênteses), pode ser um serviço
        else if (containsServiceKeyword && !item.includes('(')) {
          services.push(item);
        } else {
          products.push(item);
        }
      });
    }

    return { services, products };
  };



  const filteredTransactions = transactions.filter(transaction => {
    // Sempre usar a lógica de detecção baseada na descrição, independente do tipo no banco
    const { services, products } = parseTransactionDescription(transaction.description, transaction.type);
    
    // Lógica de filtragem baseada no conteúdo real
    if (filter === 'product' && products.length === 0) {
      return false;
    }
    if (filter === 'service' && services.length === 0) {
      return false;
    }
    
    if (paymentFilter !== 'all' && transaction.paymentMethod !== paymentFilter) return false;
    if (barberFilter !== 'all' && transaction.barberId !== barberFilter) return false;
    
    if (dateFilter) {
      // Garantir comparação local no formato YYYY-MM-DD
      const pad = n => n.toString().padStart(2, '0');
      let d = transaction.date;
      if (!(d instanceof Date)) d = new Date(d);
      const tDate = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      if (tDate !== dateFilter) return false;
    }
    
    return true;
  }).sort((a, b) => b.date.getTime() - a.date.getTime()); // Ordena por data de cadastro (mais recente primeiro)

  // Paginação para transações filtradas
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset para página 1 quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, paymentFilter, barberFilter, dateFilter]);

  // Só contabilizar transações completed (incluindo fiados pagos) e aplicar os filtros
  const totalRevenue = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const todayRevenue = filteredTransactions
    .filter(t => t.status === 'completed' && t.date.toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingRevenue = filteredTransactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'product': return 'bg-gray-200 text-gray-800';
      case 'service': return 'bg-gray-300 text-gray-900';
      case 'mixed': return 'bg-purple-200 text-purple-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentColor = (method: string) => {
    switch (method) {
      case 'dinheiro': return 'bg-gray-600 text-white';
      case 'cartao': return 'bg-gray-700 text-white';
      case 'pix': return 'bg-gray-800 text-white';
      case 'fiado': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gray-900 text-white';
      case 'pending': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getBarberName = (barberId: string | undefined) => {
    if (!barberId) return '';
    const barber = barbers.find(b => b.id === barberId);
    return barber ? barber.name : '';
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      await deleteTransaction(transactionToDelete);

      toast({
        title: "Transação excluída",
        description: "A transação foi removida com sucesso.",
      });

      setTransactionToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setFilter('all');
    setPaymentFilter('all');
    setBarberFilter('all');
    setDateFilter('');
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600">Histórico completo de vendas</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Confirmada</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">
              {transactions.filter(t => t.status === 'completed').length} transações pagas
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {pendingRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-600">
              {transactions.filter(t => t.status === 'pending').length} aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">R$ {todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-600">
              {transactions.filter(t => t.date.toDateString() === new Date().toDateString()).length} transações hoje
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <Receipt className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</div>
            <p className="text-xs text-gray-600">
              {transactions.length > filteredTransactions.length ? 
                `de ${transactions.length} totais` : 
                'Todas as transações'
              }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="product">Produtos</SelectItem>
                  <SelectItem value="service">Serviços</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pagamento</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos pagamentos</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="fiado">Fiado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Barbeiro</Label>
              <Select value={barberFilter} onValueChange={setBarberFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos barbeiros</SelectItem>
                  {barbers.map(barber => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              Mostrando {filteredTransactions.length} de {transactions.length} transações
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

      {/* Lista de transações */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma transação encontrada
              </h3>
              <p className="text-gray-600">
                Ajuste os filtros ou registre uma nova venda
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentTransactions.map(transaction => (
              <Card key={transaction.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {(() => {
                          const { services, products } = parseTransactionDescription(transaction.description, transaction.type);
                          let badgeType = 'mixed';
                          let badgeText = 'Misto';
                          
                          if (services.length > 0 && products.length === 0) {
                            badgeType = 'service';
                            badgeText = 'Serviço';
                          } else if (products.length > 0 && services.length === 0) {
                            badgeType = 'product';
                            badgeText = 'Produto';
                          }
                          
                          return (
                            <Badge className={getTypeColor(badgeType)}>
                              {badgeText}
                            </Badge>
                          );
                        })()}
                        <Badge className={getPaymentColor(transaction.paymentMethod)}>
                          {transaction.paymentMethod === 'dinheiro' ? 'Dinheiro' :
                           transaction.paymentMethod === 'cartao' ? 'Cartão' :
                           transaction.paymentMethod === 'pix' ? 'PIX' : 'Fiado'}
                        </Badge>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status === 'completed' ? 'Pago' : 'Pendente'}
                        </Badge>
                        {transaction.barberId && (
                          <Badge variant="outline" className="flex items-center gap-1 border-gray-300">
                            <User className="h-3 w-3" />
                            {getBarberName(transaction.barberId)}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mb-2">
                        {(() => {
                          const { services, products } = parseTransactionDescription(transaction.description, transaction.type);
                          return (
                            <div className="space-y-2">
                              {/* Quando filtro é "Todos os tipos" - mostrar separação */}
                              {filter === 'all' && (
                                <>
                                  {/* Se há apenas serviços, mostrar sem título de seção */}
                                  {services.length > 0 && products.length === 0 && (
                                    <div className="space-y-1">
                                      {services.map((service, index) => (
                                        <p key={index} className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded border-l-2 border-gray-300">
                                          {service}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Se há apenas produtos, mostrar sem título de seção */}
                                  {products.length > 0 && services.length === 0 && (
                                    <div className="space-y-1">
                                      {products.map((product, index) => (
                                        <p key={index} className="text-sm text-gray-900 bg-blue-50 px-2 py-1 rounded border-l-2 border-blue-300">
                                          {product}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Se há ambos, mostrar com títulos de seção */}
                                  {services.length > 0 && products.length > 0 && (
                                    <>
                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                          <Scissors className="h-3 w-3" />
                                          Serviços:
                                        </p>
                                        <div className="space-y-1">
                                          {services.map((service, index) => (
                                            <p key={index} className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded border-l-2 border-gray-300">
                                              {service}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                          <Package className="h-3 w-3" />
                                          Produtos:
                                        </p>
                                        <div className="space-y-1">
                                          {products.map((product, index) => (
                                            <p key={index} className="text-sm text-gray-900 bg-blue-50 px-2 py-1 rounded border-l-2 border-blue-300">
                                              {product}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </>
                              )}
                              
                              {/* Quando filtro é "Serviços" - mostrar apenas serviços */}
                              {filter === 'service' && services.length > 0 && (
                                <div className="space-y-1">
                                  {services.map((service, index) => (
                                    <p key={index} className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded border-l-2 border-gray-300">
                                      {service}
                                    </p>
                                  ))}
                                </div>
                              )}
                              
                              {/* Quando filtro é "Produtos" - mostrar apenas produtos */}
                              {filter === 'product' && products.length > 0 && (
                                <div className="space-y-1">
                                  {products.map((product, index) => (
                                    <p key={index} className="text-sm text-gray-900 bg-blue-50 px-2 py-1 rounded border-l-2 border-blue-300">
                                      {product}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                        <span>Por: {transaction.user}</span>
                        <span>{transaction.date.toLocaleString()}</span>
                        {transaction.clientName && (
                          <span>Cliente: {transaction.clientName}</span>
                        )}
                        {transaction.clientPhone && (
                          <span>Tel: {transaction.clientPhone}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          transaction.status === 'completed' ? 'text-gray-900' : 'text-red-600'
                        }`}>
                          R$ {transaction.amount.toFixed(2)}
                        </p>
                        {transaction.status === 'pending' && (
                          <p className="text-xs text-red-600 font-medium">
                            Aguardando pagamento
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setTransactionToDelete(transaction.id);
                          setDeleteDialogOpen(true);
                        }}
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
                ({filteredTransactions.length} transações)
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

      <AdminPasswordDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteTransaction}
        title="Excluir Transação"
        description="Esta ação não pode ser desfeita. Digite sua senha de administrador para confirmar a exclusão da transação."
      />
    </div>
  );
}
