
import { 
  DollarSign, 
  Package, 
  Users, 
  CreditCard, 
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { products, transactions, fiadoClients, barbers, loading } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log('Dashboard render', { products, transactions, fiadoClients, barbers, loading });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando dados do painel...</div>;
  }

  // Cálculos do dashboard com dados atualizados
  const today = new Date().toDateString();
  const todayTransactions = transactions.filter(t => 
    t.date.toDateString() === today && t.status === 'completed'
  );
  
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalFiado = fiadoClients.reduce((sum, c) => sum + c.totalDebt, 0);
  const stockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  
  const topBarber = barbers[0] || { name: 'Nenhum barbeiro' };

  // Função de refresh mais suave
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Aguardar um pouco para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 500));
      // Recarregar a página para atualizar todos os dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu negócio</p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {todayTransactions.length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiado Pendente</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">R$ {totalFiado.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {fiadoClients.filter(c => c.totalDebt > 0).length} clientes com débito
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {fiadoClients.reduce((sum, c) => sum + c.transactions.filter(t => t.status === 'pending').length, 0)} transações pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stockValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {products.length} produtos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barbeiros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{topBarber.name}</div>
            <p className="text-xs text-muted-foreground">
              {barbers.length} barbeiros cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e informações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lowStockProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Estoque Baixo
              </CardTitle>
              <CardDescription>
                Produtos que precisam de reposição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockProducts.map(product => (
                  <div key={product.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-orange-600">
                      {product.stock} unidades
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumo do Dia
            </CardTitle>
            <CardDescription>
              Atividades de hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Produtos vendidos:</span>
                <span className="font-medium">
                  {todayTransactions.filter(t => t.type === 'product').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Serviços realizados:</span>
                <span className="font-medium">
                  {todayTransactions.filter(t => t.type === 'service').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Vendas no fiado:</span>
                <span className="font-medium text-orange-600">
                  {todayTransactions.filter(t => t.paymentMethod === 'fiado').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Valor em fiado hoje:</span>
                <span className="font-medium text-orange-600">
                  R$ {todayTransactions.filter(t => t.paymentMethod === 'fiado').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total de transações:</span>
                <span className="font-medium">
                  {todayTransactions.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
