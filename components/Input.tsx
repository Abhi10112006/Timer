import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  className = '', 
  onFocus, 
  onTouchStart, 
  name, 
  id, 
  autoComplete,
  ...props 
}) => {
  // Random ID/Name generation to force browser to see this as a "new" field every time
  const [randomId] = useState(() => `field_${Math.random().toString(36).slice(2, 9)}`);
  
  // "ReadOnly Hack": Initialize as readOnly. This prevents the browser from showing 
  // autofill popups/keyboards bars on page load. We disable readOnly immediately 
  // upon interaction.
  const [isReadOnly, setIsReadOnly] = useState(true);

  const handleInteraction = () => {
    if (isReadOnly) setIsReadOnly(false);
  };

  const finalName = name || randomId;
  const finalId = id || randomId;

  // Use 'search' type by default for text inputs to avoid address/contact autofill heuristics
  // unless explicitly overridden (e.g. number)
  const type = props.type || 'search';
  
  // Determine inputMode
  const defaultInputMode = type === 'number' ? 'decimal' : 'text';
  const finalInputMode = props.inputMode || defaultInputMode;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label htmlFor={finalId} className="text-xs font-medium text-zinc-500 dark:text-zinc-400 ml-1">{label}</label>}
      <div className="relative">
        <input
          id={finalId}
          name={finalName}
          type={type}
          // "new-password" or random string sometimes works better than "off" for Chrome
          autoComplete={autoComplete || `off-${randomId}`}
          list="autocompleteOff" // Point to non-existent list to kill suggestions
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode={finalInputMode}
          role="presentation"
          aria-autocomplete="none"
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          readOnly={isReadOnly}
          onFocus={(e) => {
            handleInteraction();
            onFocus?.(e);
          }}
          onTouchStart={(e) => {
            handleInteraction();
            onTouchStart?.(e);
          }}
          className={`w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all select-text appearance-none ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;