import { useCallback } from 'react';

export const useSmoothScroll = () => {
  const scrollTo = useCallback((target: string | HTMLElement, offset: number = 0) => {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    
    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    // Verifica se o navegador suporta scroll-behavior: smooth
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      // Fallback para navegadores antigos
      smoothScrollTo(offsetPosition);
    }
  }, []);

  const smoothScrollTo = (targetPosition: number) => {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 800; // Duração em ms
    let start: number | null = null;

    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    requestAnimationFrame(animation);
  };

  const easeInOutCubic = (t: number, b: number, c: number, d: number) => {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t + b;
    t -= 2;
    return c / 2 * (t * t * t + 2) + b;
  };

  const scrollToTop = useCallback(() => {
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      smoothScrollTo(0);
    }
  }, []);

  const scrollToElement = useCallback((elementId: string, offset: number = 80) => {
    scrollTo(`#${elementId}`, offset);
  }, [scrollTo]);

  return {
    scrollTo,
    scrollToTop,
    scrollToElement
  };
};
