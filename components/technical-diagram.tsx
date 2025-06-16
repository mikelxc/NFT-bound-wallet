"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Zap, ChevronsRight } from "lucide-react"

interface TechnicalDiagramProps {
  autoPlay?: boolean
  showControls?: boolean
}

const componentVariants = {
  initial: { opacity: 0, scale: 0.8 },
  inactive: (isActive: boolean) => ({
    opacity: isActive ? 1 : 0.4,
    scale: isActive ? 1.05 : 0.95,
    filter: isActive ? "drop-shadow(0 0 8px rgba(255,255,255,0.7))" : "none",
    transition: { type: "spring", stiffness: 200, damping: 15 },
  }),
  active: {
    opacity: 1,
    scale: 1.05,
    filter: "drop-shadow(0 0 8px rgba(255,255,255,0.7))",
    transition: { type: "spring", stiffness: 200, damping: 15 },
  },
}

const lineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delay = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 0.8, ease: "easeInOut", delay }, opacity: { duration: 0.1, delay } },
  }),
}

const textIndicatorVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 20, delay },
  }),
}

export default function TechnicalDiagram({ autoPlay = true, showControls = true }: TechnicalDiagramProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  const steps = [
    {
      id: "mint",
      title: "1. Mint NFT & Deploy Wallet",
      description: "Factory deploys a deterministic smart account and mints the corresponding NFT.",
      activeComponents: ["factory", "nft", "wallet"],
      annotation: "Factory.mintWallet() → Deploys SA & Mints NFT #0001",
    },
    {
      id: "bind",
      title: "2. Bind NFT to Validator",
      description: "The NFT Validator module links the smart account's control to the specific NFT.",
      activeComponents: ["nft", "wallet", "validator"],
      annotation: "Validator.onInstall(TokenID) → Links SA to NFT",
    },
    {
      id: "ownership",
      title: "3. NFT Controls Wallet",
      description:
        "Owner A, holding the NFT, signs a transaction. The Validator verifies NFT ownership to authorize the action on the smart account.",
      activeComponents: ["owner", "nft", "validator", "wallet"],
      annotation: "Owner A signs TX → Validator verifies → Executes on SA",
    },
    {
      id: "transfer",
      title: "4. Transfer = New Owner",
      description:
        "Owner A transfers the NFT to Owner B. Owner B now has full control over the smart account and its assets.",
      activeComponents: ["owner", "newowner", "nft", "wallet"],
      annotation: "NFT.transfer(A → B) → Owner B gains SA control",
    },
  ]

  useEffect(() => {
    if (!isPlaying || !autoPlay) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 4500) // Slightly longer for complex animations

    return () => clearInterval(interval)
  }, [isPlaying, autoPlay, steps.length])

  const handleStepClick = (index: number) => {
    setCurrentStep(index)
    setIsPlaying(false)
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const isActiveComponent = (componentName: string) => steps[currentStep].activeComponents.includes(componentName)

  return (
    <div className="w-full max-w-4xl mx-auto">
      {showControls && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 flex-wrap">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ease-in-out transform hover:scale-105 ${
                  currentStep === index
                    ? "bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white shadow-lg"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                Step {index + 1}
              </button>
            ))}
          </div>
          <button
            onClick={togglePlay}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white/80 text-xs font-medium transition-colors transform hover:scale-105 flex items-center gap-1"
          >
            {isPlaying ? "Pause" : "Play"}{" "}
            {isPlaying ? <Zap className="w-3 h-3" /> : <ChevronsRight className="w-3 h-3" />}
          </button>
        </div>
      )}

      <div className="relative aspect-[2/1] bg-black/20 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <svg width="100%" height="100%" viewBox="0 0 800 400" className="absolute inset-0">
          <defs>
            <linearGradient id="factoryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
            <linearGradient id="nftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f093fb" />
              <stop offset="100%" stopColor="#f5576c" />
            </linearGradient>
            <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4facfe" />
              <stop offset="100%" stopColor="#00f2fe" />
            </linearGradient>
            <linearGradient id="validatorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#43e97b" />
              <stop offset="100%" stopColor="#38f9d7" />
            </linearGradient>

            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 8 3, 0 6" fill="currentColor" />
            </marker>
          </defs>

          {/* Components */}
          {[
            {
              id: "factory",
              x: 110,
              y: 90,
              w: 120,
              h: 80,
              grad: "url(#factoryGrad)",
              title: "NFT Factory",
              desc: "Deploys Wallets",
            },
            { id: "nft", x: 300, y: 90, w: 100, h: 80, grad: "url(#nftGrad)", title: "NBA NFT", desc: "Token #0001" },
            {
              id: "wallet",
              x: 510,
              y: 90,
              w: 120,
              h: 80,
              grad: "url(#walletGrad)",
              title: "Smart Account",
              desc: "Kernel v3.3",
            },
            {
              id: "validator",
              x: 310,
              y: 250,
              w: 120,
              h: 80,
              grad: "url(#validatorGrad)",
              title: "NFT Validator",
              desc: "Access Control",
            },
            { id: "owner", x: 110, y: 330, r: 30, title: "Owner A", desc: "0x1234..." },
            { id: "newowner", x: 650, y: 330, r: 30, title: "Owner B", desc: "0x5678..." },
          ].map((comp) => (
            <motion.g
              key={comp.id}
              variants={componentVariants}
              initial="initial"
              animate={isActiveComponent(comp.id) ? "active" : "inactive"}
            >
              {comp.r ? (
                <>
                  <circle
                    cx={comp.x}
                    cy={comp.y}
                    r={comp.r}
                    fill="rgba(255,255,255,0.1)"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <text x={comp.x} y={comp.y - 5} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                    {comp.title}
                  </text>
                  <text x={comp.x} y={comp.y + 10} textAnchor="middle" fill="white" fontSize="8" opacity="0.7">
                    {comp.desc}
                  </text>
                </>
              ) : (
                <>
                  <rect
                    x={comp.x - comp.w! / 2}
                    y={comp.y - comp.h! / 2}
                    width={comp.w}
                    height={comp.h}
                    rx="10"
                    fill={comp.grad}
                  />
                  <text x={comp.x} y={comp.y - 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                    {comp.title}
                  </text>
                  <text x={comp.x} y={comp.y + 10} textAnchor="middle" fill="white" fontSize="10" opacity="0.7">
                    {comp.desc}
                  </text>
                </>
              )}
            </motion.g>
          ))}

          {/* Animated Connections */}
          <AnimatePresence>
            {/* Step 0: Mint */}
            {currentStep === 0 && (
              <>
                <motion.line
                  x1="170"
                  y1="90"
                  x2="240"
                  y2="90"
                  stroke="white"
                  strokeWidth="2.5"
                  markerEnd="url(#arrowhead)"
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.2}
                />
                <motion.line
                  x1="170"
                  y1="105"
                  x2="440"
                  y2="105"
                  stroke="white"
                  strokeWidth="2.5"
                  markerEnd="url(#arrowhead)"
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.5}
                />
              </>
            )}
            {/* Step 1: Bind */}
            {currentStep === 1 && (
              <>
                <motion.line
                  x1="300"
                  y1="130"
                  x2="310"
                  y2="200"
                  stroke="#43e97b"
                  strokeWidth="2.5"
                  markerEnd="url(#arrowhead)"
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.2}
                />
                <motion.line
                  x1="370"
                  y1="240"
                  x2="440"
                  y2="130"
                  stroke="#43e97b"
                  strokeWidth="2.5"
                  markerEnd="url(#arrowhead)"
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.5}
                />
              </>
            )}
            {/* Step 2: Ownership & TX */}
            {currentStep === 2 && (
              <>
                <motion.path
                  d="M110 290 Q150 200 250 130"
                  stroke="#f093fb"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.2}
                />
                <motion.path
                  d="M350 130 Q400 200 450 130"
                  stroke="#f093fb"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.5}
                />
                <motion.g variants={textIndicatorVariants} initial="hidden" animate="visible" custom={1.0}>
                  <rect x="375" y="155" width="50" height="30" rx="5" fill="#f093fb" opacity="0.8" />
                  <text x="400" y="175" textAnchor="middle" fill="black" fontSize="12" fontWeight="bold">
                    TX
                  </text>
                </motion.g>
              </>
            )}
            {/* Step 3: Transfer */}
            {currentStep === 3 && (
              <>
                <motion.path
                  d="M110 290 Q380 250 650 290"
                  stroke="#f5576c"
                  strokeWidth="3"
                  strokeDasharray="5 3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0.2}
                />
                <motion.path
                  d="M650 290 Q550 200 350 130"
                  stroke="#f5576c"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                  custom={1.2}
                />
                <motion.g variants={textIndicatorVariants} initial="hidden" animate="visible" custom={0.8}>
                  <rect x="340" y="285" width="120" height="30" rx="5" fill="#f5576c" opacity="0.8" />
                  <text x="400" y="305" textAnchor="middle" fill="black" fontSize="10" fontWeight="bold">
                    NFT TRANSFER
                  </text>
                </motion.g>
              </>
            )}
          </AnimatePresence>

          {/* SVG Annotation Text */}
          <AnimatePresence mode="wait">
            <motion.text
              key={`annotation-${currentStep}`}
              x="400"
              y="385"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }}
              exit={{ opacity: 0, y: -5, transition: { duration: 0.2, ease: "easeIn" } }}
            >
              {steps[currentStep].annotation}
            </motion.text>
          </AnimatePresence>
        </svg>
      </div>

      <motion.div
        key={`desc-${currentStep}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.4 } }}
        className="mt-6 text-center px-4"
      >
        <h3 className="text-xl font-semibold text-white/90 mb-1">{steps[currentStep].title}</h3>
        <p className="text-sm text-white/70 max-w-xl mx-auto">{steps[currentStep].description}</p>
      </motion.div>
    </div>
  )
}
