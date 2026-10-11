import * as React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', type = 'checkbox', ...props }, ref) => {
    return (
      <input
        type={type}
        className={`
          h-4 w-4 rounded border border-border bg-surface
          text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2
          focus:outline-none disabled:cursor-not-allowed disabled:opacity-50
          cursor-pointer accent-primary
          ${className}
        `}
        ref={ref}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
