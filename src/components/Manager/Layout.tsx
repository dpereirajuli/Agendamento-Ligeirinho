
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Menu, Moon, Sun } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const { setOpenMobile } = useSidebar();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center justify-between bg-background border-b border-border px-4 shrink-0 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenMobile(true)}
            className="h-8 w-8 p-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
            <h1 className="text-lg font-semibold text-foreground">
              Ligeirinho
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 p-0"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-background">
          {children}
        </main>
        <footer className="h-10 flex items-center justify-center border-t border-border bg-background text-xs text-muted-foreground">
          Dtech Labs 2025
        </footer>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
