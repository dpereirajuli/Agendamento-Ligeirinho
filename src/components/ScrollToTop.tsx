import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollToTop } = useSmoothScroll();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 left-8 bg-amber-500 text-white w-12 h-12 rounded-full flex justify-center items-center shadow-lg hover:bg-amber-600 transition-all duration-300 ease-out z-50 hover:scale-110 active:scale-95"
      aria-label="Voltar ao topo"
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  );
};
