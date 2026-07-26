import React from "react";
import { cn } from "../../utils";

interface PopCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "pink" | "cyan" | "yellow" | "stripes";
  skew?: boolean;
}

export const PopCard = React.memo(React.forwardRef<HTMLDivElement, PopCardProps>(
  ({ className, variant = "default", skew = false, children, ...props }, ref) => {
    
    const baseStyles = "pop-border bg-white p-4 shadow-pop";
    
    const variants = {
      default: "",
      pink: "bg-pop-pink text-white",
      cyan: "bg-pop-cyan text-pop-black",
      yellow: "bg-pop-yellow text-pop-black",
      stripes: "bg-stripes text-white text-stroke-sm"
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          skew && "-skew-x-2 transform origin-bottom-left",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
));

PopCard.displayName = "PopCard";
