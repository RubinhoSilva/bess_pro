import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const { theme, toggleTheme } = useTheme();
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };
  
  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`${sizeClasses[size]} ${className} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
      aria-label="Alternar tema"
    >
      {theme === 'light' ? (
        <Moon className={`${iconSizeClasses[size]} text-gray-700 dark:text-gray-200`} />
      ) : (
        <Sun className={`${iconSizeClasses[size]} text-gray-700 dark:text-gray-200`} />
      )}
    </Button>
  );
};