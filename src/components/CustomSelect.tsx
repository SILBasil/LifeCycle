import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'เลือกรายการ...',
  className = '',
  disabled = false,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const paddingClasses = size === 'sm' ? 'py-1 px-2.5 text-xs' : 'py-2 px-3 text-sm';

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left font-hand ${className}`}
    >
      {/* Select trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 bg-paper text-pencil border-2 border-pencil rounded-md sketch-border-sm ${paddingClasses} transition-all ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-control'
            : 'hover:bg-control/60 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer'
        }`}
      >
        <span className="truncate flex items-center gap-1.5 font-bold">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
              <span>{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-pencil-muted font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-pencil-muted flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-pencil' : ''
          }`}
        />
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-paper text-pencil border-2 border-pencil rounded-md sketch-border shadow-sketch max-h-60 overflow-y-auto py-1 animate-fade-in"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-pencil-muted text-center font-hand">
              ไม่มีตัวเลือก
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`px-3 py-2 text-xs md:text-sm font-hand cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    isSelected
                      ? 'bg-amber-100 text-amber-900 font-extrabold'
                      : 'hover:bg-control text-pencil'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {option.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-control font-bold">
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
