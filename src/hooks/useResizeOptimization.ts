import { useEffect, useRef, useCallback } from 'react';

interface UseResizeOptimizationProps {
  throttleMs?: number;
  passive?: boolean;
}

export function useResizeOptimization({ 
  throttleMs = 100, 
  passive = true 
}: UseResizeOptimizationProps = {}) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastResizeTime = useRef(0);

  const throttledResizeHandler = useCallback((callback: () => void) => {
    const now = Date.now();
    
    if (now - lastResizeTime.current >= throttleMs) {
      callback();
      lastResizeTime.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback();
        lastResizeTime.current = Date.now();
      }, throttleMs - (now - lastResizeTime.current));
    }
  }, [throttleMs]);

  const addResizeListener = useCallback((callback: () => void) => {
    const handler = () => throttledResizeHandler(callback);
    
    window.addEventListener('resize', handler, { passive });
    
    return () => {
      window.removeEventListener('resize', handler);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [throttledResizeHandler, passive]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { addResizeListener, throttledResizeHandler };
}
