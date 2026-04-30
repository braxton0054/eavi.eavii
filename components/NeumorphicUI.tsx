import React from 'react';

interface NeuCardProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
  dark?: boolean;
  glass?: boolean;
}

export function NeuCard({ children, className = '', inset = false, dark = false, glass = false }: NeuCardProps) {
  const baseClass = glass 
    ? (inset ? 'glass-neu-inset' : 'glass-neu')
    : dark 
      ? (inset ? 'dark-neu-inset' : 'dark-neu')
      : (inset ? 'neu-inset' : 'neu');

  return (
    <div className={`${baseClass} ${className}`}>
      {children}
    </div>
  );
}

interface NeuButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  dark?: boolean;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function NeuButton({ children, onClick, className = '', dark = false, type = 'button', disabled = false }: NeuButtonProps) {
  const baseClass = dark ? 'dark-neu-btn' : 'neu-btn';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} px-6 py-3 font-semibold ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </button>
  );
}

interface NeuInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  dark?: boolean;
}

export function NeuInput({ type = 'text', placeholder, value, onChange, className = '', dark = false }: NeuInputProps) {
  const baseClass = dark ? 'dark-neu-input' : 'neu-input';
  
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`${baseClass} px-4 py-3 w-full outline-none ${className}`}
    />
  );
}
