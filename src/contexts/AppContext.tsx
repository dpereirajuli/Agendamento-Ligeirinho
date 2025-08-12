import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
}

interface Service {
  id: string;
  type: string;
  price: number;
}

interface Barber {
  id: string;
  name: string;
  services: number;
}

interface Transaction {
  id: string;
  type: 'product' | 'service' | 'fiado' | 'mixed';
  description: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending';
  paymentMethod: 'dinheiro' | 'cartao' | 'pix' | 'fiado';
  barberId?: string;
  user?: string;
  clientName?: string;
  clientPhone?: string;
}

interface FiadoTransaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  status: 'pending' | 'paid';
}

interface FiadoClient {
  id: string;
  name: string;
  phone?: string;
  totalDebt: number;
  transactions: FiadoTransaction[];
}

interface AppContextType {
  products: Product[];
  services: Service[];
  barbers: Barber[];
  transactions: Transaction[];
  fiadoClients: FiadoClient[];
  user: any;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addBarber: (barber: Omit<Barber, 'id' | 'services'>) => Promise<void>;
  updateBarber: (id: string, barber: Partial<Barber>) => Promise<void>;
  deleteBarber: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  payFiado: (clientId: string, transactionId: string, amount: number) => Promise<void>;
  markFiadoAsPaid: (clientId: string, transactionId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType & { loading: boolean } | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fiadoClients, setFiadoClients] = useState<FiadoClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AppProvider useEffect, profile:', profile);
    if (profile) {
      setLoading(true);
      fetchData().finally(() => {
        setLoading(false);
        console.log('setLoading(false) chamado no AppProvider');
      });
      checkAndResetMonthlyServices();
    }
  }, [profile]);

  const checkAndResetMonthlyServices = async () => {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const lastResetKey = `barber_services_reset_${currentYear}_${currentMonth}`;
      
      // Verificar se já foi resetado este mês
      const lastReset = localStorage.getItem(lastResetKey);
      
      if (!lastReset) {
        // Resetar serviços de todos os barbeiros
        const { error } = await supabase
          .from('barbers')
          .update({ services: 0 });
        
        if (error) {
          console.error('Error resetting barber services:', error);
        } else {
          console.log('Barber services reset for new month');
          localStorage.setItem(lastResetKey, 'true');
          
          // Limpar chaves antigas do localStorage
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('barber_services_reset_') && key !== lastResetKey) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in checkAndResetMonthlyServices:', error);
    }
  };

  const fetchData = async () => {
    try {
      console.log('Iniciando fetchData...');
      
      // Fetch products
      const { data: productsData, error: productsError } = await supabase.from('products').select('*');
      console.log('Products data:', productsData, 'Error:', productsError);
      
      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else if (productsData) {
        const mappedProducts = productsData.map(p => ({
          id: p.id,
          name: p.name,
          price: parseFloat(p.price.toString()),
          stock: p.stock,
          minStock: p.min_stock
        }));
        console.log('Mapped products:', mappedProducts);
        setProducts(mappedProducts);
      }

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase.from('services').select('*');
      console.log('Services data:', servicesData, 'Error:', servicesError);
      
      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      } else if (servicesData) {
        const mappedServices = servicesData.map(s => ({
          id: s.id,
          type: s.type,
          price: parseFloat(s.price.toString())
        }));
        console.log('Mapped services:', mappedServices);
        setServices(mappedServices);
      }

      // Fetch barbers
      const { data: barbersData, error: barbersError } = await supabase.from('barbers').select('*');
      console.log('Barbers data:', barbersData, 'Error:', barbersError);
      
      if (barbersError) {
        console.error('Error fetching barbers:', barbersError);
      } else if (barbersData) {
        const mappedBarbers = barbersData.map(b => ({
          id: b.id,
          name: b.name,
          services: b.services || 0
        }));
        console.log('Mapped barbers:', mappedBarbers);
        setBarbers(mappedBarbers);
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase.from('transactions').select('*');
      console.log('Transactions data:', transactionsData, 'Error:', transactionsError);
      
      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else if (transactionsData) {
        const mappedTransactions = transactionsData.map(t => ({
          id: t.id,
          type: t.type as 'product' | 'service' | 'fiado',
          description: t.description,
          amount: parseFloat(t.amount.toString()),
          date: new Date(t.created_at),
          status: t.status as 'completed' | 'pending',
          paymentMethod: t.payment_method as 'dinheiro' | 'cartao' | 'pix' | 'fiado',
          barberId: t.barber_id,
          user: profile?.name,
          clientName: t.client_name,
          clientPhone: t.client_phone
        }));
        console.log('Mapped transactions:', mappedTransactions);
        setTransactions(mappedTransactions);
        
        // Recalcular serviços dos barbeiros baseado nas transações do mês atual
        await updateBarbersServiceCount(mappedTransactions);
      }

      // Fetch fiado clients with their transactions
      const { data: fiadoData, error: fiadoError } = await supabase.from('fiado_clients').select(`
        *,
        fiado_transactions (*)
      `);
      console.log('Fiado data:', fiadoData, 'Error:', fiadoError);
      
      if (fiadoError) {
        console.error('Error fetching fiado data:', fiadoError);
      } else if (fiadoData) {
        const mappedFiado = fiadoData.map(f => ({
          id: f.id,
          name: f.name,
          phone: f.phone,
          totalDebt: parseFloat(f.total_debt?.toString() || '0'),
          transactions: f.fiado_transactions?.map((ft: any) => ({
            id: ft.id,
            description: ft.description,
            amount: parseFloat(ft.amount.toString()),
            date: new Date(ft.created_at),
            status: ft.status
          })) || []
        }));
        console.log('Mapped fiado clients:', mappedFiado);
        setFiadoClients(mappedFiado);
      }
      console.log('fetchData finalizado com sucesso');
    } catch (error) {
      console.error('Erro no fetchData:', error);
    }
  };

  const updateBarbersServiceCount = async (transactionsData: Transaction[]) => {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Contar TODOS os serviços por barbeiro no mês atual (incluindo fiados)
      const serviceCountByBarber: { [key: string]: number } = {};
      
      // Contar serviços de todas as transações de serviço, independente do status
      transactionsData.forEach(transaction => {
        if (transaction.type === 'service' && 
            transaction.barberId && 
            transaction.date.getMonth() === currentMonth &&
            transaction.date.getFullYear() === currentYear) {
          
          // Extrair quantidade de serviços da descrição
          const match = transaction.description.match(/^(\d+)x/);
          const quantity = match ? parseInt(match[1]) : 1;
          
          serviceCountByBarber[transaction.barberId] = (serviceCountByBarber[transaction.barberId] || 0) + quantity;
        }
      });

      console.log('Service count by barber:', serviceCountByBarber);

      // Atualizar cada barbeiro no banco
      for (const barberId in serviceCountByBarber) {
        await supabase
          .from('barbers')
          .update({ services: serviceCountByBarber[barberId] })
          .eq('id', barberId);
      }

      // Buscar dados atualizados dos barbeiros
      const { data: updatedBarbers } = await supabase.from('barbers').select('*');
      if (updatedBarbers) {
        const mappedBarbers = updatedBarbers.map(b => ({
          id: b.id,
          name: b.name,
          services: serviceCountByBarber[b.id] || 0
        }));
        setBarbers(mappedBarbers);
      }
    } catch (error) {
      console.error('Error updating barber service count:', error);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    console.log('Adding product:', product);
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        price: product.price,
        stock: product.stock,
        min_stock: product.minStock
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      throw error;
    }
    
    if (data) {
      const newProduct = {
        id: data.id,
        name: data.name,
        price: parseFloat(data.price.toString()),
        stock: data.stock,
        minStock: data.min_stock
      };
      console.log('Product added successfully:', newProduct);
      setProducts(prev => [...prev, newProduct]);
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    const updateData: any = {};
    if (product.name) updateData.name = product.name;
    if (product.price) updateData.price = product.price;
    if (product.stock !== undefined) updateData.stock = product.stock;
    if (product.minStock !== undefined) updateData.min_stock = product.minStock;

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    fetchData();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addService = async (service: Omit<Service, 'id'>) => {
    console.log('Adding service:', service);
    const { data, error } = await supabase
      .from('services')
      .insert({
        type: service.type,
        price: service.price
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding service:', error);
      throw error;
    }
    
    if (data) {
      const newService = {
        id: data.id,
        type: data.type,
        price: parseFloat(data.price.toString())
      };
      console.log('Service added successfully:', newService);
      setServices(prev => [...prev, newService]);
    }
  };

  const updateService = async (id: string, service: Partial<Service>) => {
    const updateData: any = {};
    if (service.type) updateData.type = service.type;
    if (service.price) updateData.price = service.price;

    const { error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    fetchData();
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const addBarber = async (barber: Omit<Barber, 'id' | 'services'>) => {
    const { data, error } = await supabase
      .from('barbers')
      .insert({
        name: barber.name,
        services: 0
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setBarbers(prev => [...prev, {
        id: data.id,
        name: data.name,
        services: data.services || 0
      }]);
    }
  };

  const updateBarber = async (id: string, barber: Partial<Barber>) => {
    const updateData: any = {};
    if (barber.name) updateData.name = barber.name;
    if (barber.services !== undefined) updateData.services = barber.services;

    const { error } = await supabase
      .from('barbers')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    fetchData();
  };

  const deleteBarber = async (id: string) => {
    const { error } = await supabase
      .from('barbers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setBarbers(prev => prev.filter(b => b.id !== id));
  };

  // Função para determinar o tipo correto da transação baseado na descrição
  const determineTransactionType = (description: string, originalType: string): string => {
    const items = description.split(', ').map(item => item.trim());
    const hasServices = items.some(item => item.includes('(') && item.includes(')'));
    const hasProducts = items.some(item => !item.includes('(') || !item.includes(')'));
    
    if (hasServices && hasProducts) {
      return 'mixed';
    } else if (hasServices) {
      return 'service';
    } else if (hasProducts) {
      return 'product';
    }
    
    return originalType;
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    // Determinar o tipo correto baseado no conteúdo
    const correctType = determineTransactionType(transaction.description, transaction.type);
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        type: correctType,
        description: transaction.description,
        amount: transaction.amount,
        user_id: profile?.id,
        barber_id: transaction.barberId,
        client_name: transaction.clientName,
        client_phone: transaction.clientPhone,
        payment_method: transaction.paymentMethod,
        status: transaction.status
      })
      .select()
      .single();

    if (error) throw error;
    
    // Se for um serviço ou misto, atualizar contador do barbeiro
    if ((correctType === 'service' || correctType === 'mixed') && transaction.barberId) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Extrair quantidade de serviços da descrição
      const match = transaction.description.match(/^(\d+)x/);
      const quantity = match ? parseInt(match[1]) : 1;
      
      // Contar serviços do barbeiro no mês atual (incluindo transações mistas)
      const servicesThisMonth = transactions.filter(t => 
        (t.type === 'service' || t.type === 'mixed') && 
        t.barberId === transaction.barberId &&
        t.date.getMonth() === currentMonth &&
        t.date.getFullYear() === currentYear
      ).reduce((sum, t) => {
        // Para transações mistas, contar apenas os itens que são serviços
        if (t.type === 'mixed') {
          const items = t.description.split(', ').map(item => item.trim());
          const serviceItems = items.filter(item => item.includes('(') && item.includes(')'));
          return sum + serviceItems.length;
        } else {
          const tMatch = t.description.match(/^(\d+)x/);
          const tQuantity = tMatch ? parseInt(tMatch[1]) : 1;
          return sum + tQuantity;
        }
      }, 0) + quantity; // +1 para incluir o novo serviço
      
      await supabase
        .from('barbers')
        .update({ services: servicesThisMonth })
        .eq('id', transaction.barberId);
    }
    
    // If it's a fiado transaction, also create fiado client and transaction
    if (transaction.paymentMethod === 'fiado' && transaction.clientName) {
      // Check if client exists
      let { data: existingClient } = await supabase
        .from('fiado_clients')
        .select('*')
        .eq('name', transaction.clientName)
        .eq('phone', transaction.clientPhone || '')
        .single();

      let clientId = existingClient?.id;

      if (!existingClient) {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('fiado_clients')
          .insert({
            name: transaction.clientName,
            phone: transaction.clientPhone,
            total_debt: transaction.amount
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      } else {
        // Update existing client debt
        const newDebt = parseFloat(existingClient.total_debt?.toString() || '0') + transaction.amount;
        await supabase
          .from('fiado_clients')
          .update({ total_debt: newDebt })
          .eq('id', clientId);
      }

      // Create fiado transaction
      await supabase
        .from('fiado_transactions')
        .insert({
          client_id: clientId,
          transaction_id: data.id,
          amount: transaction.amount,
          description: transaction.description,
          status: 'pending'
        });
    }

    fetchData();
  };

  const deleteTransaction = async (id: string) => {
    try {
      // Buscar a transação antes de deletar
      const transactionToDelete = transactions.find(t => t.id === id);
      
      if (transactionToDelete) {
        // Se for fiado, remover também do fiado
        if (transactionToDelete.paymentMethod === 'fiado') {
          // Buscar transação fiado relacionada
          const { data: fiadoTransaction } = await supabase
            .from('fiado_transactions')
            .select('*')
            .eq('transaction_id', id)
            .single();
          
          if (fiadoTransaction) {
            // Remover da dívida do cliente
            const { data: client } = await supabase
              .from('fiado_clients')
              .select('*')
              .eq('id', fiadoTransaction.client_id)
              .single();
            
            if (client) {
              const newDebt = Math.max(0, parseFloat(client.total_debt?.toString() || '0') - fiadoTransaction.amount);
              await supabase
                .from('fiado_clients')
                .update({ total_debt: newDebt })
                .eq('id', client.id);
            }
            
            // Deletar transação fiado
            await supabase
              .from('fiado_transactions')
              .delete()
              .eq('id', fiadoTransaction.id);
          }
        }
        
        // Se for um serviço ou misto, decrementar contador do barbeiro
        if ((transactionToDelete.type === 'service' || transactionToDelete.type === 'mixed') && transactionToDelete.barberId) {
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          // Só decrementar se for do mês atual
          if (transactionToDelete.date.getMonth() === currentMonth && 
              transactionToDelete.date.getFullYear() === currentYear) {
            
            // Extrair quantidade de serviços da descrição
            let quantity = 1;
            if (transactionToDelete.type === 'mixed') {
              const items = transactionToDelete.description.split(', ').map(item => item.trim());
              const serviceItems = items.filter(item => item.includes('(') && item.includes(')'));
              quantity = serviceItems.length;
            } else {
              const match = transactionToDelete.description.match(/^(\d+)x/);
              quantity = match ? parseInt(match[1]) : 1;
            }
            
            // Buscar contador atual do barbeiro
            const { data: barber } = await supabase
              .from('barbers')
              .select('services')
              .eq('id', transactionToDelete.barberId)
              .single();
            
            if (barber) {
              const newServiceCount = Math.max(0, (barber.services || 0) - quantity);
              await supabase
                .from('barbers')
                .update({ services: newServiceCount })
                .eq('id', transactionToDelete.barberId);
            }
          }
        }

        // Se for um produto ou misto, restaurar o estoque
        if (transactionToDelete.type === 'product' || transactionToDelete.type === 'mixed') {
          // Extrair produtos e quantidades da descrição
          const itemsMatch = transactionToDelete.description.match(/(\d+)x ([^(]+)/g);
          if (itemsMatch) {
            const productUpdates = itemsMatch.map(async (match) => {
              const [_, quantity, productName] = match.match(/(\d+)x (.+)/)!;
              const product = products.find(p => p.name.trim() === productName.trim());
              if (product) {
                await updateProduct(product.id, { stock: product.stock + parseInt(quantity) });
              }
            });
            await Promise.all(productUpdates);
          }
        }
      }
      
      // Deletar a transação principal
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Recarregar dados
      fetchData();
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const payFiado = async (clientId: string, transactionId: string, amount: number) => {
    // Update fiado transaction to reduce amount or mark as paid
    const { data: fiadoTransaction } = await supabase
      .from('fiado_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fiadoTransaction) {
      const currentAmount = parseFloat(fiadoTransaction.amount.toString());
      const remainingAmount = currentAmount - amount;

      if (remainingAmount <= 0) {
        // Mark fiado transaction as paid
        await supabase
          .from('fiado_transactions')
          .update({ status: 'paid' })
          .eq('id', transactionId);

        // Update the original transaction status to completed
        if (fiadoTransaction.transaction_id) {
          await supabase
            .from('transactions')
            .update({ 
              status: 'completed',
              payment_method: 'dinheiro' // ou o método usado para pagar
            })
            .eq('id', fiadoTransaction.transaction_id);
        }
      } else {
        // Update amount
        await supabase
          .from('fiado_transactions')
          .update({ amount: remainingAmount })
          .eq('id', transactionId);
      }

      // Update client total debt
      const { data: client } = await supabase
        .from('fiado_clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (client) {
        const newDebt = parseFloat(client.total_debt?.toString() || '0') - amount;
        await supabase
          .from('fiado_clients')
          .update({ total_debt: Math.max(0, newDebt) })
          .eq('id', clientId);
      }
    }

    fetchData();
  };

  const markFiadoAsPaid = async (clientId: string, transactionId: string) => {
    // Get transaction amount
    const { data: fiadoTransaction } = await supabase
      .from('fiado_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fiadoTransaction) {
      const amount = parseFloat(fiadoTransaction.amount.toString());
      
      // Mark fiado transaction as paid
      await supabase
        .from('fiado_transactions')
        .update({ status: 'paid' })
        .eq('id', transactionId);

      // Update the original transaction status to completed
      if (fiadoTransaction.transaction_id) {
        await supabase
          .from('transactions')
          .update({ 
            status: 'completed',
            payment_method: 'dinheiro' // ou o método usado para pagar
          })
          .eq('id', fiadoTransaction.transaction_id);
      }

      // Update client total debt
      const { data: client } = await supabase
        .from('fiado_clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (client) {
        const newDebt = parseFloat(client.total_debt?.toString() || '0') - amount;
        await supabase
          .from('fiado_clients')
          .update({ total_debt: Math.max(0, newDebt) })
          .eq('id', clientId);
      }
    }

    fetchData();
  };

  return (
    <AppContext.Provider value={{
      products,
      services,
      barbers,
      transactions,
      fiadoClients,
      user: profile,
      loading,
      addProduct,
      updateProduct,
      deleteProduct,
      addService,
      updateService,
      deleteService,
      addBarber,
      updateBarber,
      deleteBarber,
      addTransaction,
      deleteTransaction,
      payFiado,
      markFiadoAsPaid
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
