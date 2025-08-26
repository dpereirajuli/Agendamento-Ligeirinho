
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Scissors, 
  ShoppingCart, 
  CreditCard, 
  Receipt,
  DollarSign,
  Users,
  Settings,
  Mail,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Produtos', href: '/dashboard/produtos', icon: Package },
  { name: 'Serviços', href: '/dashboard/servicos', icon: Scissors },
  { name: 'Vendas', href: '/dashboard/vendas', icon: ShoppingCart },
  { name: 'Fiado', href: '/dashboard/fiado', icon: CreditCard },
  { name: 'Transações', href: '/dashboard/transacoes', icon: Receipt },
  { name: 'Gastos', href: '/dashboard/gastos', icon: DollarSign },
];

const adminNavigation = [
  { name: 'Barbeiros', href: '/dashboard/barbeiros', icon: Users },
  { name: 'Usuários', href: '/dashboard/usuarios', icon: Settings },
  { name: 'Marketing', href: '/dashboard/marketing', icon: Mail }
];

export function AppSidebar() {
  const { profile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setOpenMobile, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    await signOut();
    navigate('/');
  };

  const isCollapsed = state === 'collapsed';

  const handleNavClick = (href: string) => {
    navigate(href);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-700 bg-gray-900">
      <SidebarHeader className="p-4 bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-12 h-12" />
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="font-bold text-white truncate">Ligeirinho</h2>
                <p className="text-xs text-gray-300">Barbershop</p>
              </div>
            )}
          </div>
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-6 w-6 p-0 hover:bg-gray-800 text-gray-300 hover:text-white"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-gray-900">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.href}
                    onClick={() => handleNavClick(item.href)}
                    className="data-[active=true]:bg-blue-600 data-[active=true]:text-white hover:bg-gray-800 text-gray-300 hover:text-white"
                  >
                    <button className="flex items-center gap-2 w-full">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400">Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === item.href}
                      onClick={() => handleNavClick(item.href)}
                      className="data-[active=true]:bg-blue-600 data-[active=true]:text-white hover:bg-gray-800 text-gray-300 hover:text-white"
                    >
                      <button className="flex items-center gap-2 w-full">
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 bg-gray-900">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
