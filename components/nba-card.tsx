"use client"

import type React from "react"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { Gem, ArrowRightLeft, Wallet } from "lucide-react"

export default function NbaCard() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useTransform(mouseY, [-200, 200], [-10, 10])
  const rotateY = useTransform(mouseX, [-200, 200], [10, -10])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    mouseX.set(event.clientX - rect.left - rect.width / 2)
    mouseY.set(event.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-[350px] h-[220px] rounded-3xl p-1 relative transition-all duration-300 ease-out"
    >
      <div className="absolute inset-0 rounded-3xl card-gradient-border" style={{ transform: "translateZ(-1px)" }} />
      <div className="w-full h-full rounded-[22px] card-gradient-bg flex items-center justify-center">
        <div className="w-[95%] h-[90%] rounded-2xl glass-panel p-4 flex flex-col justify-between text-white">
          <div className="flex justify-between items-start">
            <div className="font-mono text-sm text-white/80">NBA #0001</div>
            <div className="font-mono text-xs text-white/50 bg-black/20 px-2 py-1 rounded-md">0x1234...5678</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-white/70" />
              <span className="font-mono text-lg">2.45 ETH</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                <span className="font-mono">142 txns</span>
              </div>
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4" />
                <span className="font-mono">5 NFTs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
