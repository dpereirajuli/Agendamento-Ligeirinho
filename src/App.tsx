import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Layout as ManagerLayout } from "@/components/Manager/Layout";
import { ManagerAuthGate } from "@/components/Manager/ManagerAuthGate";
import { LazyWrapper } from "@/components/LazyWrapper";
import { AppLoading } from "@/components/AppLoading";
import { queryClient } from "@/lib/queryClient";
import { useServiceWorker } from "@/hooks/useServiceWorker";

// Páginas públicas - carregamento imediato
import Home from "./pages/Home";
import Login from "./pages/Login";
import Booking from "./pages/Booking";
import NotFound from "./pages/NotFound";

// Páginas do painel manager/admin - lazy loading
const Dashboard = lazy(() => import("@/pages/Manager/Dashboard"));
const Products = lazy(() => import("@/pages/Manager/Products"));
const Services = lazy(() => import("@/pages/Manager/Services"));
const Sales = lazy(() => import("@/pages/Manager/Sales"));
const Fiado = lazy(() => import("@/pages/Manager/Fiado"));
const Transactions = lazy(() => import("@/pages/Manager/Transactions"));
const Expenses = lazy(() => import("@/pages/Manager/Expenses"));
const BarbersManager = lazy(() => import("@/pages/Manager/Barbers"));
const Users = lazy(() => import("@/pages/Manager/Users"));
const Marketing = lazy(() => import("@/pages/Manager/Marketing"));
const NotFoundManager = lazy(() => import("@/pages/Manager/NotFound"));

const App = () => {
  useServiceWorker();
  
  return (
    <AppLoading>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/agendamento" element={<Booking />} />



            <Route path="/admin" element={
              <AuthProvider>
                <Login />
              </AuthProvider>
            } />

            {/* Rotas do painel manager/admin sob /dashboard/* */}
            <Route
              path="/dashboard/*"
              element={
                <AuthProvider>
                  <AppProvider>
                    <ManagerAuthGate>
                      <ManagerLayout>
                        <Suspense fallback={
                          <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        }>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="produtos" element={<Products />} />
                            <Route path="servicos" element={<Services />} />
                            <Route path="vendas" element={<Sales />} />
                            <Route path="fiado" element={<Fiado />} />
                            <Route path="transacoes" element={<Transactions />} />
                            <Route path="gastos" element={<Expenses />} />
                            <Route path="barbeiros" element={<BarbersManager />} />
                            <Route path="usuarios" element={<Users />} />
                            <Route path="marketing" element={<Marketing />} />
                            <Route path="*" element={<NotFoundManager />} />
                          </Routes>
                        </Suspense>
                      </ManagerLayout>
                    </ManagerAuthGate>
                  </AppProvider>
                </AuthProvider>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </AppLoading>
  );
};

export default App;
