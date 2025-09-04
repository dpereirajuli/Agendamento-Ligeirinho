
import { useState } from 'react';
import { ShoppingCart, Plus, Trash2, Minus, Package, Scissors, User, ChevronDown } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const { products, services, barbers, addTransaction, transactions, user, updateProduct } = useApp();
  const { toast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  
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

  const updateBarberForItem = (id: string, type: 'product' | 'service', barberId: string) => {
    if (type !== 'service') return;
    
    const barber = barbers.find(b => b.id === barberId);
    if (!barber) return;

    setCart(prev => prev.map(item => 
      item.id === id && item.type === type
        ? { ...item, barberId, barberName: barber.name }
        : item
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
        
        // Nome do cliente atualizado para futuras transações
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



  // Filtrar e ordenar itens por busca
  const filteredProducts = products
    .filter(p => p.stock > 0 && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  
  const filteredServices = services
    .filter(s => s.type.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.type.localeCompare(b.type, 'pt-BR'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Coluna Principal - Produtos e Serviços */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header com busca e seleção de barbeiro */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar produtos e serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Produtos */}
        <div className="space-y-4">
          <div 
            className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
            onClick={() => setIsProductsExpanded(!isProductsExpanded)}
          >
            <Package className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Produtos</h2>
            <Badge variant="secondary">{filteredProducts.length}</Badge>
            <ChevronDown 
              className={`h-4 w-4 transition-transform duration-200 ml-auto ${
                isProductsExpanded ? 'rotate-180' : ''
              }`} 
            />
          </div>
          
          {isProductsExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
            {filteredProducts.map(product => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                        <span>Estoque: {product.stock}</span>
                        <span className="font-medium text-foreground">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => addToCart(product, 'product')}
                      size="sm"
                      className="ml-2"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </div>

        {/* Serviços */}
        <div className="space-y-4">
          <div 
            className="flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
            onClick={() => setIsServicesExpanded(!isServicesExpanded)}
          >
            <Scissors className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Serviços</h2>
            <Badge variant="secondary">{filteredServices.length}</Badge>
            <ChevronDown 
              className={`h-4 w-4 transition-transform duration-200 ml-auto ${
                isServicesExpanded ? 'rotate-180' : ''
              }`} 
            />
          </div>
          
          {isServicesExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
            {filteredServices.map(service => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {service.type}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          R$ {service.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => addToCart(service, 'service')}
                      size="sm"
                      className="ml-2"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </div>
      </div>

      {/* Carrinho Lateral */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carrinho
              {cart.length > 0 && (
                <Badge variant="secondary">{cart.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Carrinho vazio</p>
                <p className="text-sm text-muted-foreground">Adicione produtos ou serviços</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={`${item.id}-${item.type}-${item.barberId}-${index}`} className="p-3 border border-border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          {item.type === 'service' && (
                            <div className="mt-2">
                              <Select 
                                value={item.barberId || ''} 
                                onValueChange={(value) => updateBarberForItem(item.id, item.type, value)}
                              >
                                <SelectTrigger className={`h-11 text-base ${!item.barberId ? 'border-red-300 bg-red-50 text-red-600' : ''}`}>
                                  <SelectValue placeholder="Selecione barbeiro" />
                                </SelectTrigger>
                                <SelectContent>
                                  {barbers.map(barber => (
                                    <SelectItem key={barber.id} value={barber.id}>
                                      {barber.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id, item.type, item.barberId)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.type, item.barberId, item.quantity - 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.type, item.barberId, item.quantity + 1)}
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <span className="font-semibold text-sm">Unit: R$ {(item.price).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-lg font-bold text-foreground">R$ {getCartTotal().toFixed(2)}</span>
                  </div>
                  
                  <Button 
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full flex items-center justify-center gap-2"
                    size="lg"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Finalizar Venda
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Checkout */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
      <DialogContent className="mx-4 sm:mx-0 max-w-md sm:max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Finalizar Venda</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Complete os dados da venda
          </DialogDescription>
        </DialogHeader>
          
          <form onSubmit={handleCheckout} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Forma de Pagamento</Label>
              <Select 
                value={checkoutData.paymentMethod} 
                onValueChange={(value: any) => setCheckoutData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
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
                  <Label htmlFor="clientName" className="text-sm sm:text-base">Nome do Cliente *</Label>
                  <Input
                    id="clientName"
                    value={checkoutData.clientName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Nome completo"
                    className="h-10 sm:h-11 text-sm sm:text-base"
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
                  <Label htmlFor="clientNameOptional" className="text-sm sm:text-base">Nome do Cliente (opcional)</Label>
                  <Input
                    id="clientNameOptional"
                    value={checkoutData.clientName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Nome completo"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
              </>
            )}

            <div className="border-t pt-4 sm:pt-6">
              <div className="flex justify-between items-center text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                <span>Total:</span>
                <span className="text-foreground">R$ {getCartTotal().toFixed(2)}</span>
              </div>
              
              <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base">
                Confirmar Venda
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
