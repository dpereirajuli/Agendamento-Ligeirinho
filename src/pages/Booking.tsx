import { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, MessageSquare, User, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  specialty?: string;
  working_days?: number[];
}

interface Service {
  id: string;
  type: string;
  duration: number;
  price: number;
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
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [services, setServices] = useState<Service[]>([]);
  const [lastBooking, setLastBooking] = useState<any | null>(null);
  const [hasError, setHasError] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [dayAvailability, setDayAvailability] = useState<Record<string, boolean>>({});

  useEffect(() => {
    console.log('Debug - Initial useEffect triggered');
    try {
      fetchData();
    } catch (error) {
      console.error('Error in initial useEffect:', error);
      setHasError(true);
    }
  }, []);

  // Atualizar calendário quando barbeiro for selecionado
  useEffect(() => {
    if (selectedBarber) {
      console.log('Debug - Barber selected, updating calendar');
      // Forçar re-render do calendário
      setCurrentMonth(new Date(currentMonth));
      // Limpar disponibilidade anterior
      setDayAvailability({});
    }
  }, [selectedBarber]);

  // Atualizar disponibilidade dos dias quando barbeiro ou serviços mudarem
  useEffect(() => {
    if (selectedBarber && selectedServices.length > 0) {
      updateMonthAvailability();
    } else {
      setDayAvailability({});
    }
  }, [selectedBarber, selectedServices, currentMonth]);



  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log('Debug - fetchData started');
      
      // Carregar barbeiros
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('*')
        .order('name');
      
      if (barbersError) {
        console.error('Error loading barbers:', barbersError);
        throw new Error('Falha ao carregar barbeiros');
      }
      
      setBarbers(barbersData || []);
      console.log('Debug - Barbers loaded:', barbersData);

      // Carregar serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('type');
      
      if (servicesError) {
        console.error('Error loading services:', servicesError);
        throw new Error('Falha ao carregar serviços');
      }
      
      setServices(servicesData || []);
      console.log('Debug - Services loaded:', servicesData);

