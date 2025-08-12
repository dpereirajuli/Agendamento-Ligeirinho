
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 flex items-center justify-between bg-white border-b border-gray-200 px-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
                <h1 className="text-lg font-semibold text-gray-900">
                  Ligeirinho
                </h1>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4">
            {children}
          </main>
          <footer className="h-10 flex items-center justify-center border-t border-gray-200 bg-white text-xs text-gray-500">
            Dtech Labs 2025
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
