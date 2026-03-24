'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxSkills?: number;
  className?: string;
  error?: string;
}

export function SkillsInput({
  value,
  onChange,
  placeholder = 'Type a skill and press Enter',
  maxSkills = 30,
  className,
  error,
}: SkillsInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= maxSkills) return;
    onChange([...value, trimmed]);
    setInputValue('');
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(value.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeSkill(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          'flex min-h-[42px] flex-wrap gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500',
          error && 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500',
          className,
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
          >
            {skill}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeSkill(skill);
              }}
              className="rounded-full text-blue-500 hover:text-blue-700 focus:outline-none"
              aria-label={`Remove ${skill}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addSkill(inputValue)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          disabled={value.length >= maxSkills}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-gray-400">
        {value.length}/{maxSkills} skills · Press Enter or comma to add
      </p>
    </div>
  );
}