      // Verificar se há dados suficientes
      if (!barbersData || barbersData.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Nenhum barbeiro cadastrado. Entre em contato com o administrador.',
          variant: 'destructive',
        });
      }

      if (!servicesData || servicesData.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Nenhum serviço cadastrado. Entre em contato com o administrador.',
          variant: 'destructive',
        });
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao carregar dados. Tente recarregar a página.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Debug - useEffect triggered:', { 
      selectedDate, 
      selectedServices,
      selectedBarber,
      selectedServicesLength: selectedServices.length,
      shouldCallFetch: selectedDate && selectedServices.length > 0 && selectedBarber
    });
    
    if (selectedDate && selectedServices.length > 0 && selectedBarber) {
      console.log('Debug - Calling fetchBarberAvailability');
      fetchBarberAvailability();
    } else {
      console.log('Debug - Clearing availability');
      setAvailableTimes([]);
    }
  }, [selectedDate, selectedServices, selectedBarber]);

  const fetchBarberAvailability = async () => {
    console.log('Debug - fetchBarberAvailability called!');
    setIsLoadingAvailability(true);
    try {
      console.log('Debug - fetchBarberAvailability started with:', {
        selectedDate,
        selectedServices: selectedServices.length,
        selectedBarber
      });

      console.log('Debug - fetchBarberAvailability:', {
        selectedDate,
        selectedServices,
        selectedBarber
      });

      if (!selectedServices.length) {
        console.error('Serviços não encontrados!');
        return;
      }

      // Usar variáveis já calculadas globalmente
      const currentTotalDuration = totalDuration || 30;

      // Obter o dia da semana da data selecionada
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay(); // 0 = domingo, 1 = segunda, etc.
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];

      console.log('Debug - Day of week:', { dayOfWeek, dayName, selectedDate });

      // Buscar horário de trabalho do barbeiro para este dia
      const { data: barberSchedule, error: scheduleError } = await supabase
        .from('barber_schedules')
        .select('start_time, end_time')
        .eq('barber_id', selectedBarber)
        .eq('day_of_week', dayName)
        .single();

      if (scheduleError) {
        console.error('Error fetching barber schedule:', scheduleError);
        // Se não encontrar horário, significa que o barbeiro não trabalha neste dia
        console.log('Debug - No schedule found for this day');
        setAvailableTimes([]);
        return;
      }

      if (!barberSchedule) {
        console.log('Debug - No schedule found for this day');
        setAvailableTimes([]);
        return;
      }

      console.log('Debug - Barber schedule:', barberSchedule);

      // Buscar agendamentos existentes
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('barber_id', selectedBarber)
        .eq('date', selectedDate);

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        return;
      }

      console.log('Debug - Existing appointments:', existingAppointments);

      // Gerar horários disponíveis baseados no horário de trabalho do barbeiro
      const availableSlots: string[] = [];
      const interval = 15; // intervalos de 15 minutos

      // Converter horários para minutos para facilitar cálculos
      const startTime = barberSchedule.start_time;
      const endTime = barberSchedule.end_time;
      
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      console.log('Debug - Time calculations:', {
        startTime,
        endTime,
        startMinutes,
        endMinutes,
        totalDuration: currentTotalDuration
      });

      console.log('Debug - Starting time generation:', {
        startMinutes,
        endMinutes,
        totalDuration: currentTotalDuration,
        interval
      });
      
      let slotCount = 0;
      // Gerar slots de 15 em 15 minutos
      for (let currentMinutes = startMinutes; currentMinutes + currentTotalDuration <= endMinutes; currentMinutes += interval) {
        slotCount++;
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
                  // Verificar se há conflito com agendamentos existentes
          const hasConflict = existingAppointments?.some(appointment => {
            const appointmentStart = appointment.start_time;
            const appointmentEnd = appointment.end_time;
            
            // Verificar sobreposição
            const slotStart = timeString;
            const slotEnd = addMinutes(timeString, currentTotalDuration);
            
            // Há conflito se:
            // 1. O slot começa durante um agendamento existente
            // 2. O slot termina durante um agendamento existente  
            // 3. O slot engloba completamente um agendamento existente
            const conflicts = (
              (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
              (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
              (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
            );
            
            if (conflicts) {
              console.log('Debug - Conflict found:', {
                slotStart,
                slotEnd,
                appointmentStart,
                appointmentEnd,
                timeString
              });
            }
            
            return conflicts;
          });

        // Verificar se não é um horário passado (se for hoje)
        const now = new Date();
        const today = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0'),
        ].join('-');
        
        let isPastTime = false;
        if (selectedDate === today) {
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          // Adicionar margem de 30 minutos para agendamentos
          const [currentHour, currentMinute] = currentTime.split(':').map(Number);
          const currentTotalMinutes = currentHour * 60 + currentMinute;
          const [slotHour, slotMinute] = timeString.split(':').map(Number);
          const slotTotalMinutes = slotHour * 60 + slotMinute;
          
          // Horário deve ser maior que o horário atual + 30 minutos
          isPastTime = slotTotalMinutes <= (currentTotalMinutes + 30);
          
          console.log('Debug - Time check:', {
            selectedDate,
            today,
            currentTime,
            timeString,
            currentTotalMinutes,
            slotTotalMinutes,
            isPastTime,
            margin: currentTotalMinutes + 30
          });
        }
        

        
        if (!hasConflict && !isPastTime) {
          availableSlots.push(timeString);
        }
      }

      console.log('Debug - Loop finished, total slots generated:', slotCount);
      console.log('Debug - Available slots:', availableSlots);
      console.log('Debug - Setting available times:', availableSlots.length, 'slots');
      setAvailableTimes(availableSlots);

    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar horários. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const updateMonthAvailability = async () => {
    if (!selectedBarber || !selectedServices.length) return;

    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const availability: Record<string, boolean> = {};

    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    // Verificar cada dia do mês
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = [
        currentMonth.getFullYear(),
        String(currentMonth.getMonth() + 1).padStart(2, '0'),
        String(d).padStart(2, '0'),
      ].join('-');

      // Só verificar dias que são hoje ou no futuro
      if (dateStr >= today) {
        const isAvailable = await checkDayAvailability(dateStr, selectedBarber);
        availability[dateStr] = isAvailable;
      } else {
        availability[dateStr] = false;
      }
    }

    setDayAvailability(availability);
  };

  const checkDayAvailability = async (dateStr: string, barberId: string) => {
    if (!selectedServices.length || !barberId) return false;

    try {
      // Obter o dia da semana da data
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];

      // Buscar horário de trabalho do barbeiro para este dia
      const { data: barberSchedule, error: scheduleError } = await supabase
        .from('barber_schedules')
        .select('start_time, end_time')
        .eq('barber_id', barberId)
        .eq('day_of_week', dayName)
        .single();

      if (scheduleError || !barberSchedule) {
        return false;
      }

      // Calcular duração baseada no serviço mais longo
      const selectedServicesData = services.filter((s) => selectedServices.includes(s.id));
      if (selectedServicesData.length === 0) return false;
      
      const longestService = selectedServicesData.reduce((longest, current) => 
        current.duration > longest.duration ? current : longest
      );
      const currentTotalDuration = longestService?.duration || 30;

      // Buscar agendamentos existentes
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('barber_id', barberId)
        .eq('date', dateStr);

      if (appointmentsError) {
        return false;
      }

      // Gerar horários disponíveis
      const availableSlots: string[] = [];
      const interval = 15;

      const startTime = barberSchedule.start_time;
      const endTime = barberSchedule.end_time;
      
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Gerar slots e verificar disponibilidade
      for (let currentMinutes = startMinutes; currentMinutes + currentTotalDuration <= endMinutes; currentMinutes += interval) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Verificar se há conflito com agendamentos existentes
        const hasConflict = existingAppointments?.some(appointment => {
          const appointmentStart = appointment.start_time;
          const appointmentEnd = appointment.end_time;
          
          const slotStart = timeString;
          const slotEnd = addMinutes(timeString, currentTotalDuration);
          
          return (
            (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
            (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
            (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
          );
        });

        // Verificar se não é um horário passado (se for hoje)
        const now = new Date();
        const today = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0'),
        ].join('-');
        
        let isPastTime = false;
        if (dateStr === today) {
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const [currentHour, currentMinute] = currentTime.split(':').map(Number);
          const currentTotalMinutes = currentHour * 60 + currentMinute;
          const [slotHour, slotMinute] = timeString.split(':').map(Number);
          const slotTotalMinutes = slotHour * 60 + slotMinute;
          
          // Horário deve ser maior que o horário atual + 30 minutos
          isPastTime = slotTotalMinutes <= (currentTotalMinutes + 30);
        }
        
        if (!hasConflict && !isPastTime) {
          availableSlots.push(timeString);
        }
      }

      return availableSlots.length > 0;
    } catch (error) {
      console.error('Error checking day availability:', error);
      return false;
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
      const dayOfWeek = new Date(month.getFullYear(), month.getMonth(), d).getDay();
      
      let available = false;
      
      if (selectedBarber && selectedServices.length > 0) {
        // Usar disponibilidade calculada dinamicamente
        available = dayAvailability[dateStr] ?? false;
      } else if (selectedBarber && selectedServices.length === 0) {
        // Se há barbeiro mas não há serviços, verificar apenas se ele trabalha neste dia
        if (isTodayOrFuture) {
          if (selectedBarber === '9fba1488-e030-45a5-bba4-4146db9b6a22') { // Kinho
            available = true; // trabalha todos os dias
          } else if (selectedBarber === 'f163d69e-b874-4c19-8868-9ce96e6c83f7') { // Ligeiro
            available = [1, 2, 3, 4, 5, 6].includes(dayOfWeek); // segunda a sábado
          } else if (selectedBarber === 'db2a5a33-effb-471d-8eb1-ce59b787a951') { // Matheus
            available = [1, 2, 3, 4, 5].includes(dayOfWeek); // segunda a sexta
          } else {
            available = [1, 2, 3, 4, 5, 6].includes(dayOfWeek); // padrão: segunda a sábado
          }
        }
      } else if (!selectedBarber) {
        // Se não há barbeiro selecionado, mostrar todos os dias úteis
        available = isTodayOrFuture && [1, 2, 3, 4, 5, 6].includes(dayOfWeek); // segunda a sábado
      }
      
      calendar.push({ date: dateStr, available });
    }

    return calendar;
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

  const addMinutes = (time: string, minutes: number): string => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const newH = Math.floor(total / 60);
    const newM = total % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  // Calcular variáveis derivadas
  const selectedServicesData = services.filter((s) => selectedServices.includes(s.id));
  const longestService = selectedServicesData.length > 0 
    ? selectedServicesData.reduce((longest, current) => 
        current.duration > longest.duration ? current : longest
      )
    : null;
  const totalDuration = longestService?.duration || 0;
  const totalPrice = selectedServicesData.reduce((sum, s) => sum + s.price, 0);
  const selectedBarberData = barbers.find((b) => b.id === selectedBarber);

  const handleMarkBooking = () => {
    if (!isFormValid) {
      let errorMessage = 'Preencha todos os campos obrigatórios para continuar.';
      
      if (selectedServices.length === 0) {
        errorMessage = 'Selecione pelo menos um serviço.';
      } else if (!selectedBarber) {
        errorMessage = 'Selecione um barbeiro.';
      } else if (!selectedDate) {
        errorMessage = 'Selecione uma data.';
      } else if (!selectedTime) {
        errorMessage = 'Selecione um horário.';
      } else if (!bookingData.clientName) {
        errorMessage = 'Informe seu nome completo.';
      } else if (!bookingData.phone) {
        errorMessage = 'Informe seu número de telefone.';
      }
      
      toast({
        title: 'Campos obrigatórios',
        description: errorMessage,
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmation(true);
  };

  const handleBooking = async () => {
    setIsSaving(true);
    try {
      const duration = totalDuration; // Usar duração do serviço mais longo
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
      setShowConfirmation(false);
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

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const isFormValid = selectedServices.length > 0 && 
    selectedBarber !== null && 
    selectedDate && 
    selectedTime && 
    bookingData.clientName && 
    bookingData.phone;



  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Se houver erro, mostrar tela de erro
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro na Página de Agendamento</h1>
          <p className="text-gray-600 mb-4">Ocorreu um erro ao carregar a página. Verifique o console para mais detalhes.</p>
          <Button onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
        </div>
      </div>
    );
  }

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
                  const ics = generateICS(lastBooking, totalDuration);
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

              {isLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando dados do sistema...</p>
                </div>
              )}

              {!isLoading && (
                <>
                  {(barbers.length === 0 || services.length === 0) && (
                    <div className="text-center py-12">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Sistema em Manutenção</h3>
                        <p className="text-red-700 mb-4">
                          {barbers.length === 0 && services.length === 0 
                            ? 'Não há barbeiros ou serviços cadastrados no sistema.'
                            : barbers.length === 0 
                            ? 'Não há barbeiros cadastrados no sistema.'
                            : 'Não há serviços cadastrados no sistema.'
                          }
                        </p>
                        <p className="text-sm text-red-600">
                          Entre em contato com o administrador para resolver este problema.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {barbers.length > 0 && services.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-8">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center text-xl font-semibold">
                              <CheckCircle className="h-5 w-5 text-primary mr-2" />
                              Selecione os Serviços
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-2">
                              Você pode selecionar múltiplos serviços para o mesmo agendamento
                            </p>
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
                                      setSelectedTime('');
                                    }}
                                    aria-label={`Selecionar barbeiro ${barber.name}`}
                                  >
                                    <span>{barber.name}</span>
                                    {barber.specialty && (
                                      <span className="text-sm text-gray-600">{barber.specialty}</span>
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
                                {isLoadingAvailability && (
                                  <span className="ml-2 text-sm text-gray-500">Carregando...</span>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {isLoadingAvailability ? (
                                  <div className="col-span-full text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                    <p className="text-gray-500">Carregando horários disponíveis...</p>
                                  </div>
                                ) : availableTimes.length > 0 ? (
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
                                    <p className="text-sm mt-2">
                                      Tente selecionar outra data ou entre em contato conosco.
                                    </p>

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
                             {!showConfirmation ? (
                               <Button
                                 className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                                 size="lg"
                                 onClick={handleMarkBooking}
                                 disabled={!isFormValid}
                               >
                                 Marcar Agendamento
                               </Button>
                             ) : (
                               <div className="mt-6 space-y-4">
                                 <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                   <p className="text-center text-yellow-800 font-medium mb-4">
                                     Deseja confirmar o agendamento?
                                   </p>
                                   <div className="flex gap-3">
                                     <Button
                                       className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                       onClick={handleBooking}
                                       disabled={isSaving}
                                     >
                                       {isSaving ? 'Salvando...' : 'Sim, Confirmar'}
                                     </Button>
                                     <Button
                                       variant="outline"
                                       className="flex-1"
                                       onClick={handleCancelConfirmation}
                                       disabled={isSaving}
                                     >
                                       Não, Voltar
                                     </Button>
                                   </div>
                                 </div>
                               </div>
                             )}
                             <p className="text-xs text-gray-600 text-center mt-4">
                               Você receberá uma confirmação via WhatsApp
                             </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}