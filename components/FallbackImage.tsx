import React, { useState, useEffect } from 'react';

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  srcs: (string | null | undefined)[];
  placeholder: string;
}

const FallbackImage: React.FC<FallbackImageProps> = ({ srcs, placeholder, ...props }) => {
  // Memoize the valid (non-null, non-undefined) sources to avoid re-filtering on every render
  const validSrcs = React.useMemo(() => srcs.filter((s): s is string => !!s), [srcs]);
  
  const [currentSrc, setCurrentSrc] = useState<string>(validSrcs[0] || placeholder);
  
  useEffect(() => {
    // When the sources array changes, reset to the first valid source or placeholder
    setCurrentSrc(validSrcs[0] || placeholder);
  }, [validSrcs, placeholder]);

  const handleError = () => {
    // Find the index of the current failing src
    const currentIndex = validSrcs.indexOf(currentSrc);
    const nextIndex = currentIndex + 1;
    
    // If there's a next valid source in our list, try it
    if (nextIndex < validSrcs.length) {
      setCurrentSrc(validSrcs[nextIndex]);
    } else {
      // If all valid sources have failed, fall back to the placeholder
      setCurrentSrc(placeholder);
    }
  };

  // If the placeholder itself fails, we don't want to trigger an infinite error loop.
  const onErrorHandler = currentSrc === placeholder ? undefined : handleError;

  return <img src={currentSrc} onError={onErrorHandler} {...props} />;
};

export default FallbackImage;