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
  setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addBarber: (barber: Omit<Barber, 'id'>) => Promise<void>;
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
    }
  }, [profile]);



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
          name: b.name
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
          })).sort((a, b) => b.date.getTime() - a.date.getTime()) || []
        }));
        console.log('Mapped fiado clients:', mappedFiado);
        setFiadoClients(mappedFiado);
      }
      console.log('fetchData finalizado com sucesso');
    } catch (error) {
      console.error('Erro no fetchData:', error);
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

  const addBarber = async (barber: Omit<Barber, 'id'>) => {
    const { data, error } = await supabase
      .from('barbers')
      .insert({
        name: barber.name
      })
      .select()
      .single();

    if (error) throw error;
    if (data) {
      setBarbers(prev => [...prev, {
        id: data.id,
        name: data.name
      }]);
    }
  };

  const updateBarber = async (id: string, barber: Partial<Barber>) => {
    const updateData: any = {};
    if (barber.name) updateData.name = barber.name;

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
          status: 'pending',
          created_at: new Date().toISOString()
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
      setBarbers,
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
