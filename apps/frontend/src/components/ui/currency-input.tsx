import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface CustomCurrencyInputProps {
  value?: number | string;
  onValueChange?: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  decimals?: number; // Nova prop para controlar casas decimais
}

const formatCurrencyDisplay = (value: string, decimals: number = 2): string => {
  // Remove tudo exceto dígitos
  const digitsOnly = value.replace(/\D/g, '');
  
  if (!digitsOnly) return '';
  
  // Converte para número considerando as casas decimais
  const divisor = Math.pow(10, decimals);
  const numericValue = parseInt(digitsOnly) / divisor;
  
  // Formata usando Intl
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numericValue);
};

const extractNumericValue = (formattedValue: string): number => {
  // Remove símbolos e converte vírgula para ponto
  const cleanValue = formattedValue
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(cleanValue) || 0;
};

export const CustomCurrencyInput = React.forwardRef<HTMLInputElement, CustomCurrencyInputProps>(
  ({ className, onValueChange, value, placeholder, decimals = 2, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    
    // Atualiza o valor exibido quando o valor prop muda
    useEffect(() => {
      if (value !== undefined && value !== null) {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
        if (numValue > 0) {
          const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }).format(numValue);
          setDisplayValue(formatted);
        } else {
          setDisplayValue('');
        }
      } else {
        setDisplayValue('');
      }
    }, [value, decimals]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Se o usuário está apagando tudo
      if (!inputValue) {
        setDisplayValue('');
        onValueChange?.(0);
        return;
      }
      
      // Formatar o valor
      const formatted = formatCurrencyDisplay(inputValue, decimals);
      setDisplayValue(formatted);
      
      // Extrair valor numérico e enviar para parent
      const numericValue = extractNumericValue(formatted);
      onValueChange?.(numericValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permitir apenas dígitos, backspace, delete, tab, escape, enter
      if (
        !((e.keyCode >= 48 && e.keyCode <= 57) || // 0-9
          (e.keyCode >= 96 && e.keyCode <= 105) || // numpad 0-9
          e.keyCode === 8 || // backspace
          e.keyCode === 46 || // delete
          e.keyCode === 9 || // tab
          e.keyCode === 27 || // escape
          e.keyCode === 13 || // enter
          (e.keyCode === 65 && e.ctrlKey) || // ctrl+a
          (e.keyCode === 67 && e.ctrlKey) || // ctrl+c
          (e.keyCode === 86 && e.ctrlKey) || // ctrl+v
          (e.keyCode === 88 && e.ctrlKey)) // ctrl+x
      ) {
        e.preventDefault();
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          "text-right", // Alinha o texto à direita como é comum em campos monetários
          className
        )}
        placeholder={placeholder || `R$ 0,${'0'.repeat(decimals)}`}
        {...props}
      />
    );
  }
);

CustomCurrencyInput.displayName = "CustomCurrencyInput";