import { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, TrendingUp, Filter, MoreHorizontal, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet-async';

interface User {
  role: 'admin' | 'client';
  name: string;
}

interface Appointment {
  id: number;
  client_name: string;
  service_id: string;
  barber_id: number;
  date: string;
  start_time: string;
  phone: string;
  notes: string;
  status?: 'pending' | 'confirmed' | 'canceled' | 'cancelled'; // Aceita ambos os formatos
}

interface Barber {
  id: number;
  name: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export default function Admin() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(parsedUser);
    } else {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: barbersData } = await supabase.from('barbers').select('*').order('name');
    setBarbers(barbersData || []);

    const { data: appointmentsData } = await supabase.from('bookings').select('*').order('date, start_time');
    setAppointments(appointmentsData || []);

    // Buscar serviços do banco
    const { data: servicesData, error: servicesError } = await supabase.from('services').select('*').order('name');
    if (!servicesError && servicesData) setServices(servicesData);
    setLoading(false);
  };

  // Remover campo de data única e botão 'Hoje', deixar apenas data inicial e final
  const isAnyFilterActive = !!filterStartDate || !!filterEndDate || filterStatus !== 'all';
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredAppointments = appointments.filter(appointment => {
    let pass = true;
    if (!filterStartDate && !filterEndDate && filterStatus === 'all') {
      pass = true;
    } else {
      if (!filterStartDate && !filterEndDate && filterStatus !== 'all') {
        pass = pass && appointment.date === todayStr;
      }
      if (filterStartDate) pass = pass && appointment.date >= filterStartDate;
      if (filterEndDate) pass = pass && appointment.date <= filterEndDate;
      if (filterStatus !== 'all') pass = pass && (appointment.status || 'pending') === filterStatus;
    }
    return pass;
  });

  // Função para buscar múltiplos serviços
  const getServices = (serviceId: string) => {
    if (!serviceId) return [];
    return serviceId.split(',').map(id => services.find(s => String(s.id) === String(id)) || { name: 'Desconhecido', price: 0 });
  };

  const totalAppointments = appointments.filter(a => a.status !== 'canceled' && a.status !== 'cancelled').length;
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today && a.status !== 'canceled' && a.status !== 'cancelled').length;
  const upcomingAppointments = appointments.filter(a => a.date > today && a.status !== 'canceled' && a.status !== 'cancelled').length;
  const totalRevenue = appointments.filter(a => a.status !== 'canceled' && a.status !== 'cancelled').reduce((sum, a) => {
    const servicesList = getServices(a.service_id);
    return sum + servicesList.reduce((s, srv) => s + srv.price, 0);
  }, 0);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    return `${day} de ${meses[parseInt(month, 10) - 1]}.`;
  };

  const getBarberName = (barberId: number | string) => {
    return barbers.find(b => b.id === Number(barberId))?.name || 'Desconhecido';
  };

  const cleanPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return `+55${digits}`;
  };

  const confirmAppointment = (appointment: Appointment) => {
    const servicesList = getServices(appointment.service_id);
    let serviceNames = '';
    if (servicesList.length === 1) {
      serviceNames = servicesList[0].name;
    } else if (servicesList.length === 2) {
      serviceNames = servicesList[0].name + ' e ' + servicesList[1].name;
    } else if (servicesList.length > 2) {
      serviceNames = servicesList.slice(0, -1).map(s => s.name).join(', ') + ' e ' + servicesList[servicesList.length - 1].name;
    }
    const message = `Olá ${appointment.client_name}, seu agendamento para ${serviceNames} no dia ${formatDate(appointment.date)} às ${appointment.start_time} foi confirmado.`;
    const url = `https://wa.me/${cleanPhone(appointment.phone)}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Painel Administrativo | Barbearia Premium São Paulo</title>
        <meta name="description" content="Painel administrativo da Barbearia Premium em São Paulo. Gerencie agendamentos, barbeiros e serviços." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header 
          isAuthenticated={true} 
          userRole={user.role} 
          onLogout={handleLogout}
        />
        
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
              <p className="text-muted-foreground">
                Gerencie agendamentos e monitore o desempenho da sua barbearia
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card-premium p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Agendamentos</p>
                    <p className="text-2xl font-bold">{totalAppointments}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hoje</p>
                    <p className="text-2xl font-bold">{todayAppointments}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Próximos</p>
                    <p className="text-2xl font-bold">{upcomingAppointments}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Receita</p>
                    <p className="text-2xl font-bold">R$ {totalRevenue}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div>

            {/* Filtros acima da lista de agendamentos */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <Input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                <Input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setFilterStatus('all'); }}>Limpar Filtros</Button>
            </div>

            {/* Appointments Section */}
            <div className="card-premium p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-xl font-semibold mb-4 sm:mb-0">{isAnyFilterActive ? 'Agendamentos do Filtro' : 'Agendamentos do Dia'}</h2>
                
              </div>

              {/* Appointments List */}
              {loading ? (
                <p>Carregando...</p>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => {
                    const servicesList = getServices(appointment.service_id);
                    const barberName = getBarberName(appointment.barber_id);
                    return (
                      <div key={appointment.id} className="border border-border/20 rounded-lg p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                              <h3 className="font-semibold">{appointment.client_name}</h3>
                              <span className={
                                `inline-flex px-2 py-1 rounded-full text-xs font-medium w-fit ` +
                                ((appointment.status === 'confirmed') ? 'bg-green-100 text-green-800' :
                                  (appointment.status === 'canceled' || appointment.status === 'cancelled') ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800')
                              }>
                                {(appointment.status === 'confirmed') ? 'Confirmado' :
                                  (appointment.status === 'canceled' || appointment.status === 'cancelled') ? 'Cancelado' :
                                  'Pendente'}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <p><span className="font-semibold">Barbeiro:</span> {barberName}</p>
                              {(() => {
                                let serviceNames = '';
                                if (servicesList.length === 1) {
                                  serviceNames = servicesList[0].name;
                                } else if (servicesList.length === 2) {
                                  serviceNames = servicesList[0].name + ' e ' + servicesList[1].name;
                                } else if (servicesList.length > 2) {
                                  serviceNames = servicesList.slice(0, -1).map(s => s.name).join(', ') + ' e ' + servicesList[servicesList.length - 1].name;
                                }
                                return <p><span className="font-semibold">Serviços:</span> {serviceNames}</p>;
                              })()}
                              <p>{formatDate(appointment.date)} às {appointment.start_time}</p>
                              <p>Telefone: {appointment.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-lg font-semibold text-primary">
                              R$ {servicesList.reduce((s, srv) => s + srv.price, 0)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const { error } = await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', appointment.id);
                                    if (error) {
                                      toast({ title: 'Erro ao confirmar', description: error.message, variant: 'destructive' });
                                    } else {
                                      toast({ title: 'Agendamento confirmado!' });
                                      await fetchData();
                                    }
                                  }}
                                >
                                  Confirmar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const { error } = await supabase.from('bookings').update({ status: 'pending' }).eq('id', appointment.id);
                                    if (error) {
                                      toast({ title: 'Erro ao marcar como pendente', description: error.message, variant: 'destructive' });
                                    } else {
                                      toast({ title: 'Agendamento marcado como pendente!' });
                                      await fetchData();
                                    }
                                  }}
                                >
                                  Pendente
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const { error } = await supabase.from('bookings').update({ status: 'canceled' }).eq('id', appointment.id);
                                    if (error) {
                                      toast({ title: 'Erro ao cancelar', description: error.message, variant: 'destructive' });
                                    } else {
                                      toast({ title: 'Agendamento cancelado!' });
                                      await fetchData();
                                    }
                                  }}
                                >
                                  Cancelar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => confirmAppointment(appointment)}>
                                  Notificar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
                                      const { error } = await supabase.from('bookings').delete().eq('id', appointment.id);
                                      if (error) {
                                        toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
                                      } else {
                                        toast({ title: 'Agendamento excluído!' });
                                        await fetchData();
                                      }
                                    }
                                  }}
                                >
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredAppointments.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhum agendamento encontrado para o filtro selecionado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
