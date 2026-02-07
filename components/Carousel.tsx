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
      // A small buffer is added to account for sub-pixel rendering issues in some browsers
      const buffer = 2;
      const isScrollable = el.scrollWidth > el.clientWidth + buffer;
      setCanScrollLeft(el.scrollLeft > 1);
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
      ref: scrollContainerRef,
      className: `${child.props.className || ''} hide-scrollbar`
  });

  return (
    <div className={`relative group/carousel w-full ${className}`}>
      {/* Left Gradient Fade & Arrow */}
      <div 
        className={`absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-bg-primary to-transparent pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
      ></div>
      {canScrollLeft && (
        <button 
          onClick={(e) => { e.stopPropagation(); scroll('left'); }}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-30 p-1.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 hover:scale-110 transition-all border border-white/10 flex items-center justify-center shadow-lg group-hover/carousel:scale-110"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      )}
      
      {enhancedChild}
      
      {/* Right Gradient Fade & Arrow */}
      <div 
        className={`absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-bg-primary to-transparent pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
      ></div>
      {canScrollRight && (
         <button 
          onClick={(e) => { e.stopPropagation(); scroll('right'); }}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-30 p-1.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 hover:scale-110 transition-all border border-white/10 flex items-center justify-center shadow-lg group-hover/carousel:scale-110"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Carousel;