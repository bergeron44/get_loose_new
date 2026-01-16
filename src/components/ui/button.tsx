import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-game-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 touch-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon-purple hover:shadow-glow",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-2 border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:border-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-neon-orange",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Custom neon variants
        neonPurple: "bg-gradient-to-r from-neon-purple to-neon-pink text-foreground shadow-neon-purple hover:shadow-glow pulse-glow",
        neonOrange: "bg-gradient-to-r from-neon-orange to-neon-pink text-foreground shadow-neon-orange hover:brightness-110",
        neonLime: "bg-gradient-to-r from-neon-lime to-neon-cyan text-accent-foreground shadow-neon-lime hover:brightness-110",
        glass: "glass-card border-primary/30 text-foreground hover:bg-muted/50 hover:border-primary/50",
        hero: "bg-gradient-to-r from-neon-purple via-neon-pink to-neon-orange text-foreground font-bold shadow-glow hover:brightness-110 transition-all duration-300",
        intensity: "glass-card border-2 text-foreground transition-all duration-300",
      },
      size: {
        default: "min-h-[52px] px-6 py-3",
        sm: "min-h-[44px] rounded-xl px-4 text-game-sm",
        lg: "min-h-[56px] rounded-2xl px-8 text-game-lg",
        xl: "min-h-[64px] rounded-3xl px-10 text-game-xl",
        icon: "min-h-[52px] w-[52px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

// Spring animated button for tactile feel
interface SpringButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
}

const SpringButton = React.forwardRef<HTMLButtonElement, SpringButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 17,
          mass: 0.8
        }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
SpringButton.displayName = "SpringButton";

export { Button, SpringButton, buttonVariants };
