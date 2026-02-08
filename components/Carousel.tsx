import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
}

const Carousel: React.FC<CarouselProps> = ({ children, className = "" }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const isScrollable = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 1);
      // Use Math.ceil to handle potential sub-pixel discrepancies in rendering
      setCanScrollRight(isScrollable && Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScrollability();
      el.addEventListener('scroll', checkScrollability, { passive: true });
      const resizeObserver = new ResizeObserver(checkScrollability);
      resizeObserver.observe(el);

      const mutationObserver = new MutationObserver(checkScrollability);
      mutationObserver.observe(el, { childList: true, subtree: true, characterData: true });

      return () => {
        el.removeEventListener('scroll', checkScrollability);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, [checkScrollability, children]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.75;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };
  
  // Re-verify that children exist before cloning
  if (!children) return null;
  
  const child = React.Children.only(children) as React.ReactElement<any>;
  const enhancedChild = React.cloneElement(child, {
      ref: scrollContainerRef,
      // Force overflow properties to ensure the carousel has a consistent container
      className: `${child.props.className || ''} hide-scrollbar overflow-x-auto`.trim(),
      onScroll: (e: React.UIEvent) => {
          if (child.props.onScroll) child.props.onScroll(e);
          checkScrollability();
      }
  });

  return (
    <div className={`relative group/carousel w-full ${className}`}>
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-30 flex items-center pr-8 bg-gradient-to-r from-bg-primary via-bg-primary/40 to-transparent pointer-events-none">
            <button 
                onClick={(e) => { e.stopPropagation(); scroll('left'); }}
                className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 hover:scale-110 transition-all border border-white/10 flex items-center justify-center shadow-2xl pointer-events-auto ml-1"
                aria-label="Scroll left"
            >
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
        </div>
      )}
      
      {enhancedChild}
      
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-30 flex items-center pl-8 bg-gradient-to-l from-bg-primary via-bg-primary/40 to-transparent pointer-events-none">
            <button 
                onClick={(e) => { e.stopPropagation(); scroll('right'); }}
                className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 hover:scale-110 transition-all border border-white/10 flex items-center justify-center shadow-2xl pointer-events-auto mr-1"
                aria-label="Scroll right"
            >
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        </div>
      )}
    </div>
  );
};

export default Carousel;