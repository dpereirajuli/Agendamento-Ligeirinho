import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AppLoadingProps {
  children: React.ReactNode;
}

export function AppLoading({ children }: AppLoadingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simular carregamento progressivo
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Aguardar carregamento de imagens e recursos
    const preloadImages = () => {
      const imageUrls = [
        '/logo.svg',
        '/logo.webp',
        '/logo2.webp',
        '/fundo.jpg',
        '/galeria.webp',
        '/galeria2.webp',
        '/galeria3.webp',
        '/galeria5.webp',
        '/galeria6.webp',
        '/galeria7.webp',
        '/galeria8.webp',
        '/galeria9.webp',
        '/hero-barbershop.webp',
        '/sobre.webp'
      ];

      const imagePromises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; // Continua mesmo se uma imagem falhar
          img.src = url;
        });
      });

      return Promise.all(imagePromises);
    };

    // Aguardar um tempo mínimo e carregamento de imagens
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
    
    Promise.all([minLoadingTime, preloadImages()])
      .then(() => {
        // Finalizar carregamento
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        {/* Logo */}
        <div className="mb-8 animate-pulse">
          <img 
            src="/logo.webp" 
            alt="Ligeirinho" 
            className="h-20 w-auto mx-auto"
            onLoad={() => setLoadingProgress(prev => Math.max(prev, 30))}
          />
        </div>

        {/* Spinner */}
        <div className="mb-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>

        {/* Texto de carregamento */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Carregando...
        </h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Preparando sua experiência no Ligeirinho
        </p>

        {/* Barra de progresso */}
        <div className="w-64 mt-6">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {Math.round(loadingProgress)}%
          </p>
        </div>

        {/* Dicas de carregamento */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Carregando imagens e recursos...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
