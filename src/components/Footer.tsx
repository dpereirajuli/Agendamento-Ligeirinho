import { MapPin, Clock, Phone, Mail, Instagram } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import logo from '/logo.svg';

export const Footer = () => {




  return (
    <footer className="bg-gray-900 text-white border-t border-gray-700">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                href="https://www.instagram.com/ligeirinhosbarbershop" 
                className="p-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6 text-amber-500" />
              </a>
              <a 
                href="https://wa.me/5511963477665" 
                className="p-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-6 w-6 text-amber-500" />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-amber-500">Contato</h3>
            
            {/* Layout em grid para desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Endereço */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-gray-300 text-sm leading-relaxed">
                    <p className="font-medium">Rua Joaquim de Oliveira Freitas, 1754</p>
                    <p className="text-gray-400">Vila Mangalot, São Paulo – SP</p>
                    <p className="text-gray-400 text-xs">CEP 05133-004</p>
                  </div>
                </div>
              </div>
              
              {/* Telefone e Email */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <a href="tel:+5511963477665" className="text-gray-300 hover:text-amber-500 transition-colors text-sm font-medium">
                    (11) 96347-7665
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <a href="mailto:contato@barbearialigeirinho.com.br" className="text-gray-300 hover:text-amber-500 transition-colors text-sm font-medium break-all">
                    contato@barbearialigeirinho.com.br
                  </a>
                </div>
              </div>
              
              {/* Horário */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-gray-300 text-sm leading-relaxed">
                    <p className="font-medium">Terça - Sexta: 9:00 - 21:30</p>
                    <p className="font-medium">Sábado: 9:00 - 21:30</p>
                    <p className="text-gray-400">Domingo: Fechado</p>
                  </div>
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