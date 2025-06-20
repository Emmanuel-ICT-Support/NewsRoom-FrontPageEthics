
import React from 'react';

interface TextInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; // Added onBlur
  placeholder?: string;
  type?: string;
  required?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur, // Added onBlur
  placeholder = '',
  type = 'text',
  required = false,
}) => {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="block text-sm font-merriweather font-medium text-neutral-700 mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur} // Added onBlur
        placeholder={placeholder}
        required={required}
        className="mt-1 block w-full px-2.5 py-1.5 font-merriweather bg-white border border-neutral-400 
                   text-neutral-800 placeholder-neutral-500 
                   focus:outline-none focus:ring-1 focus:ring-neutral-600 focus:border-neutral-600 sm:text-sm shadow-sm"
      />
    </div>
  );
};

export default TextInput;