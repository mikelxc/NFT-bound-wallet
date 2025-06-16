"use client"

import React from "react"

import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

type ButtonVariant = "primary" | "secondary"

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode
  variant?: ButtonVariant
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = "primary", ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    const sizeClasses = "px-8 py-3 text-base"

    const variantClasses = {
      primary: "primary-cta",
      secondary: "secondary-cta",
    }

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(baseClasses, sizeClasses, variantClasses[variant], className)}
        ref={ref}
        {...props}
      >
        {children}
      </motion.button>
    )
  },
)
Button.displayName = "Button"

export default Button
