
import React from 'react';

interface TextAreaInputProps {
  label: React.ReactNode; // Changed from string to React.ReactNode
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  required = false,
}) => {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="block text-sm font-merriweather font-medium text-neutral-700 mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <textarea
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="mt-1 block w-full px-2.5 py-1.5 font-merriweather bg-white border border-neutral-400 
                   text-neutral-800 placeholder-neutral-500
                   focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 sm:text-sm resize-y shadow-sm"
      />
    </div>
  );
};

export default TextAreaInput;