import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

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

function getDefaultSchedules() {
  return daysOfWeek.map(day => ({
    day_of_week: day.key,
    start_time: '',
    end_time: '',
    active: false,
  }));
}

interface Barber {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export default function Barbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editBarber, setEditBarber] = useState<Barber | null>(null);
  const [editSchedules, setEditSchedules] = useState<Schedule[]>(getDefaultSchedules());
  const [defaultStart, setDefaultStart] = useState('09:00');
  const [defaultEnd, setDefaultEnd] = useState('18:00');
  const [defaultDays, setDefaultDays] = useState<string[]>(['monday','tuesday','wednesday','thursday','friday']);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [removing, setRemoving] = useState(false);
  // Adicionar estado para cadastro de horários
  const [createSchedules, setCreateSchedules] = useState(getDefaultSchedules());
  const [createDefaultStart, setCreateDefaultStart] = useState('09:00');
  const [createDefaultEnd, setCreateDefaultEnd] = useState('18:00');
  const [createDefaultDays, setCreateDefaultDays] = useState<string[]>(['monday','tuesday','wednesday','thursday','friday']);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchBarbers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('barbers').select('*').order('name');
    if (!error && data) setBarbers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBarbers();
  }, []);

  const handleApplyCreateDefault = () => {
    setCreateSchedules(schedules =>
      schedules.map(sch =>
        createDefaultDays.includes(sch.day_of_week)
          ? { ...sch, start_time: createDefaultStart, end_time: createDefaultEnd, active: true }
          : sch
      )
    );
  };

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!name.trim()) return;
    setSaving(true);
    // Cria barbeiro
    const { data, error } = await supabase.from('barbers').insert([{ name }]).select();
    console.log('Insert barber:', { data, error });
    if (error || !data || !data[0]) {
      setCreateError('Erro ao cadastrar barbeiro. Tente novamente.');
      toast({ title: 'Erro', description: 'Erro ao cadastrar barbeiro.', variant: 'destructive' });
      setSaving(false);
      return;
    }
    const barberId = data[0].id;
    // Cria horários
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
        setCreateError('Erro ao salvar horários.');
        toast({ title: 'Erro', description: 'Erro ao salvar horários.', variant: 'destructive' });
        setSaving(false);
        return;
      }
    }
    setName('');
    setCreateSchedules(getDefaultSchedules());
    setCreateDefaultStart('09:00');
    setCreateDefaultEnd('18:00');
    setCreateDefaultDays(['monday','tuesday','wednesday','thursday','friday']);
    setOpen(false);
    fetchBarbers();
    toast({ title: 'Sucesso', description: 'Barbeiro cadastrado com sucesso!' });
    setSaving(false);
  };

  // Atualizar openEditModal para buscar horários reais do Supabase
  const openEditModal = async (barber: Barber) => {
    setEditBarber(barber);
    setEditName(barber.name);
    const { data, error } = await supabase
      .from('barber_schedules')
      .select('*')
      .eq('barber_id', barber.id);
    if (!error && data) {
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
    setEditOpen(true);
  };

  // Função para salvar alterações dos horários
  const handleSaveSchedules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBarber) return;
    setSaving(true);
    // Atualiza nome do barbeiro
    console.log('Update barber:', editBarber, editName);
    const { data: updateData, error: updateError } = await supabase.from('barbers').update({ name: editName }).eq('id', editBarber.id).select();
    console.log('Update result:', updateData, updateError);
    if (updateError) {
      toast({ title: 'Erro', description: 'Erro ao atualizar barbeiro.', variant: 'destructive' });
      setSaving(false);
      return;
    }
    // Remove todos os horários antigos do barbeiro
    const { error: deleteError } = await supabase.from('barber_schedules').delete().eq('barber_id', editBarber.id);
    if (deleteError) {
      toast({ title: 'Erro', description: 'Erro ao remover horários antigos.', variant: 'destructive' });
      setSaving(false);
      return;
    }
    // Insere os horários ativos
    const toInsert = editSchedules
      .filter(s => s.active && s.start_time && s.end_time)
      .map(s => ({
        barber_id: editBarber.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
      }));
    if (toInsert.length > 0) {
      const { error: schError } = await supabase.from('barber_schedules').insert(toInsert);
      if (schError) {
        toast({ title: 'Erro', description: 'Erro ao salvar horários.', variant: 'destructive' });
        setSaving(false);
        return;
      }
    }
    setEditOpen(false);
    fetchBarbers();
    toast({ title: 'Sucesso', description: 'Barbeiro atualizado com sucesso!' });
    setSaving(false);
  };

  const handleApplyDefault = () => {
    setEditSchedules(schedules =>
      schedules.map(sch =>
        defaultDays.includes(sch.day_of_week)
          ? { ...sch, start_time: defaultStart, end_time: defaultEnd, active: true }
          : sch
      )
    );
  };

  const handleRemoveBarber = async () => {
    if (!editBarber) return;
    setRemoving(true);
    // Remove horários
    await supabase.from('barber_schedules').delete().eq('barber_id', editBarber.id);
    // Remove barbeiro
    await supabase.from('barbers').delete().eq('id', editBarber.id);
    setRemoving(false);
    setEditOpen(false);
    fetchBarbers();
  };

  const handleRemoveBarberFromList = async (barber: Barber) => {
    // Remove horários
    await supabase.from('barber_schedules').delete().eq('barber_id', barber.id);
    // Remove barbeiro
    await supabase.from('barbers').delete().eq('id', barber.id);
    fetchBarbers();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} userRole="admin" />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gerenciar Barbeiros</h1>
              <p className="text-muted-foreground">
                Cadastre, edite e remova barbeiros e seus horários de trabalho.
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="btn-premium w-full sm:w-auto">Cadastrar Barbeiro</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 overflow-hidden sm:rounded-lg">
                <div className="sticky top-0 left-0 right-0 z-20 bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-2 border-b border-border/20 flex items-center justify-between">
                  <DialogTitle className="text-lg sm:text-2xl">Novo Barbeiro</DialogTitle>
                  <DialogClose asChild>
                    <button aria-label="Fechar" className="rounded-full p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                      <span className="sr-only">Fechar</span>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </DialogClose>
                </div>
                <form onSubmit={handleAddBarber} className="flex flex-col h-full">
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
                          <Input type="time" value={createDefaultStart} onChange={e => setCreateDefaultStart(e.target.value)} className="w-24" />
                          <span>até</span>
                          <Input type="time" value={createDefaultEnd} onChange={e => setCreateDefaultEnd(e.target.value)} className="w-24" />
                        </div>
                        <Button size="sm" variant="outline" type="button" onClick={handleApplyCreateDefault} className="w-full sm:w-auto">Aplicar padrão</Button>
                      </div>
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
                        {createSchedules.map((sch, idx) => (
                          <div key={sch.day_of_week} className="p-4 border rounded-lg flex flex-col gap-2 bg-background">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{daysOfWeek.find(d => d.key === sch.day_of_week)?.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{sch.active ? 'Ativo' : 'Não trabalha'}</span>
                                <Switch checked={sch.active} onCheckedChange={checked => setCreateSchedules(schs => schs.map((s, i) => i === idx ? { ...s, active: checked } : s))} />
                              </div>
                            </div>
                            {sch.active && (
                              <div className="flex items-center gap-2">
                                <Input type="time" value={sch.start_time} onChange={e => setCreateSchedules(schs => schs.map((s, i) => i === idx ? { ...s, start_time: e.target.value } : s))} className="w-24" />
                                <span>até</span>
                                <Input type="time" value={sch.end_time} onChange={e => setCreateSchedules(schs => schs.map((s, i) => i === idx ? { ...s, end_time: e.target.value } : s))} className="w-24" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="sticky bottom-0 left-0 right-0 bg-background px-4 sm:px-6 lg:px-8 py-4 border-t border-border/20 z-20 flex flex-col sm:flex-row sm:justify-end gap-2">
                    <Button type="submit" disabled={saving} className="btn-premium w-full sm:w-auto">
                      {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="card-premium p-4 sm:p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Barbeiros Cadastrados</h2>
            {loading ? (
              <p>Carregando...</p>
            ) : barbers.length === 0 ? (
              <p className="text-muted-foreground">Nenhum barbeiro cadastrado.</p>
            ) : (
              <ul className="space-y-4">
                {barbers.map((barber) => (
                  <li key={barber.id} className="border border-border/20 rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">{barber.name}</h3>
                      <p className="text-xs text-muted-foreground">Cadastrado em: {new Date(barber.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button variant="outline" onClick={() => openEditModal(barber)} className="flex-1 sm:flex-auto">Editar</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex-1 sm:flex-auto">Remover</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Barbeiro</AlertDialogTitle>
                            <AlertDialogDescription>Tem certeza que deseja remover este barbeiro? Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveBarberFromList(barber)} className="btn-premium">
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
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
          <form onSubmit={handleSaveSchedules} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 pt-4" style={{ maxHeight: '70vh' }}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Nome</label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="p-4 bg-muted/30 rounded-lg mb-6">
                <h4 className="font-semibold mb-3">Horário Padrão</h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input type="time" value={defaultStart} onChange={e => setDefaultStart(e.target.value)} className="w-24" />
                    <span>até</span>
                    <Input type="time" value={defaultEnd} onChange={e => setDefaultEnd(e.target.value)} className="w-24" />
                  </div>
                  <Button size="sm" variant="outline" type="button" onClick={handleApplyDefault} className="w-full sm:w-auto">Aplicar horário padrão</Button>
                </div>
                <h4 className="font-semibold mb-3">Dias para aplicar o padrão</h4>
                <div className="flex flex-wrap gap-4">
                  {daysOfWeek.map(day => (
                    <label key={day.key} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={defaultDays.includes(day.key)}
                        onChange={e => setDefaultDays(ds => e.target.checked ? [...ds, day.key] : ds.filter(d => d !== day.key))}
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Horários por Dia</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {editSchedules.map((sch, idx) => (
                    <div key={sch.day_of_week} className="p-4 border rounded-lg flex flex-col gap-2 bg-background">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{daysOfWeek.find(d => d.key === sch.day_of_week)?.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{sch.active ? 'Ativo' : 'Não trabalha'}</span>
                          <Switch checked={sch.active} onCheckedChange={checked => setEditSchedules(schs => schs.map((s, i) => i === idx ? { ...s, active: checked } : s))} />
                        </div>
                      </div>
                      {sch.active && (
                        <div className="flex items-center gap-2">
                          <Input type="time" value={sch.start_time} onChange={e => setEditSchedules(schs => schs.map((s, i) => i === idx ? { ...s, start_time: e.target.value } : s))} className="w-24" />
                          <span>até</span>
                          <Input type="time" value={sch.end_time} onChange={e => setEditSchedules(schs => schs.map((s, i) => i === idx ? { ...s, end_time: e.target.value } : s))} className="w-24" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="sticky bottom-0 left-0 right-0 bg-background px-4 sm:px-6 lg:px-8 py-4 border-t border-border/20 z-20 flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button type="submit" disabled={saving} className="btn-premium w-full sm:w-auto">
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
