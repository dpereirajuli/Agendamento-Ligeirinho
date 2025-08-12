import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar, DollarSign, Download, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface MarketingClient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  last_purchase?: string;
  total_spent: number;
  purchase_count: number;
  created_at: string;
}

export default function Marketing() {
  const { toast } = useToast();
  const [clients, setClients] = useState<MarketingClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<MarketingClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!dateFrom && !dateTo) return matchesSearch;

      const clientDate = new Date(client.last_purchase || client.created_at);
      const matchesDateFrom = !dateFrom || clientDate >= dateFrom;
      const matchesDateTo = !dateTo || clientDate <= dateTo;

      return matchesSearch && matchesDateFrom && matchesDateTo;
    });
    setFilteredClients(filtered);
  }, [clients, searchTerm, dateFrom, dateTo]);

  const fetchClients = async () => {
    try {
      console.log('Fetching marketing clients data...');
      
      // Primeiro, vamos buscar os dados de clientes das transações
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('client_name, client_phone, amount, created_at')
        .not('client_name', 'is', null);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        throw transactionsError;
      }

      console.log('Transactions data:', transactions);

      // Agrupar dados por cliente
      const clientsMap = new Map();

      transactions?.forEach(transaction => {
        const clientKey = `${transaction.client_name}-${transaction.client_phone || ''}`;
        
        if (clientsMap.has(clientKey)) {
          const existingClient = clientsMap.get(clientKey);
          existingClient.total_spent += parseFloat(transaction.amount.toString());
          existingClient.purchase_count += 1;
          // Atualizar última compra se for mais recente
          if (new Date(transaction.created_at) > new Date(existingClient.last_purchase)) {
            existingClient.last_purchase = transaction.created_at;
          }
        } else {
          clientsMap.set(clientKey, {
            id: `client-${Date.now()}-${Math.random()}`,
            name: transaction.client_name,
            phone: transaction.client_phone,
            email: null, // Pode ser expandido futuramente
            total_spent: parseFloat(transaction.amount.toString()),
            purchase_count: 1,
            last_purchase: transaction.created_at,
            created_at: transaction.created_at
          });
        }
      });

      const clientsArray = Array.from(clientsMap.values());
      console.log('Processed clients:', clientsArray);

      // Tentar sincronizar com a tabela marketing_clients
      for (const client of clientsArray) {
        try {
          const { data: existingClient } = await supabase
            .from('marketing_clients')
            .select('*')
            .eq('name', client.name)
            .eq('phone', client.phone || '')
            .single();

          if (!existingClient) {
            // Inserir novo cliente
            await supabase
              .from('marketing_clients')
              .insert({
                name: client.name,
                phone: client.phone,
                email: client.email,
                total_spent: client.total_spent,
                purchase_count: client.purchase_count,
                last_purchase: client.last_purchase
              });
          } else {
            // Atualizar cliente existente
            await supabase
              .from('marketing_clients')
              .update({
                total_spent: client.total_spent,
                purchase_count: client.purchase_count,
                last_purchase: client.last_purchase
              })
              .eq('id', existingClient.id);
          }
        } catch (error) {
          console.error('Error syncing client:', error);
        }
      }

      // Buscar dados atualizados da tabela marketing_clients
      const { data: marketingData, error: marketingError } = await supabase
        .from('marketing_clients')
        .select('*')
        .order('total_spent', { ascending: false });

      if (marketingError) {
        console.error('Error fetching marketing clients:', marketingError);
        // Se não conseguir buscar da tabela marketing_clients, usar dados processados
        setClients(clientsArray.sort((a, b) => b.total_spent - a.total_spent));
      } else {
        console.log('Marketing clients data:', marketingData);
        const mappedClients = marketingData?.map(client => ({
          ...client,
          total_spent: parseFloat(client.total_spent?.toString() || '0')
        })) || [];
        setClients(mappedClients);
      }

    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleExportToExcel = () => {
    if (filteredClients.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há clientes para exportar com os filtros aplicados",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredClients.map(client => ({
      'Nome': client.name,
      'Telefone': client.phone || '',
      'Email': client.email || '',
      'Última Compra': formatDate(client.last_purchase),
      'Total Gasto': client.total_spent,
      'Número de Compras': client.purchase_count,
      'Cliente desde': formatDate(client.created_at)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes Marketing');

    // Definir larguras das colunas
    const colWidths = [
      { wch: 25 }, // Nome
      { wch: 15 }, // Telefone
      { wch: 30 }, // Email
      { wch: 15 }, // Última Compra
      { wch: 15 }, // Total Gasto
      { wch: 15 }, // Número de Compras
      { wch: 15 }  // Cliente desde
    ];
    ws['!cols'] = colWidths;

    const dateRange = dateFrom && dateTo 
      ? `_${format(dateFrom, 'dd-MM-yyyy')}_a_${format(dateTo, 'dd-MM-yyyy')}`
      : dateFrom 
        ? `_apartir_${format(dateFrom, 'dd-MM-yyyy')}`
        : dateTo
          ? `_ate_${format(dateTo, 'dd-MM-yyyy')}`
          : '';

    const fileName = `clientes_marketing${dateRange}_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;
    
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Exportação concluída",
      description: `${filteredClients.length} clientes exportados para ${fileName}`,
    });
  };

  if (loading) {
    return <div className="p-4">Carregando clientes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
          <p className="text-gray-600">Clientes para campanhas promocionais</p>
        </div>
        <Button onClick={handleExportToExcel} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
            autoComplete="off"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-gray-400" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                De: {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Até: {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setDateFrom(undefined);
                setDateTo(undefined);
              }}
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Mostrando {filteredClients.length} de {clients.length} clientes
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredClients.map(client => (
          <Card key={client.id} className="border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                {client.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Cliente desde {formatDate(client.created_at)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {client.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{client.phone}</span>
                </div>
              )}
              
              {client.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 truncate">{client.email}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">Última compra: {formatDate(client.last_purchase)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">Total gasto: {formatCurrency(client.total_spent)}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Compras:</span>
                  <span className="font-semibold">{client.purchase_count}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && !loading && (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Tente usar outros termos de busca'
              : 'Clientes aparecerão aqui conforme realizarem compras'
            }
          </p>
        </div>
      )}
    </div>
  );
}
