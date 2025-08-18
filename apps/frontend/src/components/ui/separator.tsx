import * as React from "react";

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const Separator = React.forwardRef<
  HTMLDivElement,
  SeparatorProps
>(({ className = "", orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    className={`${
      orientation === "horizontal" 
        ? "h-[1px] w-full" 
        : "h-full w-[1px]"
    } bg-border ${className}`}
    {...props}
  />
));

Separator.displayName = "Separator";

export { Separator };