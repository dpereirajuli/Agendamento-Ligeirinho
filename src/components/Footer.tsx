import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Scissors, MapPin, Clock, Phone, Mail, Instagram, Facebook } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import logo from '/logo.svg';
import { useCallback } from 'react';

export const Footer = () => {
  const services = [
    'Corte técnico',
    'Barba Clássica',
    'Tratamento Premium',
    'Estilização de Barba',
  ];

  const quickLinks = [
    { name: 'Sobre Nós', href: '/#sobre-nos' },
    { name: 'Serviços', href: '/#servicos' },
    { name: 'Agendar Agora', href: '/agendamento' },
    { name: 'Contato', href: '/#contato' },
  ];

  const location = useLocation();
  const navigate = useNavigate();
  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location, navigate]);

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-700">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-1 rounded-full bg-amber-500">
                <img src={logo} alt="Logo Barbearia" className="h-10 w-10" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Barbearia</span>
            </div>
            <p className="text-gray-300 leading-relaxed max-w-xs">
              Tradição e estilo em cada corte. Sua experiência única começa aqui.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/" 
                className="p-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-6 w-6 text-amber-500" />
              </a>
              <a 
                href="https://wa.me/" 
                className="p-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-6 w-6 text-amber-500" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-amber-500">Nossos Serviços</h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <Link 
                    to="/agendamento" 
                    className="text-gray-300 hover:text-amber-500 transition-colors text-base"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-amber-500">Links Rápidos</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => {
                if (link.href.startsWith('/#')) {
                  let id = link.href.replace('/#', '');
                  if (id === 'servicos') id = 'galeria';
                  return (
                    <a
                      key={link.name}
                      href={`#${id}`}
                      onClick={e => handleSmoothScroll(e, id)}
                      className="text-gray-300 hover:text-amber-500 transition-colors text-base cursor-pointer block"
                    >
                      {link.name}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-gray-300 hover:text-amber-500 transition-colors text-base"
                  >
                    {link.name}
                  </Link>
                );
              })}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-amber-500">Contato</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-amber-500 mt-1 flex-shrink-0" />
                <div className="text-gray-300 text-base">
                  <p>Rua Joaquim de Oliveira Freitas, 1754</p>
                  <p>Vila Mangalot, São Paulo – SP</p>
                  <p>CEP 05133-004</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="h-6 w-6 text-amber-500 flex-shrink-0" />
                <a href="tel:+5511963477665" className="text-gray-300 hover:text-amber-500 transition-colors text-base">
                  (11) 96347-7665
                </a>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-6 w-6 text-amber-500 flex-shrink-0" />
                <a href="mailto:contato@barbearialigeirinho.com.br" className="text-gray-300 hover:text-amber-500 transition-colors text-base">
                  contato@barbearialigeirinho.com.br
                </a>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-amber-500 mt-1 flex-shrink-0" />
                <div className="text-gray-300 text-base">
                    <p>Terça - Sexta: 9:00 - 21:30</p>
                    <p>Sábado: 9:00 - 21:30</p>
                    <p>Domingo: Fechado</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2025 Barbearia | Desenvolvido por{' '}
              <a 
                href="https://www.linkedin.com/in/juliaodaniel/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-amber-500 hover:underline"
              >
                Daniel Julião
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};