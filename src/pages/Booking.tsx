import { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, MessageSquare, User, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/Header';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';

interface Barber {
  id: string;
  name: string;
}

interface BarberSchedule {
  barber_id: string;
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
  barberId: string;
  date: string;
  time: string;
  phone: string;
  notes: string;
}

interface Service {
  id: string;
  type: string;
  duration: number;
  price: number;
}

function generateICS(booking: any, duration: number) {
  const startDate = booking.date.replace(/-/g, '');
  const startTime = booking.time.replace(':', '');
  const end = new Date(booking.date + 'T' + booking.time);
  end.setMinutes(end.getMinutes() + duration);
  const endDate = end.toISOString().slice(0, 10).replace(/-/g, '');
  const endTime = end.toTimeString().slice(0, 5).replace(':', '');

  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//BARBEARIA LIGEIRINHO//Booking//PT-BR\nBEGIN:VEVENT\nSUMMARY:Agendamento BARBEARIA LIGEIRINHO\nDESCRIPTION:Serviços: ${booking.services}\\nBarbeiro: ${booking.barber}\\nCliente: ${booking.client_name}\\nTelefone: ${booking.phone}${booking.notes ? '\\nObs: ' + booking.notes : ''}\nDTSTART;TZID=America/Sao_Paulo:${startDate}T${startTime}00\nDTEND;TZID=America/Sao_Paulo:${endDate}T${endTime}00\nLOCATION:BARBEARIA LIGEIRINHO\nEND:VEVENT\nEND:VCALENDAR`;
}

export default function Booking() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingData, setBookingData] = useState<BookingData>({
    clientName: '',
    service: '',
    barberId: '',
    date: '',
    time: '',
    phone: '',
    notes: '',
  });
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barberSchedules, setBarberSchedules] = useState<Record<string, BarberSchedule[]>>({});
  const [barberAvailability, setBarberAvailability] = useState<Record<string, string[]>>({});
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [services, setServices] = useState<Service[]>([]);
  const [lastBooking, setLastBooking] = useState<any | null>(null);

  useEffect(() => {
    console.log('Debug - Initial useEffect triggered');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Debug - fetchData started');
      
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('*')
        .order('name');
      if (barbersError) throw barbersError;
      setBarbers(barbersData || []);
      console.log('Debug - Barbers loaded:', barbersData);

      const { data: schedulesData, error: schedulesError } = await supabase
        .from('barber_schedules')
        .select('*');
      if (schedulesError) throw schedulesError;
      const schedulesMap: Record<string, BarberSchedule[]> = {};
      schedulesData?.forEach((s) => {
        if (!schedulesMap[s.barber_id]) schedulesMap[s.barber_id] = [];
        schedulesMap[s.barber_id].push(s);
      });
      setBarberSchedules(schedulesMap);
      console.log('Debug - Schedules loaded:', schedulesData);
      console.log('Debug - Schedules map:', schedulesMap);

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('type');
      if (servicesError) throw servicesError;
      setServices(servicesData || []);
      console.log('Debug - Services loaded:', servicesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    console.log('Debug - useEffect triggered:', { selectedDate, selectedServices });
    if (selectedDate && selectedServices.length > 0) {
      console.log('Debug - Calling fetchBarberAvailability');
      fetchBarberAvailability();
    } else {
      console.log('Debug - Clearing availability');
      setBarberAvailability({});
      setAvailableTimes([]);
    }
  }, [selectedDate, selectedServices]);

  // Atualizar horários disponíveis quando o barbeiro selecionado mudar
  useEffect(() => {
    console.log('Debug - Barber selection useEffect triggered:', { selectedBarber, barberAvailability });
    if (selectedBarber && barberAvailability[selectedBarber]) {
      const times = barberAvailability[selectedBarber];
      console.log('Debug - Setting available times for selected barber:', times);
      setAvailableTimes(times);
    } else {
      console.log('Debug - Clearing available times (no barber or no availability)');
      setAvailableTimes([]);
    }
  }, [selectedBarber, barberAvailability]);

  const fetchBarberAvailability = async () => {
    try {
      const dayOfWeek = getDayOfWeek(selectedDate);
      const selectedServicesData = services.filter((s) => selectedServices.includes(s.id));
      const duration = selectedServicesData.reduce((max, s) => Math.max(max, s.duration), 0);
      const availability: Record<string, string[]> = {};

      console.log('Debug - fetchBarberAvailability:', {
        dayOfWeek,
        selectedServices,
        duration,
        barbersCount: barbers.length,
        schedulesCount: Object.keys(barberSchedules).length
      });

      for (const barber of barbers) {
        const schedules = barberSchedules[barber.id] || [];
        const schedule = schedules.find((s) => s.day_of_week === dayOfWeek);
        if (!schedule) {
          console.log(`Debug - No schedule for barber ${barber.name} on ${dayOfWeek}`);
          continue;
        }

        const startMin = timeToMinutes(schedule.start_time);
        const endMin = timeToMinutes(schedule.end_time);
        const step = 15;
        let possibles: string[] = [];
        for (let current = startMin; current + duration <= endMin; current += step) {
          possibles.push(minutesToTime(current));
        }

        console.log(`Debug - Barber ${barber.name} schedule:`, {
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          startMin,
          endMin,
          duration,
          possiblesCount: possibles.length,
          possibles
        });

        const now = new Date();
        const todayStr = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0'),
        ].join('-');
        if (selectedDate === todayStr) {
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const beforeFilter = possibles.length;
          possibles = possibles.filter((time) => timeToMinutes(time) > currentMinutes);
          const afterFilter = possibles.length;
          console.log('Debug - Today filter:', {
            todayStr,
            selectedDate,
            currentMinutes,
            beforeFilter,
            afterFilter,
            filteredTimes: possibles
          });
        }

        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('start_time, end_time')
          .eq('barber_id', barber.id)
          .eq('date', selectedDate);
        if (bookingsError) throw bookingsError;

        const bookings: Booking[] = bookingsData || [];
        console.log(`Debug - Existing bookings for ${barber.name}:`, bookings);

        const available = possibles.filter((start) => {
          const end = addMinutes(start, duration);
          const slotStart = timeToMinutes(start);
          const slotEnd = timeToMinutes(end);
          
          // Verificar se há sobreposição com agendamentos existentes
          const hasConflict = bookings.some((b) => {
            const bookingStart = timeToMinutes(b.start_time);
            const bookingEnd = timeToMinutes(b.end_time);
            
            // Há sobreposição se:
            // - O slot começa antes do agendamento terminar E
            // - O slot termina depois do agendamento começar
            const overlaps = !(slotEnd <= bookingStart || slotStart >= bookingEnd);
            console.log('Debug - Slot conflict check:', {
              slot: { start, end, slotStart, slotEnd },
              booking: { start: b.start_time, end: b.end_time, bookingStart, bookingEnd },
              overlaps
            });
            return overlaps;
          });
          
          return !hasConflict;
        });

        console.log(`Debug - Available times for ${barber.name}:`, available);
        availability[barber.id] = available; // Não limitar horários para debug
      }

      console.log('Debug - Final availability:', availability);
      setBarberAvailability(availability);
      if (selectedBarber) {
        setAvailableTimes(availability[selectedBarber] || []);
      }
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar horários.',
        variant: 'destructive',
      });
    }
  };

  const fetchAvailableTimes = async (barberId: string) => {
    try {
      console.log('Debug - fetchAvailableTimes called for barber:', barberId);
      console.log('Debug - barberAvailability:', barberAvailability);
      const times = barberAvailability[barberId] || [];
      console.log('Debug - Setting available times:', times);
      setAvailableTimes(times);
    } catch (error) {
      console.error('Erro ao definir horários:', error);
    }
  };

  const getCalendarDays = (month: Date) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const paddingStart = firstDay.getDay();
    const calendar: { date: string | null; available: boolean }[] = [];

    for (let i = 0; i < paddingStart; i++) {
      calendar.push({ date: null, available: false });
    }

    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = [
        month.getFullYear(),
        String(month.getMonth() + 1).padStart(2, '0'),
        String(d).padStart(2, '0'),
      ].join('-');
      const isTodayOrFuture = dateStr >= today;
      const dayOfWeek = getDayOfWeek(dateStr);
      const available = isTodayOrFuture && barbers.some((b) => {
        const schedules = barberSchedules[b.id] || [];
        return schedules.some((s) => s.day_of_week === dayOfWeek);
      });
      calendar.push({ date: dateStr, available });
    }

    console.log('Debug - getCalendarDays:', {
      month: month.toISOString(),
      barbersCount: barbers.length,
      schedulesCount: Object.keys(barberSchedules).length,
      calendar: calendar.filter(c => c.date)
    });

    return calendar;
  };

  const getDayOfWeek = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()];
    console.log('Debug - getDayOfWeek:', { dateString, year, month, day, dayName });
    return dayName;
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
      year: 'numeric',
    });
  };

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    const minutes = h * 60 + m;
    console.log('Debug - timeToMinutes:', { time, h, m, minutes });
    return minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    const time = `${h}:${m}`;
    console.log('Debug - minutesToTime:', { minutes, h, m, time });
    return time;
  };

  const addMinutes = (time: string, minutes: number): string => {
    const total = timeToMinutes(time) + minutes;
    const result = minutesToTime(total);
    console.log('Debug - addMinutes:', { time, minutes, total, result });
    return result;
  };

  const selectedServicesData = services.filter((s) => selectedServices.includes(s.id));
  const maxDuration = selectedServicesData.reduce((max, s) => Math.max(max, s.duration), 0);
  const totalPrice = selectedServicesData.reduce((sum, s) => sum + s.price, 0);
  const selectedBarberData = barbers.find((b) => b.id === selectedBarber);

  const handleBooking = async () => {
    if (!isFormValid) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const duration = maxDuration;
      const endTime = addMinutes(selectedTime, duration);
      const dateSP = selectedDate;

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          barber_id: selectedBarber,
          date: dateSP,
          start_time: selectedTime,
          end_time: endTime,
          client_name: bookingData.clientName,
          phone: bookingData.phone,
          notes: bookingData.notes,
          service_id: selectedServices.join(','),
        })
        .select();

      if (error) throw error;

      toast({
        title: 'Agendamento confirmado!',
        description: `Seu horário foi agendado com ${selectedBarberData?.name} para ${formatDate(selectedDate)} às ${selectedTime}.`,
      });

      setLastBooking({
        client_name: bookingData.clientName,
        phone: bookingData.phone,
        notes: bookingData.notes,
        services: selectedServicesData.map((s) => s.type).join(', '),
        barber: selectedBarberData?.name,
        date: selectedDate,
        time: selectedTime,
        price: totalPrice,
        id: data && data[0] ? data[0].id : undefined,
      });

      setSelectedServices([]);
      setSelectedBarber(null);
      setSelectedDate('');
      setSelectedTime('');
      setBookingData({
        clientName: '',
        service: '',
        barberId: '',
        date: '',
        time: '',
        phone: '',
        notes: '',
      });
    } catch (error) {
      console.error('Erro ao agendar:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao agendar. Tente novamente.',
        variant: 'destructive',
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
        <meta
          name="description"
          content="Agende seu horário na Barbearia Premium em São Paulo. Corte masculino, barba, atendimento personalizado e agendamento online fácil e rápido."
        />
        <meta
          name="keywords"
          content="agendar barbearia, corte masculino, barba, barbearia São Paulo, agendamento online, barbeiro profissional"
        />
        <link rel="canonical" href="https://www.seusite.com.br/agendamento" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <Dialog open={!!lastBooking} onOpenChange={(open) => !open && setLastBooking(null)}>
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
                <Button
                  className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    const ics = generateICS(lastBooking, maxDuration);
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
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Agende seu Horário</h1>
                <p className="text-xl text-gray-600">Selecione o serviço, barbeiro, data e horário que preferir</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl font-semibold">
                        <CheckCircle className="h-5 w-5 text-primary mr-2" />
                        Selecione os Serviços
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {services.map((service) => (
                          <Button
                            key={service.id}
                            variant={selectedServices.includes(service.id) ? 'default' : 'outline'}
                            className={cn(
                              'flex flex-col items-start p-4 text-left h-auto transition-all duration-200',
                              selectedServices.includes(service.id)
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-gray-50'
                            )}
                            onClick={() => {
                              setSelectedServices((prev) =>
                                prev.includes(service.id)
                                  ? prev.filter((id) => id !== service.id)
                                  : [...prev, service.id]
                              );
                            }}
                            aria-label={`Selecionar ${service.type}`}
                          >
                            <span className="font-medium">{service.type}</span>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span>{service.duration} min</span>
                              <span className="mx-2">•</span>
                              <span className="font-semibold">R$ {service.price}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedServices.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-xl font-semibold">
                          <User className="h-5 w-5 text-primary mr-2" />
                          Selecione o Barbeiro
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {barbers.map((barber) => (
                            <Button
                              key={barber.id}
                              variant={selectedBarber === barber.id ? 'default' : 'outline'}
                              className={cn(
                                'w-full flex justify-between items-center p-4 transition-all duration-200',
                                selectedBarber === barber.id ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-50'
                              )}
                              onClick={() => {
                                setSelectedBarber(barber.id);
                                // Atualizar horários disponíveis imediatamente
                                const times = barberAvailability[barber.id] || [];
                                setAvailableTimes(times);
                                console.log('Debug - Selected barber:', barber.id, 'Available times:', times);
                              }}
                              aria-label={`Selecionar barbeiro ${barber.name}`}
                            >
                              <span>{barber.name}</span>
                              {selectedDate && barberAvailability[barber.id]?.length > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  {barberAvailability[barber.id].slice(0, 3).join(', ')}
                                  {barberAvailability[barber.id].length > 3 && '...'}
                                </span>
                              )}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedBarber !== null && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-xl font-semibold">
                          <Calendar className="h-5 w-5 text-primary mr-2" />
                          Selecione a Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-4">
                          <Button
                            variant="ghost"
                            onClick={prevMonth}
                            disabled={
                              currentMonth.getMonth() === new Date().getMonth() &&
                              currentMonth.getFullYear() === new Date().getFullYear()
                            }
                            aria-label="Mês anterior"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <span className="text-lg font-medium capitalize">
                            {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                          </span>
                          <Button variant="ghost" onClick={nextMonth} aria-label="Próximo mês">
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                            <div key={day} className="text-center text-sm font-medium text-gray-600">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {getCalendarDays(currentMonth).map((item, i) => (
                            <Button
                              key={i}
                              variant={selectedDate === item.date ? 'default' : 'outline'}
                              disabled={!item.date || !item.available}
                              onClick={() => item.date && setSelectedDate(item.date)}
                              className={cn(
                                'h-10 rounded-md transition-all duration-200',
                                !item.date && 'invisible',
                                !item.available && 'opacity-50 cursor-not-allowed',
                                selectedDate === item.date
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-primary/10'
                              )}
                              aria-label={item.date ? `Selecionar ${item.date}` : ''}
                            >
                              {item.date ? String(Number(item.date.split('-')[2])).padStart(2, '0') : ''}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedDate && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-xl font-semibold">
                          <Clock className="h-5 w-5 text-primary mr-2" />
                          Horários Disponíveis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {availableTimes.length > 0 ? (
                            availableTimes.map((time) => (
                              <Button
                                key={time}
                                variant={selectedTime === time ? 'default' : 'outline'}
                                onClick={() => setSelectedTime(time)}
                                className={cn(
                                  'p-3 rounded-lg transition-all duration-200',
                                  selectedTime === time
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-primary/10'
                                )}
                                aria-label={`Selecionar horário ${time}`}
                              >
                                {time}
                              </Button>
                            ))
                          ) : (
                            <div className="col-span-full text-center py-8 text-gray-500">
                              <p>Nenhum horário disponível para esta data</p>
                              <p className="text-sm mt-2">Tente selecionar outra data ou barbeiro</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl font-semibold">
                        <Phone className="h-5 w-5 text-primary mr-2" />
                        Dados do Cliente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome Completo *
                          </label>
                          <Input
                            placeholder="Seu nome completo"
                            value={bookingData.clientName}
                            onChange={(e) => setBookingData({ ...bookingData, clientName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Telefone *
                          </label>
                          <Input
                            placeholder="(11) 99999-9999"
                            value={bookingData.phone}
                            onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Observações (Opcional)
                          </label>
                          <Textarea
                            placeholder="Alguma preferência ou observação especial..."
                            value={bookingData.notes}
                            onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">Resumo do Agendamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Cliente:</p>
                          <p className="font-semibold">{bookingData.clientName || 'Não informado'}</p>
                        </div>
                        {selectedServicesData.length > 0 && (
                          <div className="p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Serviços:</p>
                            <ul>
                              {selectedServicesData.map((s) => (
                                <li key={s.id}>{s.type}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedBarber !== null && (
                          <div className="p-4 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Barbeiro:</p>
                            <p className="font-semibold">{selectedBarberData?.name}</p>
                          </div>
                        )}
                        {selectedDate && selectedTime && (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Data e Hora:</p>
                            <p className="font-semibold capitalize">
                              {getDayName(selectedDate)}, {formatDate(selectedDate)}
                            </p>
                            <p className="text-sm text-gray-600">às {selectedTime}</p>
                            {selectedServicesData.length > 0 && (
                              <p className="text-sm text-gray-600">Duração: {maxDuration} minutos</p>
                            )}
                          </div>
                        )}
                        {selectedServicesData.length > 0 && (
                          <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center text-lg font-semibold">
                              <span>Total:</span>
                              <span className="text-primary">R$ {totalPrice}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                        size="lg"
                        onClick={handleBooking}
                        disabled={!isFormValid || isSaving}
                      >
                        {isSaving ? 'Salvando...' : 'Confirmar Agendamento'}
                      </Button>
                      <p className="text-xs text-gray-600 text-center mt-4">
                        Você receberá uma confirmação via WhatsApp
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}