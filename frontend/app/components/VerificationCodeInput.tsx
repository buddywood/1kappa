'use client';

import { useState, useRef, useEffect } from 'react';

interface VerificationCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
}

export default function VerificationCodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
}: VerificationCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync with external value prop
  useEffect(() => {
    const newDigits = value.split('').slice(0, length);
    const padded = [...newDigits, ...Array(length - newDigits.length).fill('')];
    setDigits(padded);
  }, [value, length]);

  const handleChange = (index: number, newValue: string) => {
    // Handle paste (multiple characters)
    if (newValue.length > 1) {
      handlePaste(newValue, index);
      return;
    }

    // Only allow digits
    if (newValue && !/^\d$/.test(newValue)) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = newValue;
    setDigits(newDigits);

    const code = newDigits.join('');
    onChange(code);

    // Auto-advance to next input
    if (newValue && index < length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }

    // Call onComplete when all digits are filled
    if (code.length === length && onComplete) {
      setTimeout(() => {
        onComplete(code);
      }, 0);
    }
  };

  const handlePaste = (pastedValue: string, startIndex: number) => {
    // Extract only digits
    const digitsOnly = pastedValue.replace(/\D/g, '').slice(0, length);
    
    if (digitsOnly.length === 0) return;

    const newDigits = [...digits];
    let filledCount = 0;

    // Fill digits starting from the current index
    for (let i = 0; i < digitsOnly.length && startIndex + i < length; i++) {
      newDigits[startIndex + i] = digitsOnly[i];
      filledCount++;
    }

    setDigits(newDigits);
    const code = newDigits.join('');
    onChange(code);

    // Focus the next empty input or the last input
    setTimeout(() => {
      const nextIndex = Math.min(startIndex + filledCount, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }, 0);

    // Call onComplete if all digits are filled
    if (code.length === length && onComplete) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current input is empty, move to previous and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
      } else if (digits[index]) {
        // If current input has value, clear it
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
        onChange(newDigits.join(''));
      }
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          onPaste={(e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text');
            handlePaste(pastedText, index);
          }}
          disabled={disabled}
          className="w-12 h-14 text-center text-2xl font-semibold border-2 border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-crimson text-midnight-navy disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
      ))}
    </div>
  );
}

