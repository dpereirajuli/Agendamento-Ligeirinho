import {
  DollarSign,
  RefreshCw,
  Calendar,
  MoreHorizontal,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Banknote,
  Search,
  Moon,
  Sun,
  CalendarIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/contexts/AppContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ================== Tipagens ==================
interface Appointment {
  id: number;
  client_name: string;
  service_id: string; // ids separados por vírgula
  barber_id: number | string;
  date: string; // yyyy-mm-dd
  start_time: string; // HH:mm
  phone: string;
  notes?: string;
  status?: "pending" | "confirmed" | "canceled" | "cancelled";
}

interface Service {
  id: string | number;
  type: string;
  duration: number;
  price: number;
}

export default function Dashboard() {
  const { products, transactions, barbers, loading } = useApp();
  const { toast } = useToast();
  const qc = useQueryClient();

  // ================== Estados ==================
  const [darkMode, setDarkMode] = useState(true);
  const [isStockExpanded, setIsStockExpanded] = useState(false);
  
  useEffect(() => {
    const prefersDark = localStorage.getItem("prefers-dark");
    const startDark = prefersDark ? prefersDark === "1" : true;
    setDarkMode(startDark);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("prefers-dark", "1");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("prefers-dark", "0");
    }
  }, [darkMode]);

  // ================== Filtros / busca ==================
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchClient, setSearchClient] = useState<string>("");
  const isAnyFilterActive = !!filterStartDate || !!filterEndDate || filterStatus !== "all";

  // ================== Queries (React Query) ==================
  const fetchServices = async (): Promise<Service[]> => {
    const { data, error } = await supabase.from("services").select("*").order("type");
    if (error) throw error;
    return data || [];
  };

  const fetchAppointments = async (): Promise<Appointment[]> => {
    let query = supabase.from("bookings").select("*").order("date, start_time");
    if (isAnyFilterActive) {
      if (filterStartDate) query = query.gte("date", filterStartDate);
      if (filterEndDate) query = query.lte("date", filterEndDate);
      if (filterStatus !== "all") query = query.eq("status", filterStatus);
    } else {
      // sem filtros: retorna só hoje
      query = query.eq("date", todayStr);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: appointments = [],
    isLoading: loadingAppointments,
    isFetching: fetchingAppointments,
  } = useQuery({
    queryKey: [
      "appointments",
      { filterStartDate, filterEndDate, filterStatus, todayStr, isAnyFilterActive },
    ],
    queryFn: fetchAppointments,
    refetchOnWindowFocus: false,
  });

  // ================== Helpers ==================
  const currency = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    []
  );

  const getServices = (serviceId: string) => {
    if (!serviceId) return [] as Service[];
    const ids = serviceId.split(",").map((s) => String(s).trim());
    return ids
      .map((id) => services.find((s) => String(s.id) === id))
      .filter(Boolean) as Service[];
  };

  const getBarberName = (barberId: number | string) => {
    const id = String(barberId);
    return barbers.find((b: any) => String(b.id) === id)?.name || "Desconhecido";
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    const meses = [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ];
    return `${day} de ${meses[parseInt(month, 10) - 1]}.`;
  };

  const cleanPhone = (phone: string) => `+55${phone.replace(/\D/g, "")}`;

  // ================== Funções para calendário ==================
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDateFromInput = (dateString: string) => {
    if (!dateString) return undefined;
    return new Date(dateString + 'T00:00:00');
  };

  const totalAppointments = appointments.length;
  const appointmentsRevenue = useMemo(() => {
    return appointments.reduce((sum, a) => {
      const list = getServices(a.service_id);
      const value = list.reduce((s, srv) => s + (srv?.price || 0), 0);
      return sum + value;
    }, 0);
  }, [appointments, services]);

  // ================== Transações do dia ==================
  const todayTransactions = useMemo(
    () =>
      transactions.filter(
        (t: any) => {
          if (!t.date || !t.date.toDateString) return false;
          const transactionDate = t.date.toDateString();
          const today = new Date().toDateString();
          return transactionDate === today && t.status === "completed";
        }
      ),
    [transactions]
  );
  const todayRevenue = useMemo(
    () => todayTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
    [todayTransactions]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p: any) => p.stock <= p.minStock),
    [products]
  );

  // ================== Mutations (status/Excluir) ==================
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Appointment["status"] }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      return { id, status };
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["appointments"] });
      const prev = qc.getQueryData<Appointment[]>(["appointments", { filterStartDate, filterEndDate, filterStatus, todayStr, isAnyFilterActive }]);
      if (prev) {
        qc.setQueryData<Appointment[]>(
          ["appointments", { filterStartDate, filterEndDate, filterStatus, todayStr, isAnyFilterActive }],
          prev.map((a) => (a.id === vars.id ? { ...a, status: vars.status } : a))
        );
      }
      return { prev };
    },
    onError: (err, _vars, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["appointments", { filterStartDate, filterEndDate, filterStatus, todayStr, isAnyFilterActive }], ctx.prev);
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onSuccess: () => {
      toast({ title: "Status atualizado" });
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["appointments"] });
      const prev = qc.getQueryData<Appointment[]>(["appointments", { filterStartDate, filterEndDate, filterStatus, todayStr, isAnyFilterActive }]);
      if (prev) {
        qc.setQueryData<Appointment[]>(
          ["appointments", { filterStartDate, filterEndDate, filterStatus, todayStr, isAnyFilterActive }],
          prev.filter((a) => a.id !== id)
        );
      }
      return { prev };
    },
    onError: (err, _id, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["appointments", { filterStartDate, filterEndDate, filterStatus, todayStr, isAnyFilterActive }], ctx.prev);
      toast({ title: "Erro ao excluir", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onSuccess: () => toast({ title: "Agendamento excluído" }),
  });

  // ================== Notificar via WhatsApp ==================
  const notify = (a: Appointment) => {
    const list = getServices(a.service_id);
    let names = "";
    if (list.length === 1) names = list[0].type;
    else if (list.length === 2) names = `${list[0].type} e ${list[1].type}`;
    else if (list.length > 2) names = `${list.slice(0, -1).map((s) => s.type).join(", ")} e ${list[list.length - 1].type}`;

    const message = `Olá ${a.client_name}, seu agendamento para ${names} no dia ${formatDate(
      a.date
    )} às ${a.start_time} foi confirmado.`;
    const url = `https://wa.me/${cleanPhone(a.phone)}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // ================== UI ==================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm opacity-70">Carregando dados do painel...</p>
      </div>
    );
  }

  return (
    <div className={`transition-colors ${
      darkMode ? "bg-slate-900 text-slate-50" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm opacity-70">Visão geral do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => qc.invalidateQueries({ queryKey: ["appointments"] })}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${fetchingAppointments ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={() => setDarkMode((p) => !p)} variant="ghost" size="sm" className="gap-2">
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {darkMode ? "Claro" : "Escuro"}
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 items-start">
        <Card className="shadow-sm min-h-[120px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Vendas Hoje</span>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{currency.format(todayRevenue)}</div>
                <p className="text-xs opacity-70">{todayTransactions.length} transações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <motion.div layout className="min-h-[120px]">
          <Card className="shadow-sm h-full">
            <CardContent className="p-6">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsStockExpanded((p) => !p)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Estoque Baixo</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <div className="text-2xl font-bold">{lowStockProducts.length}</div>
                    <p className="text-xs opacity-70">
                      {lowStockProducts.length > 0
                        ? "Clique para ver"
                        : "Nenhum produto"}
                    </p>
                  </div>
                  {lowStockProducts.length > 0 && (isStockExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                </div>
              </div>
              <AnimatePresence initial={false}>
                {isStockExpanded && lowStockProducts.length > 0 && (
                  <motion.div
                    key="stock"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4"
                  >
                    <div className="space-y-2">
                      {lowStockProducts.map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center text-sm border-b border-border/20 pb-2 last:border-0">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-rose-500">{p.stock} un.</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        <Card className="shadow-sm min-h-[120px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Agendamentos Hoje</span>
                <Calendar className="h-4 w-4 text-sky-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{totalAppointments}</div>
                <p className="text-xs opacity-70">
                  {appointments.filter((a) => a.status === "confirmed").length} confirmados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm min-h-[120px]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Receita Agendamentos</span>
                <Banknote className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{currency.format(appointmentsRevenue)}</div>
                <p className="text-xs opacity-70">{isAnyFilterActive ? "no período filtrado" : "de hoje"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Filtros
          </CardTitle>
          <CardDescription>Refine sua busca de agendamentos</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Data inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full md:w-[240px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterStartDate ? (
                      format(parseDateFromInput(filterStartDate) || new Date(), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={parseDateFromInput(filterStartDate)}
                    onSelect={(date) => setFilterStartDate(formatDateForInput(date))}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Data final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full md:w-[240px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterEndDate ? (
                      format(parseDateFromInput(filterEndDate) || new Date(), "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={parseDateFromInput(filterEndDate)}
                    onSelect={(date) => setFilterEndDate(formatDateForInput(date))}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 w-full md:w-64">
            <label className="text-xs text-muted-foreground">Buscar cliente</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
              <Input
                className="pl-8"
                placeholder="Digite o nome..."
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setFilterStartDate("");
                setFilterEndDate("");
                setFilterStatus("all");
                setSearchClient("");
                qc.invalidateQueries({ queryKey: ["appointments"] });
              }}
            >
              Limpar
            </Button>
            <Button onClick={() => qc.invalidateQueries({ queryKey: ["appointments"] })}>Aplicar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Agendamentos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> {isAnyFilterActive ? "Agendamentos Filtrados" : "Agendamentos de Hoje"}
          </CardTitle>
          <CardDescription>
            {isAnyFilterActive ? "Baseados nos filtros aplicados" : "Todos os agendamentos para hoje"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAppointments || loadingServices ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg animate-pulse bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-10 opacity-80">Nenhum agendamento encontrado.</div>
          ) : (
            <div className="space-y-3">
              {appointments
                .filter((a) => a.client_name.toLowerCase().includes(searchClient.toLowerCase()))
                .map((a) => {
                  const sList = getServices(a.service_id);
                  const price = sList.reduce((s, srv) => s + (srv?.price || 0), 0);
                  const barberName = getBarberName(a.barber_id);
                  const statusColor =
                    a.status === "confirmed"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                      : a.status === "canceled" || a.status === "cancelled"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200";

                  let serviceNames = "";
                  if (sList.length === 1) serviceNames = sList[0].type;
                  else if (sList.length === 2) serviceNames = `${sList[0].type} e ${sList[1].type}`;
                  else if (sList.length > 2)
                    serviceNames = `${sList.slice(0, -1).map((s) => s.type).join(", ")} e ${sList[sList.length - 1].type}`;

                  return (
                    <motion.div
                      key={a.id}
                      layout
                      className="border rounded-lg p-4 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base">{a.client_name}</h3>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColor}`}>
                              {a.status === "confirmed"
                                ? "Confirmado"
                                : a.status === "canceled" || a.status === "cancelled"
                                ? "Cancelado"
                                : "Pendente"}
                            </span>
                            <span className="text-sm font-semibold text-primary">{currency.format(price)}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 text-sm opacity-80">
                            <div>
                              <span className="font-medium">Data:</span> {formatDate(a.date)}
                            </div>
                            <div>
                              <span className="font-medium">Barbeiro:</span> {barberName}
                            </div>
                            <div>
                              <span className="font-medium">Horário:</span> {a.start_time}
                            </div>
                            <div>
                              <span className="font-medium">Telefone:</span> {a.phone}
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Serviços:</span> {serviceNames || "-"}
                          </div>
                          {a.notes && (
                            <div className="text-sm bg-slate-100 dark:bg-slate-800 rounded p-2">
                              <span className="font-medium">Observações:</span> {a.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 items-center self-start md:self-auto">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => updateStatus.mutate({ id: a.id, status: "confirmed" })}
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus.mutate({ id: a.id, status: "pending" })}
                          >
                            Pendente
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus.mutate({ id: a.id, status: "canceled" })}
                          >
                            Cancelar
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => notify(a)}>Notificar</DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir este agendamento?")) {
                                    deleteAppointment.mutate(a.id);
                                  }
                                }}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rodapé leve */}
      <div className="text-[11px] opacity-60 text-center mt-6">
        Paleta: <span className="font-medium">Slate</span> com acentos <span className="font-medium">Emerald/Amber/Sky/Rose</span>. Suporta <span className="font-medium">modo claro/escuro</span>.
      </div>
    </div>
  );
}
