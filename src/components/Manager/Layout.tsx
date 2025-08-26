
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const { setOpenMobile } = useSidebar();

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center justify-between bg-white border-b border-gray-200 px-4 shrink-0 md:hidden">
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
            <h1 className="text-lg font-semibold text-gray-900">
              Ligeirinho
            </h1>
          </div>
          <div className="w-8" /> {/* Spacer para centralizar o logo */}
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
        <footer className="h-10 flex items-center justify-center border-t border-gray-200 bg-white text-xs text-gray-500">
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
