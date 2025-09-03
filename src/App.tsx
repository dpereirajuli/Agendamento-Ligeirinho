import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Booking from "./pages/Booking";

import NotFound from "./pages/NotFound";

 
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { Layout as ManagerLayout } from "@/components/Manager/Layout";
import { ManagerAuthGate } from "@/components/Manager/ManagerAuthGate";

// Páginas do painel manager/admin
import Dashboard from "@/pages/Manager/Dashboard";
import Products from "@/pages/Manager/Products";
import Services from "@/pages/Manager/Services";
import Sales from "@/pages/Manager/Sales";
import Fiado from "@/pages/Manager/Fiado";
import Transactions from "@/pages/Manager/Transactions";
import Expenses from "@/pages/Manager/Expenses";
import BarbersManager from "@/pages/Manager/Barbers";
import Users from "@/pages/Manager/Users";
import Marketing from "@/pages/Manager/Marketing";
import NotFoundManager from "@/pages/Manager/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/agendamento" element={<Booking />} />



            <Route path="/entrar" element={
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
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
