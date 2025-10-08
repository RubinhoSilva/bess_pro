import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from './card';

interface SafeLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SafeLoading: React.FC<SafeLoadingProps> = ({ 
  message = 'Carregando...', 
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className={`animate-spin text-blue-500 ${sizeClasses[size]}`} />
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
};

interface SafeLoadingCardProps extends SafeLoadingProps {
  title?: string;
}

export const SafeLoadingCard: React.FC<SafeLoadingCardProps> = ({ 
  message, 
  size,
  className,
  title
}) => {
  return (
    <Card className={className}>
      {(title) && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
      )}
      <CardContent>
        <SafeLoading message={message} size={size} />
      </CardContent>
    </Card>
  );
};

export default SafeLoading;