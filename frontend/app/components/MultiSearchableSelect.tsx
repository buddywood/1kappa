'use client';

import { useState, useRef, useEffect } from 'react';
import { Badge } from '../../components/ui/badge';
import { X } from 'lucide-react';

interface MultiSearchableSelectProps {
  options: Array<{ id: string | number; label: string; value: string | number }>;
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function MultiSearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select options',
  className = '',
  required = false,
}: MultiSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  // Filter options based on search term AND exclude already selected options
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.includes(option.value)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredOptions[highlightedIndex].value);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
    } else if (e.key === 'Backspace' && searchTerm === '' && value.length > 0) {
      // Remove last selected item on backspace if search is empty
      const newValue = [...value];
      newValue.pop();
      onChange(newValue);
    }
  };

  const handleSelect = (optionValue: string | number) => {
    onChange([...value, optionValue]);
    setSearchTerm('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemove = (optionValue: string | number) => {
    onChange(value.filter(v => v !== optionValue));
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className="w-full px-4 py-2 border border-frost-gray dark:border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-crimson focus-within:border-transparent text-midnight-navy dark:text-gray-100 cursor-text bg-white dark:bg-gray-900 min-h-[42px] flex flex-wrap gap-2 items-center"
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
          }
          inputRef.current?.focus();
        }}
      >
        {selectedOptions.map((option) => (
          <Badge key={option.value} variant="secondary" className="flex items-center gap-1">
            {option.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(option.value);
              }}
              className="hover:bg-midnight-navy/20 dark:hover:bg-gray-700 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHighlightedIndex(-1);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true);
          }}
          placeholder={selectedOptions.length === 0 ? placeholder : ''}
          className="outline-none bg-transparent placeholder-gray-400 dark:placeholder-gray-500 text-midnight-navy dark:text-gray-100 flex-1 min-w-[120px]"
          required={required && value.length === 0}
        />
        
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-frost-gray dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
              {options.length === 0 ? "No options available" : "No matching options"}
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  index === highlightedIndex ? 'bg-gray-100 dark:bg-gray-800' : ''
                } text-midnight-navy dark:text-gray-100`}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
