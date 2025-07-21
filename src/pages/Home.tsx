import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Scissors, Crown, Clock, Award, Users, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TestimonialCard } from '@/components/TestimonialCard';
import heroImage from '@/assets/hero-barbershop.jpg';
import sobreImage from '@/assets/sobre.jpg';
import galeria1 from '@/assets/galeria.jpg';
import galeria2 from '@/assets/galeria2.jpg';
import galeria3 from '@/assets/galeria3.jpg';
import galeria5 from '@/assets/galeria5.jpg';
import galeria6 from '@/assets/galeria6.jpg';
import galeria7 from '@/assets/galeria7.jpg';
import galeria8 from '@/assets/galeria8.jpg';
import galeria9 from '@/assets/galeria9.jpg';
import { useInViewAnimation } from '@/hooks/useInViewAnimation';

export default function Home() {
  const location = useLocation();
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

  const promotionalCards = [
    {
      icon: <Scissors className="h-8 w-8 text-amber-500" />,
      title: 'Corte Premium Masculino',
      description: 'Transforme seu visual com cortes modernos, clássicos e acabamento impecável. Realce sua personalidade com estilo.'
    },
    {
      icon: <Crown className="h-8 w-8 text-amber-500" />,
      title: 'Barba e Cabelo de Excelência',
      description: 'Barbeiros especialistas, atendimento personalizado e técnicas avançadas para um resultado de alto padrão.'
    },
    {
      icon: <Clock className="h-8 w-8 text-amber-500" />,
      title: 'Agendamento Rápido e Sem Fila',
      description: 'Garanta seu horário pelo WhatsApp e aproveite praticidade, pontualidade e conforto.'
    },
    {
      icon: <Star className="h-8 w-8 text-amber-500" />,
      title: 'Workshops & Treinamentos',
      description: 'Em breve: Aprimore suas habilidades com nossos cursos e aprenda com os melhores profissionais do ramo.'
    }
  ];

  const testimonials = [
    {
      name: 'Carlos Silva',
      rating: 5,
      comment: 'Ambiente nota 10, barbeiros atenciosos e um corte impecável. Sempre saio satisfeito e com a autoestima renovada!',
      location: 'São Paulo'
    },
    {
      name: 'João Santos',
      rating: 5,
      comment: 'A Ligeirinho virou minha barbearia de confiança. O atendimento é rápido, o agendamento facilita muito e o resultado é sempre top!',
      location: 'Pirituba'
    },
    {
      name: 'Pedro Costa',
      rating: 5,
      comment: 'Levei meu filho para cortar o cabelo e fomos super bem recebidos. Profissionais cuidadosos e ambiente familiar. Recomendo demais!',
      location: 'Mangalot'
    }
  ];

  const galleryImages = [
    galeria1,
    galeria2,
    galeria3,
    galeria5,
    galeria6,
    galeria7,
    galeria8,
    galeria9,
  ];

  // HERO
  const heroTitleAnim = useInViewAnimation<HTMLHeadingElement>('animate-fade-in-up');
  const heroDescAnim = useInViewAnimation<HTMLParagraphElement>('animate-fade-in-up');
  const heroBtnsAnim = useInViewAnimation<HTMLDivElement>('animate-scale-in');

  // PROMO CARDS
  const promoAnims = promotionalCards.map((_, i) => useInViewAnimation<HTMLDivElement>('animate-fade-in-up'));

  // SOBRE
  const sobreTitleAnim = useInViewAnimation<HTMLHeadingElement>('animate-fade-in-up');
  const sobreP1Anim = useInViewAnimation<HTMLParagraphElement>('animate-fade-in-up');
  const sobreP2Anim = useInViewAnimation<HTMLParagraphElement>('animate-fade-in-up');
  const sobreStatAnims = [0,1,2].map(i => useInViewAnimation<HTMLDivElement>('animate-scale-in'));
  const sobreImgAnim = useInViewAnimation<HTMLDivElement>('animate-slide-in-left');

  // GALERIA
  const galeriaTitleAnim = useInViewAnimation<HTMLHeadingElement>('animate-fade-in-up');
  const galeriaDescAnim = useInViewAnimation<HTMLParagraphElement>('animate-fade-in-up');
  const galeriaImgAnims = galleryImages.map((_, i) => useInViewAnimation<HTMLDivElement>('animate-scale-in'));

  // TESTEMUNHOS
  const depoTitleAnim = useInViewAnimation<HTMLHeadingElement>('animate-fade-in-up');
  const depoDescAnim = useInViewAnimation<HTMLParagraphElement>('animate-fade-in-up');
  const depoCardAnims = testimonials.map((_, i) => useInViewAnimation<HTMLDivElement>('animate-fade-in-up'));

  // CONTATO
  const contatoTitleAnim = useInViewAnimation<HTMLHeadingElement>('animate-fade-in-up');
  const contatoDescAnim = useInViewAnimation<HTMLParagraphElement>('animate-fade-in-up');
  const contatoMapAnim = useInViewAnimation<HTMLDivElement>('animate-fade-in-left');
  const contatoInfoAnim = useInViewAnimation<HTMLDivElement>('animate-fade-in-right');
  const contatoBtnAnim = useInViewAnimation<HTMLButtonElement>('animate-scale-in');

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900/80" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 ref={heroTitleAnim.ref} className={`text-4xl md:text-6xl font-bold text-white mb-6 font-playfair ${heroTitleAnim.className}`}>
            Tradição <span className="text-amber-500">Redefinida</span>
          </h1>
          <p ref={heroDescAnim.ref} className={`text-xl text-gray-300 mb-12 max-w-2xl mx-auto ${heroDescAnim.className}`}>
            Onde tradição e inovação se encontram para criar 
            a experiência de barbearia perfeita. Agende seu momento de excelência.
          </p>
          <div ref={heroBtnsAnim.ref} className={`flex flex-col sm:flex-row gap-6 justify-center ${heroBtnsAnim.className}`}>
            <Button asChild size="lg" className="bg-transparent text-white border-2 border-double border-amber-500 hover:bg-amber-500/10">
              <Link to="/agendamento">Agende Sua Experiência</Link>
            </Button>
            <Button asChild size="lg" className="bg-transparent text-white border-2 border-double border-amber-500 hover:bg-amber-500/10">
              <Link to="#sobre-nos">Conheça Mais</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Promotional Cards Section */}
      <section id="destaques" className="py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {promotionalCards.map((card, index) => (
              <div 
                key={index} 
                ref={promoAnims[index].ref}
                className={`bg-transparent p-6 rounded-xl border-2 border-double border-amber-500 ${promoAnims[index].className}`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-amber-500/10">
                    {card.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 text-center">{card.title}</h3>
                <p className="text-gray-300 text-center">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Heritage Section */}
      <section id="sobre-nos" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 ref={sobreTitleAnim.ref} className={`text-4xl md:text-5xl font-bold text-gray-800 ${sobreTitleAnim.className}`}>
                Uma História de <span className="text-amber-500">Tradição & Inovação</span>
              </h2>
              <p ref={sobreP1Anim.ref} className={`text-lg text-gray-500 leading-relaxed ${sobreP1Anim.className}`}>
                Há mais de 15 anos, a Barbearia Ligeirinho se dedica a oferecer uma experiência única, unindo tradição, atendimento acolhedor e as tendências mais atuais do universo masculino.
              </p>
              <p ref={sobreP2Anim.ref} className={`text-lg text-gray-500 leading-relaxed ${sobreP2Anim.className}`}>
                Nossa equipe é formada por barbeiros apaixonados pelo que fazem, sempre em busca de aperfeiçoamento e prontos para valorizar o seu estilo. Venha viver o melhor da barbearia moderna com a gente!
              </p>
              
              <div className="grid grid-cols-3 gap-8 pt-8">
                {[15, '10K+', 4].map((val, i) => (
                  <div key={i} ref={sobreStatAnims[i].ref} className={`text-center ${sobreStatAnims[i].className}`} style={{ animationDelay: `${600 + i * 200}ms` }}>
                    <div className="text-3xl font-bold text-amber-500 mb-2">{val}</div>
                    <div className="text-sm text-gray-500">{i === 0 ? 'Anos de Experiência' : i === 1 ? 'Clientes Satisfeitos' : 'Barbeiros Mestres'}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative" ref={sobreImgAnim.ref}>
              <div className={`aspect-square rounded-2xl overflow-hidden shadow-md ${sobreImgAnim.className}`}>
                <img 
                  src={sobreImage}
                  alt="Equipe Barbearia Ligeirinho"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="galeria" className="py-24 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 ref={galeriaTitleAnim.ref} className={`text-4xl md:text-5xl font-bold text-gray-800 mb-6 ${galeriaTitleAnim.className}`}>
              Nossa <span className="text-amber-500">Galeria</span>
            </h2>
            <p ref={galeriaDescAnim.ref} className={`text-xl text-gray-500 ${galeriaDescAnim.className}`}>
              Mergulhe na atmosfera única do nosso salão
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div 
                key={index} 
                ref={galeriaImgAnims[index].ref}
                className={`relative overflow-hidden rounded-xl hover:shadow-lg transition-shadow ${index % 3 === 0 ? 'row-span-2' : ''} ${galeriaImgAnims[index].className}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <img 
                  src={image} 
                  alt={`Galeria ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-amber-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 ref={depoTitleAnim.ref} className={`text-4xl md:text-5xl font-bold text-gray-800 mb-6 ${depoTitleAnim.className}`}>
              Depoimentos dos <span className="text-amber-500">Clientes</span>
            </h2>
            <p ref={depoDescAnim.ref} className={`text-xl text-gray-500 ${depoDescAnim.className}`}>
              O que nossos clientes dizem sobre sua experiência
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard 
                key={index} 
                {...testimonial} 
                className={depoCardAnims[index].className}
                ref={depoCardAnims[index].ref}
                style={{ animationDelay: `${index * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-24 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 ref={contatoTitleAnim.ref} className={`text-4xl md:text-5xl font-bold text-gray-800 mb-6 ${contatoTitleAnim.className}`}>
              Visite Nossa <span className="text-amber-500">Barbearia</span>
            </h2>
            <p ref={contatoDescAnim.ref} className={`text-xl text-gray-500 ${contatoDescAnim.className}`}>
              Te esperamos no coração de São Paulo para sua experiência premium
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Map */}
            <div ref={contatoMapAnim.ref} className={`relative h-96 rounded-2xl overflow-hidden shadow-md ${contatoMapAnim.className}`}>
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
            <div ref={contatoInfoAnim.ref} className={`space-y-8 ${contatoInfoAnim.className}`}>
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
                
                <Button asChild ref={contatoBtnAnim.ref} className={`w-full mt-8 bg-amber-500 hover:bg-amber-600 text-white ${contatoBtnAnim.className}`}>
                  <Link to="/agendamento">Agende Agora</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}