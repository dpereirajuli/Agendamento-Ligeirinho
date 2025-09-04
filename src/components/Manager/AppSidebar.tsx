
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
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { isDark, toggleTheme } = useTheme();
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
    <Sidebar collapsible="icon" className="border-r border-border bg-card">
      <SidebarHeader className="p-4 bg-card">
        <div className="flex items-center justify-center">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : ''}`}>
                <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
              </div>
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="h-6 w-6 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-white' : ''}`}>
                  <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-card-foreground truncate">Ligeirinho</h2>
                  <p className="text-xs text-muted-foreground">Barbershop</p>
                </div>
              </div>
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="h-6 w-6 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-card">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.href}
                    onClick={() => handleNavClick(item.href)}
                    className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-muted text-muted-foreground hover:text-foreground"
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
            <SidebarGroupLabel className="text-muted-foreground">Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === item.href}
                      onClick={() => handleNavClick(item.href)}
                      className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-muted text-muted-foreground hover:text-foreground"
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

      <SidebarFooter className="p-4 bg-card">
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!isCollapsed && <span className="ml-2">Tema</span>}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
