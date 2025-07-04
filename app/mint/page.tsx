"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Button from "@/components/button"
import NbaCard from "@/components/nba-card"
import { ArrowLeft, ArrowRight, CheckCircle, Loader, Sparkles, Wallet } from "lucide-react"
import TechnicalDiagram from "@/components/technical-diagram"
import { useConnectWallet, useWallet, useNBAClient } from "@/lib/wallet/hooks"
import { useNBAStore } from "@/stores/nba-store"
import { formatEther } from "viem"
import { useRouter } from "next/navigation"
import { getExplorerTxUrl } from "@/lib/utils"

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
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.5,
}

export default function MintPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [deterministicAddress, setDeterministicAddress] = useState<string>("")
  const [nextTokenId, setNextTokenId] = useState<bigint>(0n)
  const [mintingFee, setMintingFee] = useState<bigint>(0n)
  const [error, setError] = useState<string>("")

  // Wallet hooks
  const { connect, isConnected } = useConnectWallet()
  const { address, walletClient, chain } = useWallet()
  const nbaClient = useNBAClient()
  
  // Store hooks
  const { 
    isMinting, 
    mintResult, 
    mintingStatus, 
    transactionHash, 
    setMinting, 
    setMintResult, 
    setMintingStatus, 
    setTransactionHash, 
    setError: setStoreError 
  } = useNBAStore()

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  // Fetch minting fee and deterministic address
  useEffect(() => {
    const fetchData = async () => {
      if (!nbaClient) return

      try {
        // Get minting fee
        const fee = await nbaClient.getMintingFee()
        setMintingFee(fee)

        // If connected, compute next wallet address
        if (address) {
          // Get the next token ID by checking total supply
          try {
            // Use getContract to read total supply from the factory
            const { getContract } = await import('viem')
            const { CONTRACT_ADDRESSES } = await import('@/lib/nba-sdk/constants')
            const { createPublicClient, http } = await import('viem')
            
            const chainId = chain?.id || 1315
            const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
            
            if (addresses?.nftWalletFactory) {
              const publicClient = createPublicClient({
                chain: chain || undefined,
                transport: http()
              })
              
              const factory = getContract({
                address: addresses.nftWalletFactory,
                abi: [
                  {
                    inputs: [],
                    name: 'totalSupply',
                    outputs: [{ type: 'uint256' }],
                    stateMutability: 'view',
                    type: 'function',
                  }
                ],
                client: publicClient
              })
              
              const totalSupply = await factory.read.totalSupply()
              const nextTokenId = totalSupply // Next token ID is usually totalSupply
              setNextTokenId(nextTokenId)
              
              const walletAddress = await nbaClient.computeWalletAddress(nextTokenId)
              setDeterministicAddress(walletAddress)
            }
          } catch (err) {
            console.warn("Could not fetch next token ID, using fallback:", err)
            // Fallback to a default computation
            const fallbackTokenId = 0n
            setNextTokenId(fallbackTokenId)
            const walletAddress = await nbaClient.computeWalletAddress(fallbackTokenId)
            setDeterministicAddress(walletAddress)
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      }
    }

    fetchData()
  }, [nbaClient, address])

  const handleMint = async () => {
    if (!isConnected || !walletClient || !address || !nbaClient) {
      setError("Please connect your wallet first")
      return
    }

    setMinting(true)
    setError("")
    setMintingStatus("Initializing transaction...")
    setTransactionHash(null)
    nextStep() // Move to minting animation step

    try {
      setMintingStatus("Submitting transaction...")
      
      // Mint NFT-bound account with status updates
      const result = await nbaClient.mintAccount(
        address, 
        walletClient,
        (status: string, hash?: string) => {
          setMintingStatus(status)
          if (hash) {
            setTransactionHash(hash)
          }
        }
      )
      
      console.log("Minting successful:", result)
      setMintResult(result)
      setMinting(false) // Reset minting state after success
      setMintingStatus("Minting completed successfully!")
      nextStep() // Move to success step
    } catch (err: any) {
      console.error("Minting failed:", err)
      setError(err.message || "Failed to mint NFT-bound account")
      setMinting(false)
      setMintingStatus("")
      setTransactionHash(null)
      // Go back to preview step on error
      setCurrentStep(2)
    }
  }

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
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white/90">Welcome to NFT-Bound Accounts</h1>

            {/* Technical Diagram */}
            <div className="my-8">
              <TechnicalDiagram autoPlay={true} showControls={true} />
            </div>

            <ul className="space-y-3 text-left text-white/70 mb-8 list-disc list-inside marker:text-[var(--gradient-start)] max-w-2xl mx-auto">
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
            
            {!isConnected ? (
              <div className="glass-panel p-8 rounded-xl mb-8">
                <Wallet className="w-12 h-12 text-white/60 mx-auto mb-4" />
                <p className="text-white/70 mb-4">Connect your wallet to continue</p>
                <Button onClick={connect}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-center my-8">
                  <NbaCard 
                    tokenId={nextTokenId.toString()}
                    walletAddress={deterministicAddress}
                    ethBalance="0.00"
                    transactionCount={0}
                    nftCount={0}
                    isActive={false}
                    useContractSVG={true}
                  />
                </div>
                <div className="glass-panel p-6 rounded-xl space-y-3 text-sm text-white/80 mb-8">
                  <p>Minting Fee: {formatEther(mintingFee)} ETH</p>
                  <p>Network: Story Aeneid (Chain ID: 1315)</p>
                  {deterministicAddress && (
                    <p>
                      Your Wallet Address: <span className="font-mono">{deterministicAddress}</span>
                    </p>
                  )}
                </div>
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                
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
              </>
            )}
          </motion.div>
        )
      case 3: // Minting Animation
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
            
            {/* Status Updates */}
            <div className="space-y-3 w-full max-w-md">
              <p className="text-white/70">
                {mintingStatus || "Please wait while we deploy your smart account and mint your NFT."}
              </p>
              
              {transactionHash && (
                <div className="glass-panel p-4 rounded-lg space-y-2">
                  <p className="text-sm text-white/60">Transaction Hash:</p>
                  <p className="font-mono text-xs text-white/80 break-all">{transactionHash}</p>
                  {getExplorerTxUrl(chain, transactionHash) && (
                    <a 
                      href={getExplorerTxUrl(chain, transactionHash)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--gradient-start)] hover:underline text-sm"
                    >
                      View on Explorer
                    </a>
                  )}
                </div>
              )}
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
              <span className="font-bold text-white/90">NBA #{mintResult?.tokenId.toString() || "XXXX"}</span> has been minted.
            </p>
            <div className="flex justify-center my-8">
              <NbaCard 
                tokenId={mintResult?.tokenId.toString() || nextTokenId.toString()}
                walletAddress={mintResult?.walletAddress || deterministicAddress}
                ethBalance="0.00"
                transactionCount={0}
                nftCount={0}
                isActive={true}
                useContractSVG={true}
              />
            </div>
            <div className="glass-panel p-6 rounded-xl space-y-3 text-sm text-white/80 mb-8">
              <p>
                Token ID: <span className="font-mono text-white/90">{mintResult?.tokenId.toString() || "N/A"}</span>
              </p>
              <p>
                Wallet Address: <span className="font-mono text-white/90">{mintResult?.walletAddress || deterministicAddress}</span>
              </p>
              {mintResult?.transactionHash && getExplorerTxUrl(chain, mintResult.transactionHash) && (
                <p>
                  <a 
                    href={getExplorerTxUrl(chain, mintResult.transactionHash)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--gradient-start)] hover:underline"
                  >
                    View on Explorer
                  </a>
                </p>
              )}
            </div>
            <Button
              onClick={() => {
                router.push(`/account/${mintResult?.tokenId.toString() || "0"}`)
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
          {steps.map((step) => (
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