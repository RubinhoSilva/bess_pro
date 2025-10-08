import { useEffect, useState, useRef } from 'react';

/**
 * Hook para intersection observer - útil para lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return [ref, isIntersecting];
}

/**
 * Hook para lazy loading de dados com intersection observer
 */
export function useLazyData<T>(
  fetchData: () => Promise<T>,
  options: IntersectionObserverInit = { rootMargin: '100px' }
): {
  ref: React.RefObject<HTMLDivElement>;
  data: T | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [ref, isIntersecting] = useIntersectionObserver(options);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (isIntersecting && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setIsLoading(true);
      
      fetchData()
        .then(setData)
        .catch(setError)
        .finally(() => setIsLoading(false));
    }
  }, [isIntersecting, fetchData]);

  return {
    ref,
    data,
    isLoading,
    error
  };
}

/**
 * Hook para carregamento progressivo de listas grandes
 */
export function useVirtualizedLoading<T>(
  items: T[],
  batchSize: number = 20,
  triggerMargin: number = 5
): {
  visibleItems: T[];
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
} {
  const [loadedCount, setLoadedCount] = useState(batchSize);

  const visibleItems = items.slice(0, loadedCount);
  const hasMore = loadedCount < items.length;

  const loadMore = () => {
    if (hasMore) {
      setLoadedCount(prev => Math.min(prev + batchSize, items.length));
    }
  };

  const reset = () => {
    setLoadedCount(batchSize);
  };

  // Auto-load quando próximo do final
  useEffect(() => {
    if (hasMore && visibleItems.length - triggerMargin <= loadedCount - batchSize) {
      loadMore();
    }
  }, [visibleItems.length, hasMore, loadedCount, triggerMargin, batchSize]);

  return {
    visibleItems,
    hasMore,
    loadMore,
    reset
  };
}

/**
 * Hook para lazy loading de imagens
 */
export function useLazyImage(
  src: string,
  placeholder?: string
): {
  ref: React.RefObject<HTMLImageElement>;
  imageSrc: string;
  isLoaded: boolean;
  error: boolean;
} {
  const [ref, isIntersecting] = useIntersectionObserver({
    rootMargin: '50px'
  });
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isIntersecting && src && !isLoaded) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        setError(true);
      };
      img.src = src;
    }
  }, [isIntersecting, src, isLoaded]);

  return {
    ref: ref as React.RefObject<HTMLImageElement>,
    imageSrc,
    isLoaded,
    error
  };
}

/**
 * Hook para lazy loading de componentes React
 */
export function useLazyComponent<P extends object>(
  importComponent: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType
): {
  Component: React.ComponentType<P> | null;
  isLoading: boolean;
  error: Error | null;
  loadComponent: () => void;
} {
  const [Component, setComponent] = useState<React.ComponentType<P> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadComponent = async () => {
    if (Component || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const module = await importComponent();
      setComponent(() => module.default);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading component:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    Component,
    isLoading,
    error,
    loadComponent
  };
}

/**
 * Hook para scroll infinito otimizado
 */
export function useInfiniteScroll(
  hasNextPage: boolean,
  fetchNextPage: () => void,
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
): React.RefObject<HTMLDivElement> {
  const { threshold = 1, rootMargin = '100px', enabled = true } = options;
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold,
    rootMargin
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && enabled) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, fetchNextPage, enabled]);

  return ref;
}
