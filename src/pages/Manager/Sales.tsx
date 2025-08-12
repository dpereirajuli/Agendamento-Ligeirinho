
import { useState } from 'react';
import { ShoppingCart, Plus, Scissors, Trash2, Minus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PhoneInput } from '@/components/Manager/PhoneInput';

type CartItem = {
  id: string;
  type: 'product' | 'service';
  name: string;
  price: number;
  quantity: number;
  barberId?: string;
  barberName?: string;
  stock?: number;
};

export default function Sales() {
  const { products, services, barbers, addTransaction, updateTransaction, transactions, user, updateProduct } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [currentServicePage, setCurrentServicePage] = useState(1);
  const [servicesPerPage] = useState(6);
  const { toast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTab, setCurrentTab] = useState('products');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  
  const [checkoutData, setCheckoutData] = useState({
    paymentMethod: 'dinheiro' as 'dinheiro' | 'cartao' | 'pix' | 'fiado',
    clientName: '',
    clientPhone: '',
  });

  const addToCart = (item: any, type: 'product' | 'service', barberId?: string) => {
    if (type === 'product' && item.stock <= 0) {
      toast({
        title: "Produto sem estoque",
        description: "Este produto não está disponível.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'service' && !barberId) {
      toast({
        title: "Selecione um barbeiro",
        description: "É necessário selecionar um barbeiro para o serviço.",
        variant: "destructive",
      });
      return;
    }

    const existingItem = cart.find(cartItem => 
      cartItem.id === item.id && 
      cartItem.type === type && 
      (type === 'service' ? cartItem.barberId === barberId : true)
    );

    if (existingItem) {
      if (type === 'product' && existingItem.quantity >= item.stock) {
        toast({
          title: "Estoque insuficiente",
          description: "Não há mais unidades disponíveis.",
          variant: "destructive",
        });
        return;
      }
      
      setCart(cart.map(cartItem =>
        cartItem.id === item.id && cartItem.type === type && 
        (type === 'service' ? cartItem.barberId === barberId : true)
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      const barber = barberId ? barbers.find(b => b.id === barberId) : undefined;
      setCart([...cart, {
        id: item.id,
        type: type,
        name: item.name || item.type,
        price: item.price,
        quantity: 1,
        barberId: barberId,
        barberName: barber?.name,
        stock: item.stock,
      }]);
    }

    toast({
      title: "Adicionado ao carrinho",
      description: `${item.name || item.type} foi adicionado ao carrinho.`,
    });
  };

  const updateQuantity = (id: string, type: 'product' | 'service', barberId: string | undefined, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => 
        !(item.id === id && item.type === type && item.barberId === barberId)
      ));
      return;
    }

    const item = cart.find(cartItem => 
      cartItem.id === id && cartItem.type === type && cartItem.barberId === barberId
    );
    
    if (item && item.type === 'product' && item.stock && newQuantity > item.stock) {
      toast({
        title: "Estoque insuficiente",
        description: "Quantidade solicitada maior que o estoque disponível.",
        variant: "destructive",
      });
      return;
    }

    setCart(cart.map(cartItem =>
      cartItem.id === id && cartItem.type === type && cartItem.barberId === barberId
        ? { ...cartItem, quantity: newQuantity }
        : cartItem
    ));
  };

  const removeFromCart = (id: string, type: 'product' | 'service', barberId?: string) => {
    setCart(cart.filter(item => 
      !(item.id === id && item.type === type && item.barberId === barberId)
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePhoneChange = (phone: string, foundClientName?: string) => {
    setCheckoutData(prev => ({
      ...prev,
      clientPhone: phone,
      clientName: foundClientName || prev.clientName
    }));
  };

  const handleNameChange = (newName: string) => {
    setCheckoutData(prev => ({ ...prev, clientName: newName }));
    
    // Se há um telefone e o nome foi alterado, atualizar todas as transações deste cliente
    if (checkoutData.clientPhone && newName) {
      const phoneNumbers = checkoutData.clientPhone.replace(/\D/g, '');
      if (phoneNumbers.length >= 10) {
        // Encontrar todas as transações com este telefone
        const clientTransactions = transactions.filter(t => 
          t.clientPhone && t.clientPhone.replace(/\D/g, '') === phoneNumbers
        );
        
        // Atualizar o nome em todas as transações deste cliente
        clientTransactions.forEach(transaction => {
          if (transaction.clientName !== newName) {
            updateTransaction(transaction.id, { ...transaction, clientName: newName });
          }
        });
      }
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ou serviços ao carrinho primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (checkoutData.paymentMethod === 'fiado' && (!checkoutData.clientName || !checkoutData.clientPhone)) {
      toast({
        title: "Dados obrigatórios",
        description: "Para vendas fiado, nome e telefone são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const total = getCartTotal();
    const description = cart.map(item => 
      `${item.quantity}x ${item.name}${item.barberName ? ` (${item.barberName})` : ''}`
    ).join(', ');

    // Atualizar estoque dos produtos
    const productUpdates = cart
      .filter(item => item.type === 'product')
      .map(async (item) => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await updateProduct(item.id, { stock: product.stock - item.quantity });
        }
      });

    Promise.all(productUpdates).then(() => {
      addTransaction({
        type: cart.some(item => item.type === 'product') ? 'product' : 'service',
        description,
        amount: total,
        user: user?.name || '',
        status: checkoutData.paymentMethod === 'fiado' ? 'pending' : 'completed',
        paymentMethod: checkoutData.paymentMethod,
        barberId: cart.find(item => item.barberId)?.barberId,
        clientName: checkoutData.clientName || undefined,
        clientPhone: checkoutData.clientPhone || undefined,
      });

      setCart([]);
      setIsCheckoutOpen(false);
      setCheckoutData({
        paymentMethod: 'dinheiro',
        clientName: '',
        clientPhone: '',
      });

      toast({
        title: "Venda realizada",
        description: `Venda de R$ ${total.toFixed(2)} ${checkoutData.paymentMethod === 'fiado' ? 'registrada como fiado' : 'concluída'}.`,
      });
    });
  };



  return (
    <div className="space-y-6">

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger value="products" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Produtos</TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-red-500 data-[state=active]:text-black">Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products
                .filter(p => p.stock > 0)
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(product => (
              <Card key={product.id} className="hover:shadow-md transition-shadow border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>
                    Estoque: {product.stock} unidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">
                      R$ {product.price.toFixed(2)}
                    </div>
                    <Button 
                      onClick={() => addToCart(product, 'product')}
                      size="sm"
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-white"
              >
                Anterior
              </Button>
              <span className="py-2 px-4 bg-gray-100 rounded">
                Página {currentPage} de {Math.ceil(products.filter(p => p.stock > 0).length / itemsPerPage)}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(products.filter(p => p.stock > 0).length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(products.filter(p => p.stock > 0).length / itemsPerPage)}
                className="bg-white"
              >
                Próxima
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          {barbers.length > 0 && (
            <Card className="border-gray-200 bg-black text-white">
              <CardHeader>
                <CardTitle className="text-white">Selecionar Barbeiro</CardTitle>
                <CardDescription className="text-gray-300">Escolha o barbeiro que realizará o serviço</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                  <SelectTrigger className="bg-white text-black border-gray-300">
                    <SelectValue placeholder="Selecione um barbeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {barbers.map(barber => (
                      <SelectItem key={barber.id} value={barber.id}>
                        {barber.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services
                .slice((currentServicePage - 1) * servicesPerPage, currentServicePage * servicesPerPage)
                .map(service => (
              <Card key={service.id} className="hover:shadow-md transition-shadow border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scissors className="h-5 w-5 text-gray-600" />
                    {service.type}
                  </CardTitle>
                  <CardDescription>
                    Serviço profissional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">
                      R$ {service.price.toFixed(2)}
                    </div>
                    <Button
                      onClick={() => addToCart(service, 'service', selectedBarber)}
                      size="sm"
                      disabled={!selectedBarber}
                      className="bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-400"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentServicePage(prev => Math.max(1, prev - 1))}
                disabled={currentServicePage === 1}
                className="bg-white"
              >
                Anterior
              </Button>
              <span className="py-2 px-4 bg-gray-100 rounded">
                Página {currentServicePage} de {Math.ceil(services.length / servicesPerPage)}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentServicePage(prev => Math.min(Math.ceil(services.length / servicesPerPage), prev + 1))}
                disabled={currentServicePage === Math.ceil(services.length / servicesPerPage)}
                className="bg-white"
              >
                Próxima
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Carrinho */}
      {cart.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Carrinho de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={`${item.id}-${item.type}-${item.barberId}-${index}`} className="p-3 border border-gray-200 rounded-lg">
                  {/* Informações do item */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-base">{item.name}</h4>
                      {item.barberName && (
                        <p className="text-sm text-gray-600">Barbeiro: {item.barberName}</p>
                      )}
                      <p className="text-sm text-gray-600">R$ {item.price.toFixed(2)} cada</p>
                    </div>
                    
                    <div className="text-right sm:text-left">
                      <p className="font-bold text-lg">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Controles de quantidade e remoção */}
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.type, item.barberId, item.quantity - 1)}
                        className="border-gray-300 h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.type, item.barberId, item.quantity + 1)}
                        className="border-gray-300 h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFromCart(item.id, item.type, item.barberId)}
                      className="bg-red-600 hover:bg-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <span className="text-xl font-bold">Total:</span>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-xl font-bold text-gray-900">R$ {getCartTotal().toFixed(2)}</span>
                    <Button 
                      onClick={() => setIsCheckoutOpen(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Finalizar Venda
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Checkout */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
            <DialogDescription>
              Complete os dados da venda
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select 
                value={checkoutData.paymentMethod} 
                onValueChange={(value: any) => setCheckoutData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="fiado">Fiado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {checkoutData.paymentMethod === 'fiado' && (
              <>
                <PhoneInput
                  value={checkoutData.clientPhone}
                  onChange={handlePhoneChange}
                  label="Telefone"
                  required
                />
                
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome do Cliente *</Label>
                  <Input
                    id="clientName"
                    value={checkoutData.clientName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
              </>
            )}

            {checkoutData.paymentMethod !== 'fiado' && (
              <>
                <PhoneInput
                  value={checkoutData.clientPhone}
                  onChange={handlePhoneChange}
                  label="Telefone (opcional)"
                  required={false}
                />
                
                <div className="space-y-2">
                  <Label htmlFor="clientNameOptional">Nome do Cliente (opcional)</Label>
                  <Input
                    id="clientNameOptional"
                    value={checkoutData.clientName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
              </>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-xl font-bold mb-4">
                <span>Total:</span>
                <span className="text-gray-900">R$ {getCartTotal().toFixed(2)}</span>
              </div>
              
              <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                Confirmar Venda
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
