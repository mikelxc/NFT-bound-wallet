"use client"

import type React from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { Gem, ArrowRightLeft, Wallet, Shield, Zap } from "lucide-react"
import { generateNFTSVG, type WalletData } from "./svg-generator"

interface NbaCardProps {
  tokenId?: string
  walletAddress?: string
  ethBalance?: string
  transactionCount?: number
  nftCount?: number
  isActive?: boolean
  variant?: "default" | "compact" | "detailed"
  useContractSVG?: boolean // New prop to use contract-compatible SVG
}

export default function NbaCard({
  tokenId = "0001",
  walletAddress = "0x1234...5678",
  ethBalance = "2.45",
  transactionCount = 142,
  nftCount = 5,
  isActive = true,
  variant = "default",
  useContractSVG = false,
}: NbaCardProps) {
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

  // Generate dynamic gradient based on token ID
  const generateGradient = (id: string) => {
    const hash = Number.parseInt(id, 16) || Number.parseInt(id) || 1
    const hue1 = (hash * 137.508) % 360
    const hue2 = (hue1 + 60) % 360
    return {
      start: `hsl(${hue1}, 70%, 60%)`,
      end: `hsl(${hue2}, 70%, 50%)`,
    }
  }

  const gradient = generateGradient(tokenId)

  // If using contract SVG, render the contract-compatible version with spinning background
  if (useContractSVG) {
    const walletData: WalletData = {
      tokenId,
      walletAddress,
      balance: ethBalance,
      transactionCount,
      nftCount,
      isActive,
    }

    const contractSVG = generateNFTSVG(walletData, {
      width: 400,
      height: 400,
      animations: true,
    })

    return (
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-[400px] h-[400px] rounded-3xl p-1 relative transition-all duration-300 ease-out"
      >
        {/* Spinning Background NFT */}
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-30"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          style={{
            background: `linear-gradient(120deg, ${gradient.start}, ${gradient.end})`,
            transform: "translateZ(-2px) scale(1.1)",
          }}
        />

        {/* Spinning Gradient Border */}
        <div
          className="absolute inset-0 rounded-3xl card-gradient-border"
          style={{
            background: `linear-gradient(120deg, ${gradient.start}, ${gradient.end})`,
            transform: "translateZ(-1px)",
          }}
        />

        {/* Main Contract SVG */}
        <div
          className="w-full h-full rounded-3xl overflow-hidden relative z-10"
          dangerouslySetInnerHTML={{ __html: contractSVG }}
        />
      </motion.div>
    )
  }

  // Original card implementation with spinning background
  const cardSize = variant === "compact" ? { width: 280, height: 180 } : { width: 350, height: 220 }

  // Generate on-chain SVG metadata for background
  const generateSVGMetadata = () => {
    return `
      <svg width="${cardSize.width}" height="${cardSize.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cardGrad${tokenId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
          </linearGradient>
          <filter id="glow${tokenId}">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <pattern id="grid${tokenId}" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#cardGrad${tokenId})" rx="20" ry="20"/>
        <rect width="100%" height="100%" fill="url(#grid${tokenId})" rx="20" ry="20" opacity="0.3"/>
        
        <!-- Status Indicator -->
        <circle cx="30" cy="30" r="4" fill="${isActive ? "#10B981" : "#6B7280"}" filter="url(#glow${tokenId})"/>
        
        <!-- Token ID -->
        <text x="50" y="35" fill="white" fontFamily="monospace" fontSize="14" fontWeight="bold">
          NBA #${tokenId}
        </text>
        
        <!-- Wallet Address -->
        <text x="${cardSize.width - 20}" y="35" fill="rgba(255,255,255,0.7)" fontFamily="monospace" fontSize="10" textAnchor="end">
          ${walletAddress}
        </text>
        
        <!-- Balance Display -->
        <text x="30" y="${cardSize.height - 50}" fill="white" fontFamily="monospace" fontSize="18" fontWeight="bold">
          ${ethBalance} ETH
        </text>
        
        <!-- Stats -->
        <text x="30" y="${cardSize.height - 25}" fill="rgba(255,255,255,0.8)" fontFamily="monospace" fontSize="12">
          ${transactionCount} txns • ${nftCount} NFTs
        </text>
        
        <!-- ERC-7579 Badge -->
        <rect x="${cardSize.width - 80}" y="${cardSize.height - 40}" width="60" height="20" rx="10" 
              fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)"/>
        <text x="${cardSize.width - 50}" y="${cardSize.height - 27}" fill="white" fontFamily="monospace" 
              fontSize="8" textAnchor="middle">Kernel v3.3</text>
      </svg>
    `
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
      className={`${variant === "compact" ? "w-[280px] h-[180px]" : "w-[350px] h-[220px]"} rounded-3xl p-1 relative transition-all duration-300 ease-out`}
    >
      {/* Spinning Background NFT */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        style={{ transform: "translateZ(-2px) scale(1.1)" }}
        dangerouslySetInnerHTML={{ __html: generateSVGMetadata() }}
      />

      {/* Spinning Gradient Border */}
      <div
        className="absolute inset-0 rounded-3xl card-gradient-border"
        style={{
          background: `linear-gradient(120deg, ${gradient.start}, ${gradient.end})`,
          transform: "translateZ(-1px)",
        }}
      />

      {/* Main Card Content */}
      <div className="w-full h-full rounded-[22px] bg-black/20 backdrop-blur-sm flex items-center justify-center border border-white/20 relative z-10">
        <div className="w-[95%] h-[90%] rounded-2xl glass-panel p-4 flex flex-col justify-between text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-500"} animate-pulse`} />
              <div className="font-mono text-sm text-white/80">NBA #{tokenId}</div>
            </div>
            <div className="font-mono text-xs text-white/50 bg-black/20 px-2 py-1 rounded-md">{walletAddress}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-white/70" />
              <span className="font-mono text-lg">{ethBalance} ETH</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                <span className="font-mono">{transactionCount} txns</span>
              </div>
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4" />
                <span className="font-mono">{nftCount} NFTs</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Shield className="w-3 h-3" />
                <span>Kernel v3.3</span>
              </div>
              {isActive && (
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <Zap className="w-3 h-3" />
                  <span>Active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
