import React from 'react';
import type { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  id,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5 mb-4 text-left">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none transition-colors duration-200"
      >
        {label}
      </label>
      
      <div className="relative rounded-lg overflow-hidden group">
        <input
          id={id}
          type={type}
          className={`w-full px-4 py-3 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/50 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 
            transition-all duration-300 ease-out group-hover:border-slate-400 dark:group-hover:border-slate-600/70
            ${error ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30' : ''}
            ${className}`}
          {...props}
        />
        <div className="absolute inset-0 border border-brand-500/0 rounded-lg pointer-events-none group-focus-within:border-brand-500/35 transition-all duration-300"></div>
      </div>

      {error && (
        <span className="text-xs font-medium text-red-400 select-none animate-fadeIn duration-200 pl-0.5">
          {error}
        </span>
      )}
    </div>
  );
};
export default FormInput;
