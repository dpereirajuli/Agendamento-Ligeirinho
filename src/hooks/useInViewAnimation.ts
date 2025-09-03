import { useEffect, useRef, useState } from 'react';

export function useInViewAnimation<T extends HTMLElement = HTMLElement>(animationClass: string, options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    // Desabilita animações no mobile para melhor performance
    if (window.innerWidth <= 768) {
      setInView(true);
      return;
    }

    if (!ref.current) return;
    
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1, // Reduzido para melhor performance
        rootMargin: '50px', // Adiciona margem para carregar antes
        ...options
      }
    );
    
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);

  return {
    ref,
    className: inView ? animationClass : '',
  };
} 