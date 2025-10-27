import React, { useState, useEffect } from 'react';

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  srcs: (string | null | undefined)[];
  placeholder: string;
  noPlaceholder?: boolean;
}

const FallbackImage: React.FC<FallbackImageProps> = ({ srcs, placeholder, noPlaceholder, ...props }) => {
  const validSrcs = React.useMemo(() => srcs.filter((s): s is string => !!s), [srcs]);
  
  const [imageToRender, setImageToRender] = useState<string>(validSrcs[0] || (noPlaceholder ? 'fail' : placeholder));

  useEffect(() => {
    setImageToRender(validSrcs[0] || (noPlaceholder ? 'fail' : placeholder));
  }, [validSrcs, placeholder, noPlaceholder]);

  const handleError = () => {
    const currentIndex = validSrcs.indexOf(imageToRender);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < validSrcs.length) {
      setImageToRender(validSrcs[nextIndex]);
    } else {
      // No more valid srcs
      if (noPlaceholder) {
        setImageToRender('fail');
      } else {
        // Prevent loop if placeholder fails
        if (imageToRender !== placeholder) {
          setImageToRender(placeholder);
        } else {
          setImageToRender('fail');
        }
      }
    }
  };
  
  if (imageToRender === 'fail') {
    return <div className={props.className} style={{ backgroundColor: 'var(--color-bg-secondary)' }} />;
  }

  return <img src={imageToRender} onError={handleError} {...props} />;
};

export default FallbackImage;
