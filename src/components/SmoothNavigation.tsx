import { useSmoothScroll } from '@/hooks/useSmoothScroll';

interface NavigationItem {
  id: string;
  label: string;
  offset?: number;
}

const navigationItems: NavigationItem[] = [
  { id: 'servicos', label: 'Serviços', offset: 80 },
  { id: 'sobre-nos', label: 'Sobre Nós', offset: 80 },
  { id: 'galeria', label: 'Galeria', offset: 80 },
  { id: 'contato', label: 'Contato', offset: 80 },
  { id: 'agendamento', label: 'Agendar', offset: 80 }
];

export const SmoothNavigation = () => {
  const { scrollToElement } = useSmoothScroll();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src="/logo2.webp" 
              alt="Logo Barbearia Ligeirinho" 
              className="h-10 w-auto"
            />
          </div>

          {/* Links de Navegação */}
          <div className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToElement(item.id, item.offset || 80)}
                className="text-gray-700 hover:text-amber-600 font-medium transition-colors duration-200 py-2 px-3 rounded-md hover:bg-amber-50"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Botão CTA Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => scrollToElement('agendamento', 80)}
              className="bg-amber-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              Agendar
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
