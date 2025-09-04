import { useState, useEffect } from 'react';
import { Receipt, Filter, Calendar, DollarSign, User, Trash2, Scissors, Package, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdminPasswordDialog from '@/components/Manager/AdminPasswordDialog';
import { useToast } from '@/hooks/use-toast';

export default function Transactions() {
  const { transactions, barbers, fiadoClients, deleteTransaction } = useApp();
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [barberFilter, setBarberFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  // Reset para página 1 quando filtros ou itemsPerPage mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, paymentFilter, barberFilter, dateFilter, itemsPerPage]);

  // Só contabilizar transações completed (incluindo fiados pagos) e aplicar os filtros
  const totalRevenue = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);


  // Calcular valor pendente considerando pagamentos parciais de fiado e filtros aplicados
  const pendingRevenue = (() => {
    // Valor das transações pendentes filtradas (não fiado)
    const nonFiadoPending = filteredTransactions
      .filter(t => t.status === 'pending' && t.paymentMethod !== 'fiado')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Para dívidas de fiado, só incluir se não há filtros de data ou barbeiro aplicados
    // pois fiadoClients não tem essas informações detalhadas
    let fiadoPending = 0;
    
    // Se não há filtros de data ou barbeiro, incluir todas as dívidas de fiado
    if (!dateFilter && barberFilter === 'all') {
      fiadoPending = fiadoClients
        .reduce((sum, client) => sum + client.totalDebt, 0);
    } else {
      // Se há filtros específicos, só incluir dívidas de fiado se há transações de fiado filtradas
      const fiadoTransactions = filteredTransactions.filter(t => t.paymentMethod === 'fiado');
      if (fiadoTransactions.length > 0) {
        // Calcular proporção baseada nas transações de fiado filtradas
        const totalFiadoAmount = fiadoTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalFiadoDebt = fiadoClients.reduce((sum, client) => sum + client.totalDebt, 0);
        const totalFiadoTransactions = transactions.filter(t => t.paymentMethod === 'fiado').reduce((sum, t) => sum + t.amount, 0);
        
        if (totalFiadoTransactions > 0) {
          fiadoPending = (totalFiadoAmount / totalFiadoTransactions) * totalFiadoDebt;
        }
      }
    }
    
    return nonFiadoPending + fiadoPending;
  })();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'product': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'mixed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPaymentColor = (method: string) => {
    switch (method) {
      case 'dinheiro': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cartao': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pix': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'fiado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
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
          <h1 className="text-2xl font-bold text-foreground">Transações</h1>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Confirmada</p>
                <p className="text-xl font-bold text-foreground">R$ {totalRevenue.toFixed(2)}</p>
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
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-xl font-bold text-destructive">R$ {pendingRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Transações</p>
                <p className="text-xl font-bold text-foreground">{filteredTransactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="space-y-2">
            <Label className="text-sm">Tipo</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="product">Produtos</SelectItem>
                <SelectItem value="service">Serviços</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-2">
            <Label className="text-sm">Pagamento</Label>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-11">
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
        </div>

        <div className="flex-1">
          <div className="space-y-2">
            <Label className="text-sm">Barbeiro</Label>
            <Select value={barberFilter} onValueChange={setBarberFilter}>
              <SelectTrigger className="h-11">
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
        </div>

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
        {(filter !== 'all' || paymentFilter !== 'all' || barberFilter !== 'all' || dateFilter) && (
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
      {(filter !== 'all' || paymentFilter !== 'all' || barberFilter !== 'all' || dateFilter) && (
        <p className="text-sm text-muted-foreground">
          {filteredTransactions.length} transação(ões) encontrada(s)
        </p>
      )}

      {/* Lista de transações */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card className="border-border">
            <CardContent className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma transação encontrada
              </h3>
              <p className="text-muted-foreground">
                Ajuste os filtros ou registre uma nova venda
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentTransactions.map(transaction => (
              <Card key={transaction.id} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
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
                            <Badge variant="outline" className="flex items-center gap-1 border-border">
                              <User className="h-3 w-3" />
                              {getBarberName(transaction.barberId)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          R$ {transaction.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.date.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      {(() => {
                        const { services, products } = parseTransactionDescription(transaction.description, transaction.type);
                        return (
                          <div className="space-y-2">
                            {/* Quando filtro é "Todos os tipos" - mostrar separação */}
                            {filter === 'all' && (services.length > 0 || products.length > 0) && (
                              <>
                                {services.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                      <Scissors className="h-3 w-3" />
                                      Serviços:
                                    </p>
                                    <div className="space-y-1">
                                      {services.map((service, index) => (
                                        <p key={index} className="text-sm text-foreground bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border-l-2 border-blue-500">
                                          {service}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {products.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                      <Package className="h-3 w-3" />
                                      Produtos:
                                    </p>
                                    <div className="space-y-1">
                                      {products.map((product, index) => (
                                        <p key={index} className="text-sm text-foreground bg-primary/10 px-2 py-1 rounded border-l-2 border-primary">
                                          {product}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
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
                                  <p key={index} className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded border-l-2 border-gray-300">
                                    {product}
                                  </p>
                                ))}
                              </div>
                            )}
                            
                            {/* Quando não há separação clara - mostrar descrição original */}
                            {filter !== 'all' && services.length === 0 && products.length === 0 && (
                              <p className="text-sm text-foreground bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded border-l-2 border-gray-300">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Informações adicionais */}
                    <div className="text-sm text-muted-foreground">
                      {transaction.clientName && (
                        <p className="mb-1">
                          <strong>Cliente:</strong> {transaction.clientName}
                          {transaction.clientPhone && ` (${transaction.clientPhone})`}
                        </p>
                      )}
                      {transaction.status === 'pending' && (
                        <p className="text-orange-600 dark:text-orange-400 font-medium">
                          Aguardando pagamento
                        </p>
                      )}
                    </div>
                    
                    {/* Botão de deletar */}
                    <div className="flex justify-end pt-2 border-t border-border">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setTransactionToDelete(transaction.id);
                          setDeleteDialogOpen(true);
                        }}
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
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
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
              <span>{filteredTransactions.length} transações</span>
              <span className="hidden sm:inline">•</span>
              <span>Mostrando {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)}</span>
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
