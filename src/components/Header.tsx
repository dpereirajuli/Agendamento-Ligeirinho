import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Scissors, Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logo from '/logo.webp';
import './Header.css';

interface HeaderProps {
  isAuthenticated?: boolean;
  userRole?: 'client' | 'admin';
  onLogout?: () => void;
}

export const Header = ({ isAuthenticated = false, userRole, onLogout }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Sobre Nós', href: '/#sobre-nos' },
    { name: 'Serviços', href: '/#servicos' },
    { name: 'Agendar', href: '/agendamento' },
    { name: 'Contato', href: '/#contato' },
  ];

  const adminNavigation = [
    { name: 'Painel', href: '/admin' },
    { name: 'Barbeiros', href: '/admin/barbeiros' },
    { name: 'Serviços', href: '/admin/servicos' },
  ];

  const currentNav = userRole === 'admin' ? adminNavigation : navigation;

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
      setIsMenuOpen(false);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black text-white border-b border-gray-800 shadow-lg"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img src={logo} alt="Logo Barbearia" className="h-16 w-auto rounded pt-1" />
            <span className="text-xl font-bold tracking-tight">Barbearia Ligeirinho</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {currentNav.map((item) => {
              // Scroll suave para âncoras da Home
              if (item.href.startsWith('/#')) {
                let id = item.href.replace('/#', '');
                if (id === 'servicos') id = 'galeria';
                return (
                  <a
                    key={item.name}
                    href={`#${id}`}
                    onClick={e => handleSmoothScroll(e, id)}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-amber-500',
                      location.hash === `#${id}` ? 'text-amber-500' : 'text-gray-300'
                    )}
                  >
                    {item.name}
                  </a>
                );
              }
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-amber-500',
                    location.pathname === item.href ? 'text-amber-500' : 'text-gray-300'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {userRole === 'admin' && (
                  <span className="text-sm text-gray-300">Usuário Admin</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  className="flex items-center space-x-2 border-amber-500 text-amber-500 hover:bg-amber-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </Button>
              </div>
            ) : (
              <>
                <Button size="sm" asChild className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Link to="/agendamento">Agendar</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              'lg:hidden p-2 rounded-lg transition-colors relative z-50',
              isMenuOpen ? 'bg-amber-500/20' : 'hover:bg-amber-500/20'
            )}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menu"
          >
            <span className={cn('block w-7 h-1 bg-amber-500 rounded transition-all duration-300', isMenuOpen ? 'rotate-45 translate-y-2' : 'mb-1')}></span>
            <span className={cn('block w-7 h-1 bg-amber-500 rounded transition-all duration-300', isMenuOpen ? 'opacity-0' : 'mb-1')}></span>
            <span className={cn('block w-7 h-1 bg-amber-500 rounded transition-all duration-300', isMenuOpen ? '-rotate-45 -translate-y-2' : '')}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden fixed top-0 right-0 h-full bg-gray-900 text-white border-l border-gray-700 shadow-lg transition-all duration-500 ease-in-out animate-slide-in-menu" style={{ maxWidth: '70vw', width: '100%', zIndex: 40 }}>
            <div className="px-4 py-6 space-y-4">
              {currentNav.map((item) => {
                if (item.href.startsWith('/#')) {
                  let id = item.href.replace('/#', '');
                  if (id === 'servicos') id = 'galeria';
                  return (
                    <a
                      key={item.name}
                      href={`#${id}`}
                      onClick={e => handleSmoothScroll(e, id)}
                      className="block text-sm font-medium text-gray-300 hover:text-amber-500 transition-colors"
                    >
                      {item.name}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="block text-sm font-medium text-gray-300 hover:text-amber-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-gray-700 space-y-3">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onLogout?.();
                      setIsMenuOpen(false);
                    }}
                    className="w-full border-amber-500 text-amber-500 hover:bg-amber-500/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                ) : (
                  <>
                    <Button size="sm" asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                      <Link to="/agendamento" onClick={() => setIsMenuOpen(false)}>
                        Agendar
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};