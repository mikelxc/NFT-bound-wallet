"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Button from "@/components/button"
import NbaCard from "@/components/nba-card"
import { ArrowLeft, ArrowRight, CheckCircle, Loader, Sparkles } from "lucide-react"

const MOCK_CONFIG = {
  factoryAddress: "0x1234567890123456789012345678901234567890",
  validatorAddress: "0x2345678901234567890123456789012345678901",
  bundlerUrl: "https://api.pimlico.io/v2/bundler",
  chainId: 8453, // Base
}

const steps = [
  { id: 1, name: "Introduction" },
  { id: 2, name: "Preview" },
  { id: 3, name: "Minting" },
  { id: 4, name: "Success" },
]

const pageVariants = {
  initial: { opacity: 0, x: 50 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -50 },
}

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5,
}

export default function MintPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isMinting, setIsMinting] = useState(false)
  // TODO: Store actual minted token ID and address
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null)
  const [deterministicAddress, setDeterministicAddress] = useState<string>("0xPREDICTED_ADDRESS...")

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const handleMint = async () => {
    setIsMinting(true)
    // TODO: Implement actual minting logic with Viem and Reown AppKit
    // 1. Connect wallet if not connected
    // 2. Call factory contract to mint NFT and deploy smart account
    // 3. Handle transaction states (pending, success, error)
    console.log("Attempting to mint with config:", MOCK_CONFIG)

    // Simulate minting process
    await new Promise((resolve) => setTimeout(resolve, 3000)) // Simulate network delay

    // Simulate success
    const newMintedId = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    setMintedTokenId(newMintedId)
    console.log("Minting successful, token ID:", newMintedId)
    setIsMinting(false)
    nextStep() // Move to success step
  }

  // TODO: Calculate deterministic address based on user's wallet / chosen params
  // This is a placeholder.
  React.useEffect(
    () => {
      // setDeterministicAddress(calculateDeterministicAddress());
    },
    [
      /* user wallet, other params */
    ],
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Introduction
        return (
          <motion.div
            key="step1"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="text-center max-w-2xl mx-auto"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white/90">Welcome to NFT-Bound Accounts</h1>
            {/* TODO: Implement Animated Technical Explanation */}
            <div className="w-full h-64 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 my-8">
              <p className="text-white/50">Animated Technical Explanation Placeholder</p>
            </div>
            <ul className="space-y-3 text-left text-white/70 mb-8 list-disc list-inside marker:text-[var(--gradient-start)]">
              <li>Each NFT you mint controls a unique, fully-functional smart wallet.</li>
              <li>Transferring the NFT means transferring the entire wallet and its contents.</li>
              <li>Powered by ERC-7579 (Modular Smart Accounts) and ERC-721 (NFTs).</li>
              <li>Trade your smart wallet on any standard NFT marketplace.</li>
            </ul>
            <Button onClick={nextStep} className="w-full sm:w-auto">
              Begin Minting <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )
      case 2: // Preview
        return (
          <motion.div
            key="step2"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="text-center max-w-2xl mx-auto"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white/90">Your Account Preview</h1>
            <div className="flex justify-center my-8">
              {/* TODO: Make this NBA card dynamic based on potential mint */}
              <NbaCard />
            </div>
            <div className="glass-panel p-6 rounded-xl space-y-3 text-sm text-white/80 mb-8">
              <p>Minting Fee: {/* TODO: Fetch actual fee */}0.01 ETH (example)</p>
              <p>Estimated Gas: {/* TODO: Estimate gas */}~0.002 ETH (example)</p>
              <p>
                Deterministic Wallet Address: <span className="font-mono">{deterministicAddress}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" onClick={prevStep} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleMint} disabled={isMinting} className="w-full sm:w-auto">
                {isMinting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" /> Minting...
                  </>
                ) : (
                  <>
                    Mint Account NFT <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )
      case 3: // Minting Animation (This step is now part of handleMint and transitions to success)
        // This case is effectively skipped by the logic in handleMint,
        // which sets isMinting and then calls nextStep upon completion.
        // A dedicated "Minting in Progress" screen could be here if desired.
        // For now, the button shows "Minting..." and then moves to Success.
        // This is a placeholder if a more elaborate full-screen animation is needed.
        return (
          <motion.div
            key="step3"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="text-center max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white/90">Minting Your NFT Smart Account...</h1>
            <Loader className="w-16 h-16 text-[var(--gradient-start)] animate-spin mb-4" />
            <p className="text-white/70">
              Please wait while we deploy your smart account and mint your NFT. This may take a few moments.
            </p>
            {/* TODO: Implement epic minting animation (5 seconds, cinematic) */}
            {/* - Particles coalesce into card */}
            {/* - Gradient pulses with blockchain confirmation */}
            {/* - Card flips to reveal wallet address */}
            {/* - Celebration with subtle particle burst */}
            <div className="w-full h-64 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 my-8">
              <p className="text-white/50">Cinematic Minting Animation Placeholder</p>
            </div>
          </motion.div>
        )
      case 4: // Success
        return (
          <motion.div
            key="step4"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="text-center max-w-2xl mx-auto"
          >
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white/90">Minting Successful!</h1>
            <p className="text-white/70 mb-8">
              Congratulations! Your NFT-Bound Smart Account{" "}
              <span className="font-bold text-white/90">NBA #{mintedTokenId || "XXXX"}</span> has been minted.
            </p>
            <div className="my-8">
              <NbaCard /> {/* TODO: Update this card with actual minted data */}
            </div>
            <div className="glass-panel p-6 rounded-xl space-y-3 text-sm text-white/80 mb-8">
              <p>
                Token ID: <span className="font-mono text-white/90">{mintedTokenId || "N/A"}</span>
              </p>
              <p>
                Wallet Address: <span className="font-mono text-white/90">{deterministicAddress}</span>
              </p>
              {/* TODO: Add link to view on explorer */}
              <p>
                <a href="#" className="text-[var(--gradient-start)] hover:underline">
                  View on Explorer (placeholder)
                </a>
              </p>
            </div>
            <Button
              onClick={() => {
                // TODO: Navigate to account page: router.push(`/account/${mintedTokenId}`)
                alert(`Navigate to /account/${mintedTokenId || "your_new_token_id"}`)
              }}
              className="w-full sm:w-auto"
            >
              View Your Account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-24 md:pt-32 relative overflow-hidden">
      {/* Progress Indicator */}
      <div className="mb-12 w-full max-w-md">
        <div className="flex justify-between mb-1">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={`text-xs font-medium ${currentStep >= step.id ? "text-white/90" : "text-white/40"}`}
            >
              {step.name}
            </span>
          ))}
        </div>
        <div className="w-full bg-white/10 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
    </div>
  )
}
