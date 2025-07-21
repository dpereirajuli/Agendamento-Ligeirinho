import { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, MessageSquare, Check, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/Header';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Helmet } from 'react-helmet-async';

interface Barber {
  id: number;
  name: string;
}

interface BarberSchedule {
  barber_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  active: boolean;
}

interface Booking {
  start_time: string;
  end_time: string;
}

interface BookingData {
  clientName: string;
  service: string;
  barberId: number;
  date: string;
  time: string;
  phone: string;
  notes: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

// Função utilitária para gerar o conteúdo do arquivo .ics
function generateICS(booking: any) {
  // Datas e horários no formato YYYY-MM-DD e HH:mm
  const startDate = booking.date.replace(/-/g, '');
  const startTime = booking.time.replace(':', '');
  // Duração em minutos (padrão: 1h se não informado)
  const duration = 60; // ou use booking.duration se disponível
  const [hour, minute] = booking.time.split(':').map(Number);
  const end = new Date(booking.date + 'T' + booking.time);
  end.setMinutes(end.getMinutes() + duration);
  const endDate = end.toISOString().slice(0,10).replace(/-/g, '');
  const endTime = end.toTimeString().slice(0,5).replace(':', '');

  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//BARBEARIA LIGEIRINHO//Booking//PT-BR\nBEGIN:VEVENT\nSUMMARY:Agendamento BARBEARIA LIGEIRINHO\nDESCRIPTION:Serviços: ${booking.services}\\nBarbeiro: ${booking.barber}\\nCliente: ${booking.client_name}\\nTelefone: ${booking.phone}${booking.notes ? '\\nObs: ' + booking.notes : ''}\nDTSTART;TZID=America/Sao_Paulo:${startDate}T${startTime}00\nDTEND;TZID=America/Sao_Paulo:${endDate}T${endTime}00\nLOCATION:BARBEARIA LIGEIRINHO\nEND:VEVENT\nEND:VCALENDAR`;
}

export default function Booking() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingData, setBookingData] = useState<BookingData>({
    clientName: '',
    service: '',
    barberId: 0,
    date: '',
    time: '',
    phone: '',
    notes: ''
  });
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barberSchedules, setBarberSchedules] = useState<Record<number, BarberSchedule[]>>({});
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [services, setServices] = useState<Service[]>([]);
  const [lastBooking, setLastBooking] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('*')
        .order('name');
      
      if (barbersError) {
        console.error('Erro ao buscar barbeiros:', barbersError);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar barbeiros.',
          variant: 'destructive'
        });
        return;
      }
      
      setBarbers(barbersData || []);

      const { data: schedulesData, error: schedulesError } = await supabase
        .from('barber_schedules')
        .select('*');
      
      if (schedulesError) {
        console.error('Erro ao buscar horários:', schedulesError);
        return;
      }
      
      const schedulesMap: Record<number, BarberSchedule[]> = {};
      schedulesData?.forEach(s => {
        if (!schedulesMap[s.barber_id]) schedulesMap[s.barber_id] = [];
        schedulesMap[s.barber_id].push(s);
      });
      setBarberSchedules(schedulesMap);

      // Buscar serviços do banco
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('name');
      if (servicesError) {
        console.error('Erro ao buscar serviços:', servicesError);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar serviços.',
          variant: 'destructive'
        });
        return;
      }
      setServices(servicesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => {
    if (selectedBarber !== null && selectedDate && selectedServices.length > 0) {
      fetchAvailableTimes();
    } else {
      setAvailableTimes([]);
    }
  }, [selectedBarber, selectedDate, selectedServices]);

  const fetchAvailableTimes = async () => {
    try {
      const dayOfWeek = getDayOfWeek(selectedDate);
      const schedules = barberSchedules[selectedBarber!] || [];
      const schedule = schedules.find(s => s.day_of_week === dayOfWeek);
      
      if (!schedule) {
        setAvailableTimes([]);
        return;
      }

      const startMin = timeToMinutes(schedule.start_time);
      const endMin = timeToMinutes(schedule.end_time);
      const duration = services.find(s => s.id === selectedServices[0])?.duration || 0;
      const step = 15;

      let possibles: string[] = [];
      for (let current = startMin; current + duration <= endMin; current += step) {
        possibles.push(minutesToTime(current));
      }

      // FILTRO: se a data for hoje, só mostrar horários futuros
      const now = new Date();
      const todayStr = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
      ].join('-');
      let filteredPossibles = possibles;
      if (selectedDate === todayStr) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        filteredPossibles = possibles.filter(time => timeToMinutes(time) > currentMinutes);
      }

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('barber_id', selectedBarber)
        .eq('date', selectedDate);

      if (bookingsError) {
        console.error('Erro ao buscar agendamentos:', bookingsError);
        return;
      }

      const bookings: Booking[] = bookingsData || [];

      const available = filteredPossibles.filter(start => {
        const end = addMinutes(start, duration);
        return !bookings.some(b => !(end <= b.start_time || start >= b.end_time));
      });

      setAvailableTimes(available);
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
    }
  };

  const getCalendarDays = (month: Date) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const paddingStart = firstDay.getDay();
    const calendar: {date: string | null, available: boolean}[] = [];

    for (let i = 0; i < paddingStart; i++) {
      calendar.push({date: null, available: false});
    }

    // Corrigir: gerar today manualmente, sem toLocaleDateString
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = [
        month.getFullYear(),
        String(month.getMonth() + 1).padStart(2, '0'),
        String(d).padStart(2, '0')
      ].join('-');
      // Permitir hoje e futuro
      const isTodayOrFuture = dateStr >= today;
      const dayOfWeek = getDayOfWeek(dateStr);
      const schedules = barberSchedules[selectedBarber!] || [];
      const available = isTodayOrFuture && schedules.some(s => s.day_of_week === dayOfWeek);
      calendar.push({date: dateStr, available});
    }

    return calendar;
  };

  const getDayOfWeek = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const getDayName = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', { weekday: 'long' });
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const addMinutes = (time: string, minutes: number): string => {
    const total = timeToMinutes(time) + minutes;
    return minutesToTime(total);
  };

  const selectedServicesData = services.filter(s => selectedServices.includes(s.id));
  const maxDuration = selectedServicesData.reduce((max, s) => Math.max(max, s.duration), 0);
  const totalPrice = selectedServicesData.reduce((sum, s) => sum + s.price, 0);
  const selectedBarberData = barbers.find(b => b.id === selectedBarber);

  const handleBooking = async () => {
    if (!(selectedServices.length > 0) || selectedBarber === null || !selectedDate || !selectedTime || !bookingData.clientName || !bookingData.phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios para continuar.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const duration = maxDuration;
      const endTime = addMinutes(selectedTime, duration);
      // Garantir data no timezone de São Paulo
      const dateSP = selectedDate; // já está no formato 'YYYY-MM-DD'

      const { data, error } = await supabase.from('bookings').insert({
        barber_id: selectedBarber,
        date: dateSP,
        start_time: selectedTime,
        end_time: endTime,
        client_name: bookingData.clientName,
        phone: bookingData.phone,
        notes: bookingData.notes,
        service_id: selectedServices.join(','),
      }).select();

      if (error) {
        console.error('Erro ao agendar:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao agendar. Tente novamente.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Agendamento confirmado!',
          description: `Seu horário foi agendado com ${selectedBarberData?.name} para ${formatDate(selectedDate)} às ${selectedTime}.`
        });
        // Salvar dados do comprovante
        setLastBooking({
          client_name: bookingData.clientName,
          phone: bookingData.phone,
          notes: bookingData.notes,
          services: selectedServicesData.map(s => s.name).join(', '),
          barber: selectedBarberData?.name,
          date: selectedDate,
          time: selectedTime,
          price: totalPrice,
          id: data && data[0] ? data[0].id : undefined
        });
        // Reset form
        setSelectedServices([]);
        setSelectedBarber(null);
        setSelectedDate('');
        setSelectedTime('');
        setBookingData({
          clientName: '',
          service: '',
          barberId: 0,
          date: '',
          time: '',
          phone: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Erro ao agendar:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao agendar. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = selectedServices.length > 0 && selectedBarber !== null && selectedDate && selectedTime && bookingData.clientName && bookingData.phone;

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <>
      <Helmet>
        <title>Agendar Corte e Barba | Barbearia Premium São Paulo</title>
        <meta name="description" content="Agende seu horário na Barbearia Premium em São Paulo. Corte masculino, barba, atendimento personalizado e agendamento online fácil e rápido." />
        <meta name="keywords" content="agendar barbearia, corte masculino, barba, barbearia São Paulo, agendamento online, barbeiro profissional" />
        <link rel="canonical" href="https://www.seusite.com.br/agendamento" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        {/* Modal de comprovante */}
        <Dialog open={!!lastBooking} onOpenChange={open => { if (!open) setLastBooking(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Comprovante de Agendamento</DialogTitle>
              <DialogDescription>Guarde estas informações para apresentar no local.</DialogDescription>
            </DialogHeader>
            {lastBooking && (
              <div className="space-y-2 mt-4">
                <p><span className="font-semibold">Cliente:</span> {lastBooking.client_name}</p>
                <p><span className="font-semibold">Telefone:</span> {lastBooking.phone}</p>
                <p><span className="font-semibold">Serviços:</span> {lastBooking.services}</p>
                <p><span className="font-semibold">Barbeiro:</span> {lastBooking.barber}</p>
                <p><span className="font-semibold">Data:</span> {formatDate(lastBooking.date)}</p>
                <p><span className="font-semibold">Horário:</span> {lastBooking.time}</p>
                <p><span className="font-semibold">Valor total:</span> R$ {lastBooking.price}</p>
                {lastBooking.notes && <p><span className="font-semibold">Observações:</span> {lastBooking.notes}</p>}
                <button
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
                  onClick={() => {
                    const ics = generateICS(lastBooking);
                    const blob = new Blob([ics.replace(/\\n/g, '\r\n')], { type: 'text/calendar' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'agendamento-premium-grooming.ics';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }, 100);
                  }}
                >
                  Adicionar ao Calendário
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Agende seu Horário</h1>
                <p className="text-xl text-muted-foreground">
                  Selecione o serviço, barbeiro, data e horário que preferir
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Booking Form */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Service Selection */}
                  <div className="card-premium p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Check className="h-5 w-5 text-primary mr-2" />
                      Selecione os Serviços
                    </h3>
                    <div className="flex flex-col gap-2">
                      {services.map((service) => (
                        <label key={service.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedServices(prev => [...prev, service.id]);
                              } else {
                                setSelectedServices(prev => prev.filter(id => id !== service.id));
                              }
                            }}
                          />
                          <span className="font-medium">{service.name}</span>
                          <span className="text-xs text-muted-foreground">{service.duration} min</span>
                          <span className="text-xs text-primary font-semibold">R$ {service.price}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Barber Selection */}
                  {selectedServices.length > 0 && (
                    <div className="card-premium p-6">
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <User className="h-5 w-5 text-primary mr-2" />
                        Selecione o Barbeiro
                      </h3>
                      <Select value={selectedBarber?.toString() || ''} onValueChange={(val) => setSelectedBarber(parseInt(val))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Escolha seu barbeiro preferido" />
                        </SelectTrigger>
                        <SelectContent>
                          {barbers.map((barber) => (
                            <SelectItem key={barber.id} value={barber.id.toString()}>
                              {barber.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Date Selection */}
                  {selectedBarber !== null && (
                    <div className="card-premium p-6">
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <Calendar className="h-5 w-5 text-primary mr-2" />
                        Selecione a Data
                      </h3>
                      
                      <div className="flex justify-between items-center mb-4">
                        <Button variant="ghost" onClick={prevMonth} disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}>
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="text-lg font-medium">
                          {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
                        </span>
                        <Button variant="ghost" onClick={nextMonth}>
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                          <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {getCalendarDays(currentMonth).map((item, i) => (
                          <button
                            key={i}
                            disabled={!item.date || !item.available}
                            onClick={() => {
                              if (item.date) {
                                setSelectedDate(item.date);
                                console.log('Data selecionada:', item.date);
                              }
                            }}
                            className={cn(
                              'h-10 rounded-md border text-center transition-colors',
                              !item.date ? 'invisible' : '',
                              !item.available ? 'opacity-50 cursor-not-allowed bg-background' : 'hover:bg-primary/10',
                              selectedDate === item.date ? 'bg-primary text-primary-foreground' : 'bg-background'
                            )}
                          >
                            {item.date ? String(Number(item.date.split('-')[2])) : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Selection */}
                  {selectedDate && (
                    <div className="card-premium p-6">
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <Clock className="h-5 w-5 text-primary mr-2" />
                        Horários Disponíveis
                      </h3>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {availableTimes.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              'p-3 rounded-lg border text-center transition-all',
                              selectedTime === time
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border hover:border-primary hover:bg-primary/10'
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Details */}
                  <div className="card-premium p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Phone className="h-5 w-5 text-primary mr-2" />
                      Dados do Cliente
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nome Completo *
                        </label>
                        <Input
                          placeholder="Seu nome completo"
                          value={bookingData.clientName}
                          onChange={(e) => setBookingData({...bookingData, clientName: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Número de Telefone *
                        </label>
                        <Input
                          placeholder="(11) 99999-9999"
                          value={bookingData.phone}
                          onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Observações (Opcional)
                        </label>
                        <Textarea
                          placeholder="Alguma preferência ou observação especial..."
                          value={bookingData.notes}
                          onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Booking Summary */}
                <div className="space-y-6">
                  <div className="card-premium p-6 sticky top-24">
                    <h3 className="text-xl font-semibold mb-6">Resumo do Agendamento</h3>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Cliente:</p>
                        <p className="font-semibold">{bookingData.clientName || 'Não informado'}</p>
                      </div>

                      {selectedServicesData.length > 0 && (
                        <div className="p-4 bg-primary/10 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Serviços:</p>
                          <ul>
                            {selectedServicesData.map(s => (
                              <li key={s.id}>{s.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedBarber !== null && (
                        <div className="p-4 bg-accent/10 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Barbeiro:</p>
                          <p className="font-semibold">{selectedBarberData?.name}</p>
                        </div>
                      )}

                      {selectedDate && selectedTime && (
                        <div className="p-4 bg-success/10 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Data e Hora:</p>
                          <p className="font-semibold capitalize">
                            {getDayName(selectedDate)}, {formatDate(selectedDate)}
                          </p>
                          <p className="text-sm text-muted-foreground">às {selectedTime}</p>
                          {selectedServicesData.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Duração: {maxDuration} minutos
                            </p>
                          )}
                        </div>
                      )}

                      {selectedServicesData.length > 0 && (
                        <div className="pt-4 border-t border-border/20">
                          <div className="flex justify-between items-center text-lg font-semibold">
                            <span>Total:</span>
                            <span className="text-primary">R$ {totalPrice}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full mt-6 btn-premium"
                      size="lg"
                      onClick={handleBooking}
                      disabled={!isFormValid || isSaving}
                    >
                      {isSaving ? 'Salvando...' : 'Confirmar Agendamento'}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Você receberá uma confirmação via WhatsApp
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
