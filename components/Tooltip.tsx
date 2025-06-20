
import React, { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string; 
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'right', className }) => {
  const [visible, setVisible] = useState(false);

  let positionClasses = '';
  switch (position) {
    case 'top':
      positionClasses = 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      break;
    case 'bottom':
      positionClasses = 'top-full left-1/2 -translate-x-1/2 mt-2';
      break;
    case 'left':
      positionClasses = 'right-full top-1/2 -translate-y-1/2 mr-2';
      break;
    case 'right':
    default:
      positionClasses = 'left-full top-1/2 -translate-y-1/2 ml-2';
      break;
  }

  return (
    <div
      className={`relative ${className || 'inline-block'}`} // Use passed className or default to inline-block
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocusCapture={() => setVisible(true)} 
      onBlurCapture={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses} z-50
                      w-max max-w-xs sm:max-w-sm
                      rounded-md bg-neutral-800 px-3 py-1.5 
                      text-xs font-merriweather text-white shadow-lg 
                      pointer-events-none
                      transition-opacity duration-150 opacity-100`}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
