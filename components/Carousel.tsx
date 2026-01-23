import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CarouselProps {
  children: React.ReactNode;
}

const Carousel: React.FC<CarouselProps> = ({ children }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      // A small buffer is added to account for sub-pixel rendering issues in some browsers
      const buffer = 2;
      const isScrollable = el.scrollWidth > el.clientWidth + buffer;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(isScrollable && el.scrollLeft < el.scrollWidth - el.clientWidth - buffer);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScrollability();
      el.addEventListener('scroll', checkScrollability, { passive: true });
      const resizeObserver = new ResizeObserver(checkScrollability);
      resizeObserver.observe(el);

      // Also observe children for content changes that might affect scroll width
      Array.from(el.children).forEach(child => {
        if (child instanceof Element) {
          resizeObserver.observe(child);
        }
      });

      return () => {
        el.removeEventListener('scroll', checkScrollability);
        resizeObserver.disconnect();
      };
    }
  }, [checkScrollability, children]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.8;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };
  
  const child = React.Children.only(children) as React.ReactElement<any>;
  const enhancedChild = React.cloneElement(child, {
      ref: scrollContainerRef
  });

  return (
    <div className="relative group/carousel">
      {canScrollLeft && (
        <button 
          onClick={(e) => { e.stopPropagation(); scroll('left'); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-backdrop/60 backdrop-blur-md rounded-full text-white hover:bg-bg-secondary hover:scale-110 transition-all shadow-2xl border border-white/10 hidden md:flex items-center justify-center"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}
      
      {enhancedChild}
      
      {canScrollRight && (
         <button 
          onClick={(e) => { e.stopPropagation(); scroll('right'); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 bg-backdrop/60 backdrop-blur-md rounded-full text-white hover:bg-bg-secondary hover:scale-110 transition-all shadow-2xl border border-white/10 hidden md:flex items-center justify-center"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default Carousel;