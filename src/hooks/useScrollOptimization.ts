import { useEffect, useRef, useCallback } from 'react';

interface UseScrollOptimizationProps {
  throttleMs?: number;
  passive?: boolean;
}

export function useScrollOptimization({ 
  throttleMs = 16, 
  passive = true 
}: UseScrollOptimizationProps = {}) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollTime = useRef(0);

  const throttledScrollHandler = useCallback((callback: () => void) => {
    const now = Date.now();
    
    if (now - lastScrollTime.current >= throttleMs) {
      callback();
      lastScrollTime.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback();
        lastScrollTime.current = Date.now();
      }, throttleMs - (now - lastScrollTime.current));
    }
  }, [throttleMs]);

  const addScrollListener = useCallback((element: HTMLElement, callback: () => void) => {
    const handler = () => throttledScrollHandler(callback);
    
    element.addEventListener('scroll', handler, { passive });
    
    return () => {
      element.removeEventListener('scroll', handler);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [throttledScrollHandler, passive]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { addScrollListener, throttledScrollHandler };
}
