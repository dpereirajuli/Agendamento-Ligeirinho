import { useState, useEffect, useMemo } from 'react';

interface UseVirtualizationProps {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  overscan?: number;
}

export function useVirtualization({
  itemHeight,
  containerHeight,
  items,
  overscan = 5,
}: UseVirtualizationProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );

    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex,
      items: items.slice(
        Math.max(0, startIndex - overscan),
        endIndex
      ),
    };
  }, [scrollTop, itemHeight, containerHeight, items, overscan]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return {
    visibleItems,
    totalHeight,
    handleScroll,
  };
}
