import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mention?: string;
  className?: string;
  onSubmit?: () => void;
}

export const MentionInput = ({
  value,
  onChange,
  placeholder,
  mention,
  className,
  onSubmit,
}: MentionInputProps) => {
  const [displayValue, setDisplayValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mention) {
      // Remove mention from display but keep in actual value
      setDisplayValue(value.replace(mention, '').trim());
    } else {
      setDisplayValue(value);
    }
  }, [value, mention]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Always prepend mention if it exists
    const fullValue = mention ? `${mention} ${newValue}` : newValue;
    onChange(fullValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative">
      {mention && (
        <div className="absolute left-3 top-3 pointer-events-none z-10 flex items-center gap-1">
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm font-medium">
            {mention}
          </span>
        </div>
      )}
      <Textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${mention ? 'pl-20' : ''} ${className}`}
        style={mention ? { paddingLeft: `${mention.length * 8 + 24}px` } : {}}
      />
    </div>
  );
};

