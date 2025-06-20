import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger'; // Variants might be less distinct in newspaper theme
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  type = 'button',
  children,
  isLoading = false,
  disabled = false,
  className = '',
  variant = 'primary', // Keep variants, but style them for newspaper theme
}) => {
  const baseStyles = 'inline-flex items-center justify-center px-4 py-2 border text-sm font-oswald uppercase tracking-wider shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-neutral-500';
  
  let variantStyles = '';
  // Adjusting variants for a newspaper theme
  switch (variant) {
    case 'primary':
      // A solid, traditional button
      variantStyles = 'text-white bg-neutral-800 hover:bg-neutral-700 border-neutral-800';
      break;
    case 'secondary':
      // Lighter, perhaps for less critical actions
      variantStyles = 'text-neutral-800 bg-neutral-200 hover:bg-neutral-300 border-neutral-400';
      break;
    case 'danger':
      variantStyles = 'text-white bg-red-700 hover:bg-red-800 border-red-700 focus:ring-red-500';
      break;
  }

  const disabledStyles = 'disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:border-neutral-400';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
    >
      {isLoading && <LoadingSpinner size="w-4 h-4 mr-2" color="text-white" />}
      {children}
    </button>
  );
};

export default Button;