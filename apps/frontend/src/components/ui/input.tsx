import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
        onChange={(e) => {
          // Validar max se for input do tipo number
          if (type === 'number' && props.max !== undefined) {
            const value = parseFloat(e.target.value);
            if (value > parseFloat(props.max.toString())) {
              e.target.value = props.max.toString();
            }
          }
          
          // Chamar onChange original se existir
          if (props.onChange) {
            props.onChange(e);
          }
        }}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };