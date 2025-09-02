import { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, MessageSquare, User, ChevronLeft, ChevronRight, CheckCircle, Scissors } from 'lucide-react';
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
  const [isLoadingDayAvailability, setIsLoadingDayAvailability] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [services, setServices] = useState<Service[]>([]);
  const [lastBooking, setLastBooking] = useState<any | null>(null);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [dayAvailability, setDayAvailability] = useState<Record<string, boolean>>({});
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    try {
      fetchData();
    } catch (error) {
      console.error('Error in initial useEffect:', error);
    }
  }, []);

  // Atualizar calendário quando barbeiro for selecionado
  useEffect(() => {
    if (selectedBarber) {
      setCurrentMonth(new Date(currentMonth));
      setDayAvailability({});
    }
  }, [selectedBarber]);

  // Carregar disponibilidade automaticamente quando barbeiro e serviços forem selecionados
  useEffect(() => {
    if (selectedBarber && selectedServices.length > 0) {
      updateMonthAvailability();
    } else {
      setDayAvailability({});
    }
  }, [selectedBarber, selectedServices]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('*')
        .order('name');
      if (barbersError) throw new Error('Falha ao carregar barbeiros');
      setBarbers(barbersData || []);

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('type');
      if (servicesError) throw new Error('Falha ao carregar serviços');
      setServices(servicesData || []);

      if (!barbersData || barbersData.length === 0) {
        toast({ title: 'Aviso', description: 'Nenhum barbeiro cadastrado. Entre em contato com o administrador.', variant: 'destructive' });
      }
      if (!servicesData || servicesData.length === 0) {
        toast({ title: 'Aviso', description: 'Nenhum serviço cadastrado. Entre em contato com o administrador.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro', description: error.message || 'Falha ao carregar dados. Tente recarregar a página.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate && selectedServices.length > 0 && selectedBarber) {
      fetchBarberAvailability();
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, selectedServices, selectedBarber]);

  const fetchBarberAvailability = async () => {
    setIsLoadingAvailability(true);
    try {
      if (!selectedServices.length) return;

      const currentTotalDuration = totalDuration || 30;
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];

      const { data: barberSchedule, error: scheduleError } = await supabase
        .from('barber_schedules')
        .select('start_time, end_time')
        .eq('barber_id', selectedBarber)
        .eq('day_of_week', dayName)
        .single();

      if (scheduleError || !barberSchedule) {
        setAvailableTimes([]);
        return;
      }

      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('barber_id', selectedBarber)
        .eq('date', selectedDate);

      if (appointmentsError) return;

      const availableSlots: string[] = [];
      const interval = 15; // 15 min
      const startTime = barberSchedule.start_time;
      const endTime = barberSchedule.end_time;
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      for (let currentMinutes = startMinutes; currentMinutes + currentTotalDuration <= endMinutes; currentMinutes += interval) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
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

        const now = new Date();
        const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
        let isPastTime = false;
        if (selectedDate === today) {
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const [currentHour, currentMinute] = currentTime.split(':').map(Number);
          const currentTotalMinutes = currentHour * 60 + currentMinute;
          const [slotHour, slotMinute] = timeString.split(':').map(Number);
          const slotTotalMinutes = slotHour * 60 + slotMinute;
          isPastTime = slotTotalMinutes <= (currentTotalMinutes + 30);
        }
        
        if (!hasConflict && !isPastTime) {
          availableSlots.push(timeString);
        }
      }

      setAvailableTimes(availableSlots);
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar horários. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const updateMonthAvailability = async () => {
    if (!selectedBarber || !selectedServices.length) return;

    setIsLoadingDayAvailability(true);
    try {
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const availability: Record<string, boolean> = {};

      const now = new Date();
      const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');

      for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = [currentMonth.getFullYear(), String(currentMonth.getMonth() + 1).padStart(2, '0'), String(d).padStart(2, '0')].join('-');
        if (dateStr >= today) {
          const isAvailable = await checkDayAvailability(dateStr, selectedBarber);
          availability[dateStr] = isAvailable;
        } else {
          availability[dateStr] = false;
        }
      }

      setDayAvailability(availability);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade dos dias:', error);
      toast({ title: 'Erro', description: 'Falha ao verificar disponibilidade dos dias. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoadingDayAvailability(false);
    }
  };

  const checkDayAvailability = async (dateStr: string, barberId: string) => {
    if (!selectedServices.length || !barberId) return false;

    try {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];

      const { data: barberSchedule, error: scheduleError } = await supabase
        .from('barber_schedules')
        .select('start_time, end_time')
        .eq('barber_id', barberId)
        .eq('day_of_week', dayName)
        .single();

      if (scheduleError || !barberSchedule) return false;

      const selectedServicesData = services.filter((s) => selectedServices.includes(s.id));
      if (selectedServicesData.length === 0) return false;
      const longestService = selectedServicesData.reduce((longest, current) => current.duration > longest.duration ? current : longest);
      const currentTotalDuration = longestService?.duration || 30;

      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('barber_id', barberId)
        .eq('date', dateStr);
      if (appointmentsError) return false;

      const availableSlots: string[] = [];
      const interval = 15;
      const startTime = barberSchedule.start_time;
      const endTime = barberSchedule.end_time;
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      for (let currentMinutes = startMinutes; currentMinutes + currentTotalDuration <= endMinutes; currentMinutes += interval) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
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

        const now = new Date();
        const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
        let isPastTime = false;
        if (dateStr === today) {
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const [currentHour, currentMinute] = currentTime.split(':').map(Number);
          const currentTotalMinutes = currentHour * 60 + currentMinute;
          const [slotHour, slotMinute] = timeString.split(':').map(Number);
          const slotTotalMinutes = slotHour * 60 + slotMinute;
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
    const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = [month.getFullYear(), String(month.getMonth() + 1).padStart(2, '0'), String(d).padStart(2, '0')].join('-');
      const isTodayOrFuture = dateStr >= today;
      const dayOfWeek = new Date(month.getFullYear(), month.getMonth(), d).getDay();
      let available = false;
      
      if (selectedBarber && selectedServices.length > 0) {
        available = dayAvailability[dateStr] ?? false;
      } else if (selectedBarber && selectedServices.length === 0) {
        if (isTodayOrFuture) {
          if (selectedBarber === '9fba1488-e030-45a5-bba4-4146db9b6a22') {
            available = true;
          } else if (selectedBarber === 'f163d69e-b874-4c19-8868-9ce96e6c83f7') {
            available = [1, 2, 3, 4, 5, 6].includes(dayOfWeek);
          } else if (selectedBarber === 'db2a5a33-effb-471d-8eb1-ce59b787a951') {
            available = [1, 2, 3, 4, 5].includes(dayOfWeek);
          } else {
            available = [1, 2, 3, 4, 5, 6].includes(dayOfWeek);
          }
        }
      } else if (!selectedBarber) {
        available = isTodayOrFuture && [1, 2, 3, 4, 5, 6].includes(dayOfWeek);
      }
      
      if (selectedBarber && selectedServices.length > 0 && Object.keys(dayAvailability).length === 0) {
        available = false;
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
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const newH = Math.floor(total / 60);
    const newM = total % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  // Derivados
  const selectedServicesData = services.filter((s) => selectedServices.includes(s.id));
  const longestService = selectedServicesData.length > 0 
    ? selectedServicesData.reduce((longest, current) => current.duration > longest.duration ? current : longest)
    : null;
  const totalDuration = longestService?.duration || 0;
  const totalPrice = selectedServicesData.reduce((sum, s) => sum + s.price, 0);
  const selectedBarberData = barbers.find((b) => b.id === selectedBarber);

  const handleMarkBooking = () => {
    if (!isFormValid) {
      let errorMessage = 'Preencha todos os campos obrigatórios para continuar.';
      if (selectedServices.length === 0) errorMessage = 'Selecione pelo menos um serviço.';
      else if (!selectedBarber) errorMessage = 'Selecione um barbeiro.';
      else if (!selectedDate) errorMessage = 'Selecione uma data.';
      else if (!selectedTime) errorMessage = 'Selecione um horário.';
      else if (!bookingData.clientName) errorMessage = 'Informe seu nome completo.';
      else if (!bookingData.phone) errorMessage = 'Informe seu número de telefone.';
      toast({ title: 'Campos obrigatórios', description: errorMessage, variant: 'destructive' });
      return;
    }
    setShowConfirmation(true);
  };

  const handleBooking = async () => {
    setIsSaving(true);
    try {
      const duration = totalDuration; // usar serviço mais longo
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

      // reset
      setSelectedServices([]);
      setSelectedBarber(null);
      setSelectedDate('');
      setSelectedTime('');
      setShowConfirmation(false);
      setBookingData({ clientName: '', service: '', barberId: '', date: '', time: '', phone: '', notes: '' });
      setCurrentStep(1);
    } catch (error) {
      console.error('Erro ao agendar:', error);
      toast({ title: 'Erro', description: 'Falha ao agendar. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelConfirmation = () => setShowConfirmation(false);

  const isFormValid = selectedServices.length > 0 && selectedBarber !== null && selectedDate && selectedTime && bookingData.clientName && bookingData.phone;

  // Stepper (mantido)
  const getStepperSteps = () => [
    { id: 'services', title: 'Serviços', description: 'Escolha os serviços', completed: selectedServices.length > 0, current: currentStep === 1 },
    { id: 'barber', title: 'Barbeiro', description: 'Selecione o profissional', completed: selectedBarber !== null, current: currentStep === 2 },
    { id: 'datetime', title: 'Data/Hora', description: 'Escolha o horário', completed: Boolean(selectedDate && selectedTime), current: currentStep === 3 },
    { id: 'client', title: 'Dados', description: 'Informações pessoais', completed: Boolean(bookingData.clientName && bookingData.phone), current: currentStep === 4 },
    { id: 'confirm', title: 'Confirmar', description: 'Revisar e confirmar', completed: false, current: currentStep === 5 },
  ];

  // Scroll suave ao mudar de etapa
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Navegação entre etapas com limpeza do que vem depois
  const goToStep = (step: number) => {
    console.log('goToStep called with:', step, 'current step:', currentStep);
    
    // Limpar dados baseado no step de destino
    if (step <= 2) {
      // Se voltando para serviços ou barbeiro, limpa tudo que vem depois
      setSelectedDate('');
      setSelectedTime('');
      setBookingData((prev) => ({ ...prev, clientName: '', phone: '' }));
    }
    if (step <= 1) {
      // Se voltando para serviços, limpa também o barbeiro
      setSelectedBarber(null);
    }
    if (step <= 3) {
      // Se voltando para data/hora, limpa dados do cliente
      setBookingData((prev) => ({ ...prev, clientName: '', phone: '' }));
    }
    
    // Definir o step atual
    setCurrentStep(step);
    console.log('Step changed to:', step);
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));



  return (
    <>
      <Helmet>
        <title>Agendar Corte e Barba | Barbearia Premium São Paulo</title>
        <meta name="description" content="Agende seu horário na Barbearia Premium em São Paulo. Corte masculino, barba, atendimento personalizado e agendamento online fácil e rápido." />
        <meta name="keywords" content="agendar barbearia, corte masculino, barba, barbearia São Paulo, agendamento online, barbeiro profissional" />
        <link rel="canonical" href="https://www.seusite.com.br/agendamento" />
      </Helmet>

      <div className="min-h-screen bg-background-light">
        <Header />

        {/* Dialog de confirmação */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Agendamento</DialogTitle>
              <DialogDescription>
                Confirme os dados do seu agendamento antes de finalizar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Resumo do Agendamento:</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-medium">Serviços:</span> {selectedServicesData.map(s => s.type).join(', ')}</p>
                  <p><span className="font-medium">Barbeiro:</span> {selectedBarberData?.name}</p>
                  <p><span className="font-medium">Data:</span> {formatDate(selectedDate)}</p>
                  <p><span className="font-medium">Horário:</span> {selectedTime}</p>
                  <p><span className="font-medium">Cliente:</span> {bookingData.clientName}</p>
                  <p><span className="font-medium">Telefone:</span> {bookingData.phone}</p>
                  {bookingData.notes && <p><span className="font-medium">Observações:</span> {bookingData.notes}</p>}
                  <p className="pt-2 border-t border-gray-200">
                    <span className="font-bold text-lg">Total: R$ {totalPrice}</span>
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleCancelConfirmation}>
                  Cancelar
                </Button>
                <Button onClick={handleBooking} disabled={isSaving} className="min-w-[140px]">
                  {isSaving ? 'Salvando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de comprovante */}
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

        <div className="pt-20 sm:pt-24 pb-8 sm:pb-12">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-6 sm:mb-8 lg:mb-12 px-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-main mb-2 sm:mb-3 lg:mb-4">Agende seu Horário</h1>
                <p className="text-sm sm:text-base lg:text-xl text-text-muted">Siga as etapas para agendar seu horário de forma simples e rápida</p>
              </div>

              {/* Stepper responsivo */}
              <div className="mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 lg:space-x-3 mb-4 sm:mb-6 overflow-x-auto px-2 sm:px-4">
                  {getStepperSteps().map((step, index) => (
                    <div key={step.id} className="flex items-center flex-shrink-0">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm lg:text-base font-medium ${
                        step.completed 
                          ? 'bg-green-500 text-white' 
                          : step.current 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step.completed ? '✓' : index + 1}
                      </div>
                      {index < getStepperSteps().length - 1 && (
                        <div className={`w-6 sm:w-8 lg:w-16 h-1 mx-1 sm:mx-2 lg:mx-3 ${
                          step.completed ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center px-2 sm:px-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-text-main">
                    {getStepperSteps().find(s => s.current)?.title}
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-text-muted">
                    {getStepperSteps().find(s => s.current)?.description}
                  </p>
                </div>
              </div>

              {isLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando dados do sistema...</p>
                </div>
              )}

              {!isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {/* COLUNA ESQUERDA: conteúdo da etapa atual */}
                  <div className="lg:col-span-2 space-y-4 sm:space-y-6">


                    <div>
                      {currentStep === 1 && (
                        <div key="step-1">
                        <Card className="bg-card-bg border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-primary-petroleum/10 to-blue-50 border-b border-primary-petroleum/20">
                            <CardTitle className="flex items-center text-xl font-semibold text-text-main">
                              <Scissors className="h-5 w-5 text-secondary-gold mr-2" />
                              Selecione os Serviços
                            </CardTitle>
                              <p className="text-sm text-text-muted mt-2">Você pode selecionar múltiplos serviços para o mesmo agendamento</p>
                          </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              {services.map((service) => (
                                <Button
                                  key={service.id}
                                  variant="outline"
                                  className={cn(
                                    'flex flex-col items-start p-4 text-left h-auto transition-all duration-200 border-2',
                                    selectedServices.includes(service.id)
                                        ? 'bg-primary-petroleum text-white border-primary-petroleum shadow-lg'
                                      : 'bg-white text-text-main border-gray-200 hover:border-secondary-gold hover:bg-secondary-gold/5 hover:text-text-main hover:shadow-md'
                                  )}
                                  onClick={() => {
                                      setSelectedServices((prev) => prev.includes(service.id) ? prev.filter((id) => id !== service.id) : [...prev, service.id]);
                                  }}
                                  aria-label={`Selecionar ${service.type}`}
                                >
                                  <span className="font-semibold text-lg">{service.type}</span>
                                  <div className="text-sm mt-2 opacity-80">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 mr-2">{service.duration} min</span>
                                      <span className="font-bold text-lg text-secondary-gold">R$ {service.price}</span>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          </CardContent>
                            <div className="mt-4 sm:mt-6 flex justify-end px-4 sm:px-6 pb-4 sm:pb-6">
                              <Button 
                                onClick={() => setCurrentStep(2)}
                                disabled={selectedServices.length === 0}
                                className="min-w-[140px] sm:min-w-[180px]"
                              >
                                Continuar
                              </Button>
                            </div>
                        </Card>
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div key="step-2">
                          <Card className="bg-card-bg border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-primary-petroleum/10 to-blue-50 border-b border-primary-petroleum/20">
                              <CardTitle className="flex items-center text-xl font-semibold text-text-main">
                                <User className="h-5 w-5 text-success-soft mr-2" />
                                Selecione o Barbeiro
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {barbers.map((barber) => (
                                  <Button
                                    key={barber.id}
                                    variant="outline"
                                    className={cn(
                                      'w-full flex flex-col items-center p-6 transition-all duration-200 border-2 h-auto',
                                      selectedBarber === barber.id 
                                        ? 'bg-success-soft text-white border-success-soft shadow-lg transform scale-105' 
                                        : 'bg-white text-text-main border-gray-200 hover:border-success-soft hover:bg-success-soft/5 hover:text-text-main hover:shadow-md'
                                    )}
                                    onClick={() => {
                                      setSelectedBarber(barber.id);
                                      setSelectedTime('');
                                    }}
                                    aria-label={`Selecionar barbeiro ${barber.name}`}
                                  >
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-3">
                                      <User className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <span className="font-semibold text-lg mb-1">{barber.name}</span>
                                    {barber.specialty && <span className="text-sm opacity-80">{barber.specialty}</span>}
                                  </Button>
                                ))}
                              </div>
                            </CardContent>
                            <div className="mt-4 sm:mt-6 flex justify-end px-4 sm:px-6 pb-4 sm:pb-6">
                              <Button 
                                variant="outline" 
                                onClick={() => goToStep(1)}
                                className="mr-2 sm:mr-3"
                              >
                                Voltar
                              </Button>
                              <Button 
                                onClick={() => setCurrentStep(3)}
                                disabled={!selectedBarber}
                                className="min-w-[140px] sm:min-w-[180px]"
                              >
                                Continuar
                              </Button>
                            </div>
                          </Card>
                        </div>
                        )}

                      {currentStep === 3 && (
                        <div key="step-3">
                          <Card className="bg-card-bg border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-primary-petroleum/10 to-blue-50 border-b border-primary-petroleum/20">
                              <CardTitle className="flex items-center text-xl font-semibold text-text-main">
                                <Calendar className="h-5 w-5 text-primary-petroleum mr-2" />
                                Selecione a Data e o Horário
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                              {/* Disponibilidade do mês - carrega automaticamente */}
                              {Object.keys(dayAvailability).length === 0 ? (
                                <div className="text-center py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-petroleum mx-auto mb-4"></div>
                                  <p className="text-sm text-text-muted">
                                    {isLoadingDayAvailability 
                                      ? 'Verificando dias disponíveis...' 
                                      : 'Selecione um barbeiro e serviços para ver os dias disponíveis'
                                    }
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-center">
                                <Button
                                  variant="ghost"
                                  onClick={prevMonth}
                                      disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                                  className="hover:bg-blue-50 text-primary-petroleum"
                                  aria-label="Mês anterior"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </Button>
                                    <span className="text-lg sm:text-xl font-semibold capitalize text-primary-petroleum">
                                  {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                                </span>
                                    <Button variant="ghost" onClick={nextMonth} className="hover:bg-blue-50 text-primary-petroleum" aria-label="Próximo mês">
                                  <ChevronRight className="h-5 w-5" />
                                </Button>
                              </div>
                              
                                  <div className="grid grid-cols-7 gap-2">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                                      <div key={day} className="text-center text-xs sm:text-sm font-semibold text-text-muted py-2">{day}</div>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-2">
                                {getCalendarDays(currentMonth).map((item, i) => (
                                  <Button
                                    key={i}
                                    variant="outline"
                                    disabled={!item.date || !item.available}
                                    onClick={() => item.date && setSelectedDate(item.date)}
                                    className={cn(
                                          'h-10 sm:h-12 rounded-lg transition-all duration-200 border-2',
                                      !item.date && 'invisible',
                                          !item.available && 'bg-white text-black border-gray-200 cursor-not-allowed',
                                          item.available && 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:border-green-400',
                                          selectedDate === item.date ? 'bg-primary-petroleum text-white border-primary-petroleum shadow-lg transform scale-105' : ''
                                    )}
                                    aria-label={item.date ? `Selecionar ${item.date}` : ''}
                                  >
                                    {item.date ? String(Number(item.date.split('-')[2])).padStart(2, '0') : ''}
                                  </Button>
                                ))}
                              </div>
                                </>
                        )}

                              {/* Horários dentro da mesma etapa - só aparece quando uma data for selecionada */}
                        {selectedDate && (
                                <div className="pt-3 sm:pt-4">
                                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-5 w-5 text-green-600" />
                                      <h3 className="text-base sm:text-lg font-semibold text-green-800">Horários Disponíveis</h3>
                                    </div>
                                    {isLoadingAvailability && <span className="text-sm text-text-muted">Carregando...</span>}
                                  </div>
                                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                                {isLoadingAvailability ? (
                                  <div className="col-span-full text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                                    <p className="text-text-muted">Carregando horários disponíveis...</p>
                                  </div>
                                ) : availableTimes.length > 0 ? (
                                  availableTimes.map((time) => (
                                    <Button
                                      key={time}
                                      variant="outline"
                                      onClick={() => setSelectedTime(time)}
                                      className={cn(
                                            'p-2 sm:p-3 md:p-4 rounded-lg transition-all duration-200 border-2 text-sm sm:text-base md:text-lg font-semibold min-h-[44px]',
                                            selectedTime === time ? 'bg-primary-petroleum text-white border-primary-petroleum shadow-lg' : 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:border-green-400'
                                      )}
                                      aria-label={`Selecionar horário ${time}`}
                                    >
                                      {time}
                                    </Button>
                                  ))
                                ) : (
                                      <div className="col-span-full text-center py-6 text-text-muted">
                                        <p className="text-sm sm:text-base">
                                          Nenhum horário disponível para esta data. Tente selecionar outra data.
                                    </p>
                                  </div>
                                )}
                                  </div>
                                </div>
                              )}

                              {/* Botões de navegação */}
                              <div className="mt-4 sm:mt-6 flex justify-end gap-2 sm:gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => goToStep(2)}
                                >
                                  Voltar
                                </Button>
                                                                  <Button
                                    disabled={!selectedDate || !selectedTime}
                                    onClick={() => setCurrentStep(4)}
                                    className="min-w-[140px] sm:min-w-[180px]"
                                  >
                                    Continuar
                                  </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        )}

                      {currentStep === 4 && (
                        <div key="step-4">
                        <Card className="bg-card-bg border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-primary-petroleum/10 to-blue-50 border-b border-primary-petroleum/20">
                            <CardTitle className="flex items-center text-xl font-semibold text-text-main">
                              <Phone className="h-5 w-5 text-orange-600 mr-2" />
                                Identificação do Cliente
                            </CardTitle>
                              <p className="text-sm text-text-muted mt-2">Informe seus dados para finalizar o agendamento</p>
                          </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                              <div className="space-y-4 sm:space-y-6">
                              <div>
                                  <label className="block text-sm font-semibold text-text-main mb-2">Nome Completo *</label>
                                <Input
                                  placeholder="Seu nome completo"
                                  value={bookingData.clientName}
                                  onChange={(e) => setBookingData({ ...bookingData, clientName: e.target.value })}
                                    className="h-12 text-lg border-2 bg-white text-black focus:border-primary-petroleum focus:ring-2 focus:ring-primary-petroleum/20"
                                  required
                                />
                              </div>
                              <div>
                                  <label className="block text-sm font-semibold text-text-main mb-2">Número de Telefone *</label>
                                <Input
                                  placeholder="(11) 99999-9999"
                                  value={bookingData.phone}
                                  onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                                    className="h-12 text-lg border-2 bg-white text-black focus:border-primary-petroleum focus:ring-2 focus:ring-primary-petroleum/20"
                                  required
                                />
                              </div>
                              <div>
                                  <label className="block text-sm font-semibold text-text-main mb-2 flex items-center">
                                  <MessageSquare className="h-4 w-4 mr-2 text-orange-600" />
                                  Observações (Opcional)
                                </label>
                                <Textarea
                                  placeholder="Alguma preferência ou observação especial..."
                                  value={bookingData.notes}
                                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                    className="border-2 bg-white text-black focus:border-primary-petroleum focus:ring-2 focus:ring-primary-petroleum/20"
                                  rows={3}
                                />
                              </div>
                            </div>
                              <div className="mt-4 sm:mt-6 flex justify-end gap-2 sm:gap-3">
                                <Button variant="outline" onClick={() => goToStep(3)}>Voltar</Button>
                                <Button onClick={() => setCurrentStep(5)} disabled={!bookingData.clientName || !bookingData.phone} className="min-w-[140px] sm:min-w-[180px]">Continuar</Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      )}

                      {currentStep === 5 && (
                        <div key="step-5">
                          <Card className="bg-card-bg border-0 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-primary-petroleum/10 to-blue-50 border-b border-primary-petroleum/20">
                              <CardTitle className="flex items-center text-xl font-semibold text-text-main">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                Revise e Confirme
                              </CardTitle>
                              <p className="text-sm text-text-muted mt-2">Confira os dados no resumo e confirme o agendamento abaixo</p>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 flex justify-end gap-2 sm:gap-3">
                              <Button variant="outline" onClick={() => goToStep(4)}>Voltar</Button>
                              <Button onClick={handleMarkBooking} disabled={!isFormValid} className="min-w-[160px] sm:min-w-[200px]">Confirmar Agendamento</Button>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COLUNA DIREITA: Resumo permanente */}
                  <div className="space-y-4 sm:space-y-6 order-first lg:order-last">
                    <Card className="bg-card-bg border-0 shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-primary-petroleum/10 to-blue-50 border-b border-primary-petroleum/20">
                        <CardTitle className="text-lg font-semibold text-gray-900">Resumo do Agendamento</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                        {selectedServicesData.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Serviços Selecionados:</h4>
                            <div className="space-y-1 sm:space-y-2">
                              {selectedServicesData.map((service) => (
                                <div key={service.id} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-700">{service.type}</span>
                                  <span className="font-semibold text-secondary-gold">R$ {service.price}</span>
                                </div>
                              ))}
                      </div>
                    </div>
                  )}
                        
                        {selectedBarberData && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Barbeiro:</h4>
                            <p className="text-sm text-gray-700">{selectedBarberData.name}</p>
                          </div>
                        )}
                        
                        {selectedDate && selectedTime && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Data e Horário:</h4>
                            <p className="text-sm text-gray-700">
                              {formatDate(selectedDate)} às {selectedTime}
                            </p>
            </div>
                        )}
                        
                        {bookingData.clientName && bookingData.phone && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Dados Pessoais:</h4>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Nome:</span> {bookingData.clientName}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Telefone:</span> {bookingData.phone}
                              </p>
                              {bookingData.notes && (
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Observações:</span> {bookingData.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {totalPrice > 0 && (
                          <div className="pt-3 sm:pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center text-base sm:text-lg font-bold text-gray-900">
                              <span>Total:</span>
                              <span className="text-secondary-gold">R$ {totalPrice}</span>
                            </div>
                          </div>
                        )}
                        

                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
