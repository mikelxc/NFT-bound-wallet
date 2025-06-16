"use client"

import { cn } from "@/lib/utils"

interface LoaderProps {
  className?: string
}

const Loader = ({ className }: LoaderProps) => {
  return (
    <div className={cn("lds-ring", className)}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
}

export default Loader
