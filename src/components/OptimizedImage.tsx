import { useState, useEffect, useRef, memo, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  fallback?: string;
  width?: number;
  height?: number;
  sizes?: string;
}

export const OptimizedImage = memo(function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  loading = 'lazy',
  priority = false,
  fallback = '/logo.webp',
  width,
  height,
  sizes
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(priority ? src : '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '50px',
        threshold: 0.1 
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, priority]);

  useEffect(() => {
    if (isInView) {
      setImageSrc(src);
      setIsLoaded(false);
      setHasError(false);
    }
  }, [src, isInView]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    if (imageSrc !== fallback) {
      setImageSrc(fallback);
      setHasError(true);
    }
  }, [imageSrc, fallback]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      loading={priority ? 'eager' : loading}
      decoding="async"
      width={width}
      height={height}
      sizes={sizes}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        transition: 'opacity 0.3s ease-in-out',
        willChange: 'opacity',
      }}
    />
  );
});
