import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export default function ServicesAdmin() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '', duration: '', price: '' });
  const [editing, setEditing] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('services').select('*').order('name');
    if (!error && data) setServices(data);
    else toast({ title: 'Erro', description: 'Erro ao carregar serviços.', variant: 'destructive' });
    setLoading(false);
  };

  const handleOpenNew = () => {
    setForm({ name: '', duration: '', price: '' });
    setEditing(null);
    setError(null);
    setOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditing(service);
    setForm({ name: service.name, duration: String(service.duration), price: String(service.price) });
    setError(null);
    setEditOpen(true);
  };

  const handleDelete = async (id: string) => {
    setRemovingId(id);
    const { error } = await supabase.from('services').delete().eq('id', id);
    setRemovingId(null);
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao remover serviço.', variant: 'destructive' });
      return;
    }
    fetchServices();
    toast({ title: 'Sucesso', description: 'Serviço removido com sucesso!' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!form.name.trim() || !form.duration || !form.price) {
      setError('Preencha todos os campos');
      setSaving(false);
      return;
    }
    if (isNaN(Number(form.duration)) || isNaN(Number(form.price))) {
      setError('Duração e preço devem ser números');
      setSaving(false);
      return;
    }

    try {
      if (editing) {
        const { error: updateError } = await supabase
          .from('services')
          .update({
            name: form.name,
            duration: Number(form.duration),
            price: Number(form.price),
          })
          .eq('id', editing.id);
        if (updateError) throw updateError;
        toast({ title: 'Sucesso', description: 'Serviço atualizado com sucesso!' });
        setEditOpen(false);
      } else {
        const { error: insertError } = await supabase
          .from('services')
          .insert({
            name: form.name,
            duration: Number(form.duration),
            price: Number(form.price),
          });
        if (insertError) throw insertError;
        toast({ title: 'Sucesso', description: 'Serviço cadastrado com sucesso!' });
        setOpen(false);
      }
      setEditing(null);
      setForm({ name: '', duration: '', price: '' });
      fetchServices();
    } catch (error) {
      setError('Erro ao salvar serviço. Tente novamente.');
      toast({ title: 'Erro', description: 'Erro ao salvar serviço.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Gerenciar Serviços | Barbearia Premium São Paulo</title>
        <meta name="description" content="Gerencie os serviços oferecidos pela Barbearia Premium em São Paulo. Adicione, edite ou remova cortes, barbas e tratamentos." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} userRole="admin" />
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Gerenciar Serviços</h1>
                <p className="text-muted-foreground">Cadastre, edite e remova serviços oferecidos.</p>
              </div>
              {/* Modal de cadastro */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-premium w-full sm:w-auto" onClick={handleOpenNew}>Cadastrar Serviço</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0 overflow-hidden sm:rounded-lg">
                  <div className="sticky top-0 left-0 right-0 z-20 bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-2 border-b border-border/20 flex items-center justify-between">
                    <DialogTitle className="text-lg sm:text-2xl">Novo Serviço</DialogTitle>
                    <DialogClose asChild>
                      <button aria-label="Fechar" className="rounded-full p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                        <span className="sr-only">Fechar</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </DialogClose>
                  </div>
                  <form onSubmit={e => { setEditing(null); handleSubmit(e); }} className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 pt-4" style={{ maxHeight: '70vh' }}>
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Nome do Serviço</label>
                        <Input
                          placeholder="Nome do serviço"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-2">Duração (minutos)</label>
                          <Input
                            type="number"
                            placeholder="Duração"
                            value={form.duration}
                            onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-2">Preço (R$)</label>
                          <Input
                            type="number"
                            placeholder="Preço"
                            value={form.price}
                            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      {error && <div className="text-destructive text-sm mb-4">{error}</div>}
                    </div>
                    <DialogFooter className="sticky bottom-0 left-0 right-0 bg-background px-4 sm:px-6 lg:px-8 py-4 border-t border-border/20 z-20 flex flex-col sm:flex-row sm:justify-end gap-2">
                      <Button type="submit" disabled={saving} className="btn-premium w-full sm:w-auto">
                        {saving ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              {/* Modal de edição */}
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden sm:rounded-lg">
                  <div className="sticky top-0 left-0 right-0 z-20 bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-2 border-b border-border/20 flex items-center justify-between">
                    <DialogTitle className="text-lg sm:text-2xl">Editar Serviço</DialogTitle>
                    <DialogClose asChild>
                      <button aria-label="Fechar" className="rounded-full p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                        <span className="sr-only">Fechar</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </DialogClose>
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 pt-4" style={{ maxHeight: '70vh' }}>
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Nome do Serviço</label>
                        <Input
                          placeholder="Nome do serviço"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-2">Duração (minutos)</label>
                          <Input
                            type="number"
                            placeholder="Duração"
                            value={form.duration}
                            onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-2">Preço (R$)</label>
                          <Input
                            type="number"
                            placeholder="Preço"
                            value={form.price}
                            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      {error && <div className="text-destructive text-sm mb-4">{error}</div>}
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
            <div className="card-premium p-4 sm:p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Serviços Cadastrados</h2>
              {loading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : services.length === 0 ? (
                <p className="text-muted-foreground text-center">Nenhum serviço cadastrado.</p>
              ) : (
                <ul className="space-y-4">
                  {services.map(service => (
                    <li key={service.id} className="border border-border/20 rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg mb-2">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.duration} min • R$ {service.price}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          onClick={() => handleOpenEdit(service)} 
                          className="flex-1 sm:flex-auto"
                        >
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="flex-1 sm:flex-auto"
                              disabled={removingId === service.id}
                            >
                              {removingId === service.id ? 'Removendo...' : 'Remover'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Serviço</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover este serviço? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(service.id)} 
                                className="btn-premium"
                              >
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
      </div>
    </>
  );
}
