import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Scissors, Crown, Clock, Award, Users, Calendar, Star, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';


import heroImage from '/HeroSection.png';
import sobreImage from '@/assets/sobre.jpg';
import galeria1 from '@/assets/galeria.jpg';
import galeria2 from '@/assets/galeria2.jpg';
import galeria3 from '@/assets/galeria3.jpg';
import galeria5 from '@/assets/galeria5.jpg';
import galeria6 from '@/assets/galeria6.jpg';
import galeria7 from '@/assets/galeria7.jpg';
import galeria8 from '@/assets/galeria8.jpg';
import galeria9 from '@/assets/galeria9.jpg';
import logo from '/logo2.webp';
import { useInViewAnimation } from '@/hooks/useInViewAnimation';
import { Helmet } from 'react-helmet-async';



export default function Home() {
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 8; // Total de imagens na galeria

  useEffect(() => {
    if (location.state && location.state.scrollTo) {
      const el = document.getElementById(location.state.scrollTo);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.state]);

  // Funções do carrossel
  const getSlidesPerView = () => {
    if (window.innerWidth >= 1024) return 4; // lg: 4 imagens
    if (window.innerWidth >= 768) return 3;  // md: 3 imagens
    if (window.innerWidth >= 640) return 2;  // sm: 2 imagens
    return 1; // mobile: 1 imagem
  };

  const navigateCarousel = (direction: 'prev' | 'next') => {
    const slidesPerView = getSlidesPerView();
    const maxSlides = totalSlides - slidesPerView;
    
    if (direction === 'prev') {
      setCurrentSlide(prev => prev === 0 ? maxSlides : prev - 1);
    } else {
      setCurrentSlide(prev => prev >= maxSlides ? 0 : prev + 1);
    }
  };

  const goToSlide = (index: number) => {
    const slidesPerView = getSlidesPerView();
    const maxSlides = totalSlides - slidesPerView;
    setCurrentSlide(Math.min(index, maxSlides));
  };

  // Auto-play do carrossel
  useEffect(() => {
    const interval = setInterval(() => {
      const slidesPerView = getSlidesPerView();
      const maxSlides = totalSlides - slidesPerView;
      setCurrentSlide(prev => prev >= maxSlides ? 0 : prev + 1);
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [totalSlides]);

  // HERO
  const heroTitleAnim = useInViewAnimation<HTMLHeadingElement>('animate-fade-in-up');
  const heroDescAnim = useInViewAnimation<HTMLParagraphElement>('animate-fade-in-up');
  const heroBtnsAnim = useInViewAnimation<HTMLDivElement>('animate-scale-in');

  // Efeito parallax para o fundo
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallax = document.querySelector('.parallax-bg') as HTMLElement;
      if (parallax) {
        const speed = scrolled * 0.5;
        parallax.style.transform = `translateY(${speed}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Helmet>
        <title>Ligeirinho Barbearia | Estilo e Rapidez com Excelência</title>
        <meta name="description" content="Na Ligeirinho Barbearia você encontra cortes modernos, atendimento de alta qualidade e agilidade para transformar seu visual. Agende já sua experiência premium!" />
        <meta name="keywords" content="barbearia, Ligeirinho Barbearia, corte masculino, barba, cabelo, agendamento online, barbeiro profissional, barbearia moderna, estilo, rapidez" />
        <link rel="canonical" href="https://www.ligeirinhobarbearia.com.br/" />
      </Helmet>
      <div className="min-h-screen bg-white">
  

        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Fundo com imagem e efeito parallax */}
          <div
            className="absolute inset-0 z-0 parallax-bg"
            style={{
              backgroundImage: 'url(/fundo.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
              transform: 'translateZ(0)',
              willChange: 'transform'
            }}
          />
          
          {/* Overlay escuro para legibilidade do texto */}
          <div className="absolute inset-0 z-0 bg-black/60" />

          {/* Conteúdo Texto - Centralizado */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-10 text-center max-w-4xl px-4"
          >
            {/* Logo acima do título */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="mb-8"
            >
              <img 
                src={logo} 
                alt="Logo Barbearia Ligeirinho" 
                className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 mx-auto drop-shadow-2xl"
              />
            </motion.div>
            <h1
              ref={heroTitleAnim.ref}
              className={`text-4xl md:text-6xl font-bold text-white mb-6 font-playfair ${heroTitleAnim.className}`}
            >
              <span className="bungee-regular">Barbearia Ligeirinho</span>
            </h1>
            <p
              ref={heroDescAnim.ref}
              className={`text-xl text-gray-200 mb-6 max-w-2xl mx-auto ${heroDescAnim.className}`}
            >
              Relaxe em um ambiente moderno, feito para o homem que valoriza o cuidado e o estilo, seja para um corte, a uma barba perfeitamente aparada.
            </p>
            <div
              ref={heroBtnsAnim.ref}
              className={`flex flex-col sm:flex-row gap-6 justify-center ${heroBtnsAnim.className}`}
            >
              <Link to="/agendamento">
                <button className="relative inline-flex items-center justify-center px-8 py-2.5 overflow-hidden tracking-tighter text-white bg-gradient-to-r from-orange-500 to-orange-700 rounded-md group">
                  <span
                    className="absolute w-0 h-0 transition-all duration-500 ease-out bg-orange-800 rounded-full group-hover:w-56 group-hover:h-56"
                  ></span>
                  <span className="absolute bottom-0 left-0 h-full -ml-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-auto h-full opacity-100 object-stretch"
                      viewBox="0 0 487 487"
                    >
                      <path
                        fillOpacity=".1"
                        fillRule="nonzero"
                        fill="#FFF"
                        d="M0 .3c67 2.1 134.1 4.3 186.3 37 52.2 32.7 89.6 95.8 112.8 150.6 23.2 54.8 32.3 101.4 61.2 149.9 28.9 48.4 77.7 98.8 126.4 149.2H0V.3z"
                      ></path>
                    </svg>
                  </span>
                  <span className="absolute top-0 right-0 w-12 h-full -mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="object-cover w-full h-full"
                      viewBox="0 0 487 487"
                    >
                      <path
                        fillOpacity=".1"
                        fillRule="nonzero"
                        fill="#FFF"
                        d="M487 486.7c-66.1-3.6-132.3-7.3-186.3-37s-95.9-85.3-126.2-137.2c-30.4-51.8-49.3-99.9-76.5-151.4C70.9 109.6 35.6 54.8.3 0H487v486.7z"
                      ></path>
                    </svg>
                  </span>
                  <span
                    className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-orange-900"
                  ></span>
                  <span className="relative text-base font-semibold">Agendar Agora</span>
                </button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Services Section - Nova Paleta */}
        <section id="servicos" className="py-24 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in-up">
                Nossos <span className="text-amber-500">Serviços</span>
              </h2>
              <p className="text-xl text-gray-300 animate-fade-in-up">
                Transforme seu visual com nossos serviços premium
              </p>
            </div>
            
            {/* Nova Paleta de Serviços */}
            <div className="services-palette mx-auto max-w-6xl">
              <div className="palette">
                <div className="color">
                  <img src="/src/assets/galeria.jpg" alt="Corte Clássico" />
                  <span>Corte Clássico</span>
                </div>
                <div className="color">
                  <img src="/src/assets/galeria2.jpg" alt="Corte Moderno" />
                  <span>Corte Moderno</span>
                </div>
                <div className="color">
                  <img src="/src/assets/galeria3.jpg" alt="Barba" />
                  <span>Barba</span>
                </div>
                <div className="color">
                  <img src="/src/assets/galeria5.jpg" alt="Infantil" />
                  <span>Infantil</span>
                </div>
                <div className="color">
                  <img src="/src/assets/galeria6.jpg" alt="Infantil" />
                  <span>Infantil</span>
                </div>
              </div>
              <div id="stats">
                <span className='text-xl text-black font-bold text-center flex-1'>Agende seu horário</span>
              </div>
            </div>

            

            {/* Bloco de informações de contato - responsivo com ícones */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-center">
              {/* WhatsApp */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm">
                <MessageCircle className="h-8 w-8 text-green-400" />
                <div className="space-y-1">
                  <span className="block text-sm font-medium text-gray-300">Entre em contato:</span>
                  <a 
                    href="https://wa.me/5511963477665" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-lg font-semibold text-white hover:text-green-400 transition-colors duration-200"
                  >
                    (11) 96347-7665
                  </a>
                </div>
              </div>

              {/* Endereço */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm">
                <MapPin className="h-8 w-8 text-amber-400" />
                <div className="space-y-1">
                  <span className="block text-sm font-medium text-gray-300">Endereço:</span>
                  <span className="text-sm text-white leading-relaxed">
                    Rua Joaquim de Oliveira Freitas, 1754<br/>
                    Vila Mangalot, São Paulo - SP
                  </span>
                </div>
              </div>

              {/* Horário */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                <Clock className="h-8 w-8 text-blue-400" />
                <div className="space-y-1">
                  <span className="block text-sm font-medium text-gray-300">Horário de Funcionamento:</span>
                  <span className="text-sm text-white leading-relaxed">
                    Terça - Sexta: 9:00 - 21:30<br/>
                    Sábado: 9:00 - 21:30<br/>
                    Domingo: Fechado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Heritage Section */}
        <section id="sobre-nos" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 animate-fade-in-up">
                  Sobre o<span className="text-amber-500"> Ligeirinho</span>
                </h2>
                <p className="text-lg text-gray-500 leading-relaxed animate-fade-in-up">
                  Há mais de 15 anos, nossa barbearia se dedica a oferecer uma experiência única, unindo tradição, atendimento acolhedor e as tendências mais atuais do universo masculino.
                </p>
                <p className="text-lg text-gray-500 leading-relaxed animate-fade-in-up">
                  Nossa equipe é formada por barbeiros apaixonados pelo que fazem, sempre em busca de aperfeiçoamento e prontos para valorizar o seu estilo. Venha viver o melhor da barbearia moderna com a gente!
                </p>
              </div>
              
              <div className="relative animate-slide-in-left">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-md">
                  <img 
                    src={sobreImage}
                    alt="Equipe da Barbearia"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section - Carrossel */}
        <section id="galeria" className="py-24 bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 animate-fade-in-up">
                Nossa <span className="text-amber-500">Galeria</span>
              </h2>
              <p className="text-xl text-gray-500 animate-fade-in-up">
                Mergulhe na atmosfera única do nosso salão
              </p>
            </div>
            
            {/* Carrossel Responsivo */}
            <div className="relative max-w-6xl mx-auto">
              {/* Container do Carrossel */}
              <div className="overflow-hidden rounded-2xl shadow-2xl">
                <div 
                  className="flex transition-transform duration-500 ease-in-out" 
                  id="carousel"
                  style={{ transform: `translateX(-${currentSlide * (100 / getSlidesPerView())}%)` }}
                >
                  {[galeria1, galeria2, galeria3, galeria5, galeria6, galeria7, galeria8, galeria9].map((image, index) => (
                    <div 
                      key={index} 
                      className="relative flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 h-96 sm:h-80 md:h-96"
                    >
                      <img 
                        src={image} 
                        alt={`Galeria ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <h3 className="font-semibold text-lg">Galeria {index + 1}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Botões de Navegação */}
              <button 
                onClick={() => navigateCarousel('prev')}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
                aria-label="Imagem anterior"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                onClick={() => navigateCarousel('next')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
                aria-label="Próxima imagem"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Indicadores */}
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: totalSlides - getSlidesPerView() + 1 }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      currentSlide === index ? 'bg-amber-500 scale-125' : 'bg-gray-400 hover:bg-gray-600'
                    }`}
                    aria-label={`Ir para slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contato" className="py-24 bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 animate-fade-in-up">
                Visite Nossa <span className="text-amber-500">Barbearia</span>
              </h2>
              <p className="text-xl text-gray-500 animate-fade-in-up">
                Te esperamos no coração de São Paulo para sua experiência premium
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Map */}
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-md animate-fade-in-left">
                <iframe 
                  src="https://www.google.com/maps?q=Rua+Joaquim+de+Oliveira+Freitas,+1754+-+Vila+Mangalot,+S%C3%A3o+Paulo+-+SP,+05133-004&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              
              {/* Contact Info */}
              <div className="space-y-8 animate-fade-in-right">
                <div className="bg-white p-8 rounded-xl shadow-md">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Informações</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-amber-500">Localização</h4>
                      <p className="text-gray-500">
                        Rua Joaquim de Oliveira Freitas, 1754 – Vila Mangalot<br />
                        São Paulo – SP<br />
                        CEP 05133-004
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-amber-500">Horários</h4>
                      <div className="text-gray-500 space-y-1">
                        <p>Terça - Sexta: 9:00 - 21:30</p>
                        <p>Sábado: 9:00 - 21:30</p>
                        <p>Domingo: Fechado</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-amber-500">Contatos</h4>
                      <div className="text-gray-500 space-y-1">
                        <p><a href="tel:+5511963477665" className="hover:text-amber-500 transition-colors">Telefone: (11) 96347-7665</a></p>
                        <p><a href="mailto:contato@barbearialigeirinho.com.br" className="hover:text-amber-500 transition-colors">Email: contato@barbearialigeirinho.com.br</a></p>
                      </div>
                    </div>
                  </div>
                  
                  <Button asChild className="w-full mt-8 bg-amber-500 hover:bg-amber-600 text-white animate-scale-in">
                    <Link to="/agendamento">Agende Agora</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />



        {/* Botão flutuante do WhatsApp */}
        <button
          className="fixed bottom-8 right-8 bg-green-500 text-white w-14 h-14 rounded-full flex justify-center items-center shadow-lg hover:bg-green-600 transition-all duration-300 ease-out group z-50 hover:scale-105 active:scale-95"
          aria-label="Chat on WhatsApp"
          onClick={() => {
            const phoneNumber = '5511963477665'; // Número da Barbearia Ligeirinho
            const message = 'Olá! Gostaria de fazer um agendamento ou tirar uma dúvida.';
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
          }}
        >
          <div className="absolute -right-1 -top-1 z-10">
            <div className="flex h-6 w-6 items-center justify-center">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"
              ></span>
              <span
                className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
              >
                1
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 16 16"
            className="w-7 h-7"
            fill="currentColor"
            height="24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"
            ></path>
          </svg>

          <span
            className="absolute inset-0 rounded-full border-4 border-white/30 scale-100 animate-pulse"
          ></span>

          <div
            className="absolute right-full mr-3 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 whitespace-nowrap"
          >
            <div className="bg-gray-800 text-white text-sm px-3 py-1 rounded shadow-lg">
              Precisa de ajuda?
            </div>
            <div
              className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"
            ></div>
          </div>
        </button>
      </div>
    </>
  );
}