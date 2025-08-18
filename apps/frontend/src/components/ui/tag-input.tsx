import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from './badge';
import { Input } from './input';
import { Button } from './button';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = "Adicionar tag...",
  className = "",
  maxTags,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !value.includes(trimmedTag) &&
      (!maxTags || value.length < maxTags)
    ) {
      onChange([...value, trimmedTag]);
    }
    setInputValue('');
    setIsInputVisible(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Escape') {
      setInputValue('');
      setIsInputVisible(false);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Tags existentes */}
      {value.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1"
        >
          <span className="text-xs">{tag}</span>
          {!disabled && (
            <X
              className="h-3 w-3 cursor-pointer hover:text-red-500"
              onClick={() => removeTag(tag)}
            />
          )}
        </Badge>
      ))}

      {/* Input para nova tag */}
      {!disabled && (
        <>
          {isInputVisible ? (
            <div className="flex items-center gap-1">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (inputValue.trim()) {
                    addTag(inputValue);
                  } else {
                    setIsInputVisible(false);
                  }
                }}
                placeholder={placeholder}
                className="h-7 w-32 px-2 text-xs"
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={handleInputSubmit}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            (!maxTags || value.length < maxTags) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => setIsInputVisible(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Tag
              </Button>
            )
          )}
        </>
      )}

      {/* Contador de tags (se maxTags definido) */}
      {maxTags && (
        <span className="text-xs text-muted-foreground self-center">
          {value.length}/{maxTags}
        </span>
      )}
    </div>
  );
};