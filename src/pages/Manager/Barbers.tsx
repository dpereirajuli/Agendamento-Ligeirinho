import { useEffect, useState } from 'react';
import { Plus, User, Edit, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Helmet } from 'react-helmet-async';

const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

interface Schedule {
  id?: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  active: boolean;
}

interface Barber {
  id: string;
  name: string;
  created_at: string;
}

function getDefaultSchedules() {
  return daysOfWeek.map(day => ({
    day_of_week: day.key,
    start_time: '',
    end_time: '',
    active: false,
  }));
}

export default function Barbers() {
  const { barbers, setBarbers, addBarber, updateBarber, deleteBarber, user } = useApp();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [createSchedules, setCreateSchedules] = useState<Schedule[]>(getDefaultSchedules());
  const [createDefaultStart, setCreateDefaultStart] = useState('09:00');
  const [createDefaultEnd, setCreateDefaultEnd] = useState('18:00');
  const [createDefaultDays, setCreateDefaultDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editSchedules, setEditSchedules] = useState<Schedule[]>(getDefaultSchedules());
  const [editDefaultStart, setEditDefaultStart] = useState('09:00');
  const [editDefaultEnd, setEditDefaultEnd] = useState('18:00');
  const [editDefaultDays, setEditDefaultDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [editName, setEditName] = useState('');

  // Funções de validação
  const validateSchedule = (schedule: Schedule): boolean => {
    if (!schedule.active) return true;
    if (!schedule.start_time || !schedule.end_time) return false;
    return schedule.start_time < schedule.end_time;
  };

  const validateAllSchedules = (schedules: Schedule[]): boolean => {
    return schedules.every(validateSchedule);
  };

  const getScheduleError = (schedule: Schedule): string | null => {
    if (!schedule.active) return null;
    if (!schedule.start_time || !schedule.end_time) {
      return 'Preencha os horários quando o dia estiver ativo';
    }
    if (schedule.start_time >= schedule.end_time) {
      return 'Horário inicial deve ser menor que o horário final';
    }
    return null;
  };

  const hasScheduleErrors = (schedules: Schedule[]): boolean => {
    return schedules.some(schedule => getScheduleError(schedule) !== null);
  };

  const fetchBarbers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('barbers').select('*').order('name');
      if (error) throw new Error('Erro ao buscar barbeiros.');
      if (data) {
        // Update the barbers state directly to avoid duplicates
        setBarbers(data.map(barber => ({
          id: barber.id,
          name: barber.name,
          created_at: barber.created_at,
        })));
      }
    } catch (error: any) {
      console.error('Error fetching barbers:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao buscar barbeiros',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  const handleApplyCreateDefault = () => {
    // Validar se o horário padrão é válido
    if (createDefaultStart >= createDefaultEnd) {
      toast({
        title: 'Horário inválido',
        description: 'O horário inicial deve ser menor que o horário final',
        variant: 'destructive',
      });
      return;
    }

    setCreateSchedules(schedules =>
      schedules.map(sch =>
        createDefaultDays.includes(sch.day_of_week)
          ? { ...sch, start_time: createDefaultStart, end_time: createDefaultEnd, active: true }
          : sch
      )
    );
  };

  const handleApplyEditDefault = () => {
    // Validar se o horário padrão é válido
    if (editDefaultStart >= editDefaultEnd) {
      toast({
        title: 'Horário inválido',
        description: 'O horário inicial deve ser menor que o horário final',
        variant: 'destructive',
      });
      return;
    }

    setEditSchedules(schedules =>
      schedules.map(sch =>
        editDefaultDays.includes(sch.day_of_week)
          ? { ...sch, start_time: editDefaultStart, end_time: editDefaultEnd, active: true }
          : sch
      )
    );
  };

  const handleSubmit = async (data: { name: string }) => {
    setIsLoading(true);
    setCreateError(null);
    
    try {
      // Validar horários antes de prosseguir
      const schedulesToValidate = editingBarber ? editSchedules : createSchedules;
      if (hasScheduleErrors(schedulesToValidate)) {
        toast({
          title: 'Erro de validação',
          description: 'Corrija os erros nos horários antes de salvar',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (editingBarber) {
        // Update barber
        const { data: updateData, error: updateError } = await supabase
          .from('barbers')
          .update({ name: editName })
          .eq('id', editingBarber.id)
          .select();
        if (updateError || !updateData || !updateData[0]) {
          throw new Error('Erro ao atualizar barbeiro.');
        }
        // Remove old schedules
        const { error: deleteError } = await supabase
          .from('barber_schedules')
          .delete()
          .eq('barber_id', editingBarber.id);
        if (deleteError) {
          throw new Error('Erro ao remover horários antigos.');
        }
        // Insert new schedules
        const toInsert = editSchedules
          .filter(s => s.active && s.start_time && s.end_time)
          .map(s => ({
            barber_id: editingBarber.id,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
          }));
        if (toInsert.length > 0) {
          const { error: schError } = await supabase.from('barber_schedules').insert(toInsert);
          if (schError) {
            throw new Error('Erro ao salvar horários.');
          }
        }
        await updateBarber(editingBarber.id, { name: editName });
        toast({
          title: 'Barbeiro atualizado!',
          description: `${editName} foi atualizado com sucesso.`,
        });
        setEditingBarber(null);
      } else {
        // Add new barber
        if (!data.name.trim()) {
          setCreateError('Nome do barbeiro é obrigatório.');
          setIsLoading(false);
          return;
        }
        const { data: newBarber, error } = await supabase.from('barbers').insert([{ name: data.name }]).select();
        if (error || !newBarber || !newBarber[0]) {
          throw new Error('Erro ao cadastrar barbeiro.');
        }
        const barberId = newBarber[0].id;
        // Insert schedules
        const toInsert = createSchedules
          .filter(s => s.active && s.start_time && s.end_time)
          .map(s => ({
            barber_id: barberId,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
          }));
        if (toInsert.length > 0) {
          const { error: schError } = await supabase.from('barber_schedules').insert(toInsert);
          if (schError) {
            throw new Error('Erro ao salvar horários.');
          }
        }
        await addBarber({ id: barberId, name: data.name, created_at: new Date().toISOString() });
        toast({
          title: 'Barbeiro adicionado!',
          description: `${data.name} foi cadastrado com sucesso.`,
        });
        setIsAddOpen(false);
        setName('');
        setCreateSchedules(getDefaultSchedules());
        setCreateDefaultStart('09:00');
        setCreateDefaultEnd('18:00');
        setCreateDefaultDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
      }
    } catch (error: any) {
      console.error('Error handling barber:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar solicitação',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (barber: Barber) => {
    setEditingBarber(barber);
    setEditName(barber.name);
    try {
      const { data, error } = await supabase
        .from('barber_schedules')
        .select('*')
        .eq('barber_id', barber.id);
      if (error) throw new Error('Erro ao buscar horários.');
      if (data) {
        const schedules = getDefaultSchedules().map(day => {
          const found = data.find((s: any) => s.day_of_week === day.day_of_week);
          return found
            ? {
                ...day,
                id: found.id,
                start_time: found.start_time,
                end_time: found.end_time,
                active: true,
              }
            : day;
        });
        setEditSchedules(schedules);
      } else {
        setEditSchedules(getDefaultSchedules());
      }
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar horários',
        variant: 'destructive',
      });
      setEditSchedules(getDefaultSchedules());
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      try {
        // Remove schedules
        await supabase.from('barber_schedules').delete().eq('barber_id', id);
        // Remove barber
        await supabase.from('barbers').delete().eq('id', id);
        await deleteBarber(id);
        toast({
          title: 'Barbeiro excluído!',
          description: 'O barbeiro foi removido com sucesso.',
        });
      } catch (error: any) {
        console.error('Error deleting barber:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao excluir barbeiro',
          variant: 'destructive',
        });
      }
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acesso Restrito
          </h3>
          <p className="text-gray-600">
            Apenas administradores podem gerenciar barbeiros
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Barbeiros Profissionais | Barbearia Premium São Paulo</title>
        <meta name="description" content="Conheça a equipe de barbeiros profissionais da Barbearia Premium em São Paulo. Especialistas em corte masculino, barba e atendimento personalizado." />
        <meta name="keywords" content="barbeiros, barbeiro profissional, equipe barbearia, corte masculino, barba, barbearia São Paulo" />
        <link rel="canonical" href="https://www.seusite.com.br/barbeiros" />
      </Helmet>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Barbeiros</h1>
            <p className="text-muted-foreground">Gerencie a equipe de profissionais</p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Barbeiro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 overflow-hidden sm:rounded-lg">
              <div className="sticky top-0 left-0 right-0 z-20 bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-2 border-b border-border/20 flex items-center justify-between">
                <DialogTitle className="text-lg sm:text-2xl">Adicionar Barbeiro</DialogTitle>
                <DialogClose asChild>
                  <button aria-label="Fechar" className="rounded-full p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                    <span className="sr-only">Fechar</span>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </DialogClose>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit({ name }); }} className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 pt-4" style={{ maxHeight: '70vh' }}>
                  <div className="flex flex-col gap-4 mb-6">
                    <Input
                      placeholder="Nome completo do barbeiro"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                    {createError && <div className="text-destructive">{createError}</div>}
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg mb-6">
                    <h4 className="font-semibold mb-3">Horário Padrão</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Input 
                          type="time" 
                          value={createDefaultStart} 
                          onChange={e => setCreateDefaultStart(e.target.value)} 
                          className={`w-24 ${createDefaultStart >= createDefaultEnd ? 'border-red-500' : ''}`}
                        />
                        <span>até</span>
                        <Input 
                          type="time" 
                          value={createDefaultEnd} 
                          onChange={e => setCreateDefaultEnd(e.target.value)} 
                          className={`w-24 ${createDefaultStart >= createDefaultEnd ? 'border-red-500' : ''}`}
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        type="button" 
                        onClick={handleApplyCreateDefault} 
                        disabled={createDefaultStart >= createDefaultEnd}
                        className="w-full sm:w-auto"
                      >
                        Aplicar padrão
                      </Button>
                    </div>
                    {createDefaultStart >= createDefaultEnd && (
                      <div className="text-xs text-red-500 mb-2">
                        O horário inicial deve ser menor que o horário final
                      </div>
                    )}
                    <h4 className="font-semibold mb-3">Dias para aplicar o padrão</h4>
                    <div className="flex flex-wrap gap-4">
                      {daysOfWeek.map(day => (
                        <label key={day.key} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={createDefaultDays.includes(day.key)}
                            onChange={e => setCreateDefaultDays(ds => e.target.checked ? [...ds, day.key] : ds.filter(d => d !== day.key))}
                          />
                          <span className="text-sm">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Horários por Dia</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {createSchedules.map((sch, idx) => {
                        const scheduleError = getScheduleError(sch);
                        const hasError = scheduleError !== null;
                        
                        return (
                          <div key={sch.day_of_week} className={`p-4 border rounded-lg flex flex-col gap-2 bg-background ${hasError ? 'border-red-500' : 'border-border'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{daysOfWeek.find(d => d.key === sch.day_of_week)?.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{sch.active ? 'Ativo' : 'Não trabalha'}</span>
                                <Switch checked={sch.active} onCheckedChange={checked => setCreateSchedules(schs => schs.map((s, i) => i === idx ? { ...s, active: checked } : s))} />
                              </div>
                            </div>
                            {sch.active && (
                              <>
                                <div className="flex items-center gap-2">
                                  <Input 
                                    type="time" 
                                    value={sch.start_time} 
                                    onChange={e => setCreateSchedules(schs => schs.map((s, i) => i === idx ? { ...s, start_time: e.target.value } : s))} 
                                    className={`w-24 ${hasError && !sch.start_time ? 'border-red-500' : ''}`}
                                  />
                                  <span>até</span>
                                  <Input 
                                    type="time" 
                                    value={sch.end_time} 
                                    onChange={e => setCreateSchedules(schs => schs.map((s, i) => i === idx ? { ...s, end_time: e.target.value } : s))} 
                                    className={`w-24 ${hasError && !sch.end_time ? 'border-red-500' : ''}`}
                                  />
                                </div>
                                {hasError && (
                                  <div className="text-xs text-red-500 mt-1">
                                    {scheduleError}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <DialogFooter className="sticky bottom-0 left-0 right-0 bg-background px-4 sm:px-6 lg:px-8 py-4 border-t border-border/20 z-20 flex flex-col sm:flex-row sm:justify-end gap-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading || hasScheduleErrors(createSchedules)} 
                    className="btn-premium w-full sm:w-auto"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando...</p>
          </div>
        ) : barbers.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum barbeiro cadastrado
            </h3>
            <p className="text-gray-600 mb-4">
              Comece adicionando os profissionais da sua equipe
            </p>
            <Button onClick={() => setIsAddOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Barbeiro
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map(barber => (
              <Card key={barber.id} className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    {barber.name}
                  </CardTitle>
                  <CardDescription>
                    Barbeiro profissional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(barber)}
                        className="flex-1 border-gray-300 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(barber.id, barber.name)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editingBarber} onOpenChange={() => setEditingBarber(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden sm:rounded-lg">
            <div className="sticky top-0 left-0 right-0 z-20 bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-2 border-b border-border/20 flex items-center justify-between">
              <DialogTitle className="text-lg sm:text-2xl">Editar Barbeiro</DialogTitle>
              <DialogClose asChild>
                <button aria-label="Fechar" className="rounded-full p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                  <span className="sr-only">Fechar</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </DialogClose>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit({ name: editName }); }} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 pt-4" style={{ maxHeight: '70vh' }}>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Nome</label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="p-4 bg-muted/30 rounded-lg mb-6">
                  <h4 className="font-semibold mb-3">Horário Padrão</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Input 
                        type="time" 
                        value={editDefaultStart} 
                        onChange={e => setEditDefaultStart(e.target.value)} 
                        className={`w-24 ${editDefaultStart >= editDefaultEnd ? 'border-red-500' : ''}`}
                      />
                      <span>até</span>
                      <Input 
                        type="time" 
                        value={editDefaultEnd} 
                        onChange={e => setEditDefaultEnd(e.target.value)} 
                        className={`w-24 ${editDefaultStart >= editDefaultEnd ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      type="button" 
                      onClick={handleApplyEditDefault} 
                      disabled={editDefaultStart >= editDefaultEnd}
                      className="w-full sm:w-auto"
                    >
                      Aplicar horário padrão
                    </Button>
                  </div>
                  {editDefaultStart >= editDefaultEnd && (
                    <div className="text-xs text-red-500 mb-2">
                      O horário inicial deve ser menor que o horário final
                    </div>
                  )}
                  <h4 className="font-semibold mb-3">Dias para aplicar o padrão</h4>
                  <div className="flex flex-wrap gap-4">
                    {daysOfWeek.map(day => (
                      <label key={day.key} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={editDefaultDays.includes(day.key)}
                          onChange={e => setEditDefaultDays(ds => e.target.checked ? [...ds, day.key] : ds.filter(d => d !== day.key))}
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Horários por Dia</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {editSchedules.map((sch, idx) => {
                      const scheduleError = getScheduleError(sch);
                      const hasError = scheduleError !== null;
                      
                      return (
                        <div key={sch.day_of_week} className={`p-4 border rounded-lg flex flex-col gap-2 bg-background ${hasError ? 'border-red-500' : 'border-border'}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{daysOfWeek.find(d => d.key === sch.day_of_week)?.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{sch.active ? 'Ativo' : 'Não trabalha'}</span>
                              <Switch checked={sch.active} onCheckedChange={checked => setEditSchedules(schs => schs.map((s, i) => i === idx ? { ...s, active: checked } : s))} />
                            </div>
                          </div>
                          {sch.active && (
                            <>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="time" 
                                  value={sch.start_time} 
                                  onChange={e => setEditSchedules(schs => schs.map((s, i) => i === idx ? { ...s, start_time: e.target.value } : s))} 
                                  className={`w-24 ${hasError && !sch.start_time ? 'border-red-500' : ''}`}
                                />
                                <span>até</span>
                                <Input 
                                  type="time" 
                                  value={sch.end_time} 
                                  onChange={e => setEditSchedules(schs => schs.map((s, i) => i === idx ? { ...s, end_time: e.target.value } : s))} 
                                  className={`w-24 ${hasError && !sch.end_time ? 'border-red-500' : ''}`}
                                />
                              </div>
                              {hasError && (
                                <div className="text-xs text-red-500 mt-1">
                                  {scheduleError}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter className="sticky bottom-0 left-0 right-0 bg-background px-4 sm:px-6 lg:px-8 py-4 border-t border-border/20 z-20 flex flex-col sm:flex-row sm:justify-end gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoading || hasScheduleErrors(editSchedules)} 
                  className="btn-premium w-full sm:w-auto"
                >
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}