"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Button from "@/components/button"
import { Wallet, ExternalLink, Copy, Check, Loader } from "lucide-react"
import { generateNFTSVG, type WalletData } from "@/components/svg-generator"
import { useConnectWallet, useWallet, useNBAClient } from "@/lib/wallet/hooks"
import { useNBAStore } from "@/stores/nba-store"
import { type NFTBoundAccount } from "@/lib/nba-sdk"
import { useRouter } from "next/navigation"

export default function WalletPage() {
  const router = useRouter()
  const [copiedAddress, setCopiedAddress] = useState<string>("")
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  // Wallet hooks
  const { connect, isConnected } = useConnectWallet()
  const { address } = useWallet()
  const nbaClient = useNBAClient()

  // Store hooks
  const { nftAccounts, setAccounts, setError } = useNBAStore()

  // Fetch owned NFTs when connected
  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      if (!isConnected || !address || !nbaClient) return

      setLoadingAccounts(true)
      try {
        const accounts = await nbaClient.getOwnedAccounts(address)
        setAccounts(accounts)
      } catch (err: any) {
        console.error("Failed to fetch owned NFTs:", err)
        setError(err.message || "Failed to load NFT accounts")
      } finally {
        setLoadingAccounts(false)
      }
    }

    fetchOwnedNFTs()
  }, [isConnected, address, nbaClient, setAccounts, setError])

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr)
    setCopiedAddress(addr)
    setTimeout(() => setCopiedAddress(""), 2000)
  }

  const openInExplorer = (tokenId: string) => {
    window.open(`https://explorer.story-aeneid.io/token/${process.env.NEXT_PUBLIC_NBA_FACTORY_ADDRESS}/${tokenId}`, "_blank")
  }

  const generateContractSVG = async (account: NFTBoundAccount) => {
    if (!nbaClient) return ""

    try {
      const metadata = await nbaClient.getWalletMetadata(account.tokenId)
      if (!metadata) return ""

      const walletData: WalletData = {
        tokenId: metadata.tokenId,
        walletAddress: metadata.walletAddress,
        balance: metadata.balance,
        transactionCount: metadata.transactionCount,
        nftCount: 0, // This could be fetched separately
        isActive: true,
      }

      return generateNFTSVG(walletData, {
        width: 350,
        height: 220,
        animations: true,
      })
    } catch (err) {
      console.error("Failed to generate SVG:", err)
      return ""
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/60">
            Your NFT Wallets
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            View and manage your NFT-Bound Smart Accounts. Each NFT represents a complete wallet that you can trade,
            transfer, or use.
          </p>
        </motion.div>

        {/* Wallet Connection Section */}
        <div className="flex justify-center mb-12">
          <div className="glass-panel p-6 rounded-2xl">
            {!isConnected ? (
              <div className="text-center">
                <Wallet className="w-12 h-12 text-white/60 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white/90 mb-2">Connect Your Wallet</h3>
                <p className="text-white/60 mb-4">Connect your wallet to view your NFT-bound accounts</p>
                <Button onClick={connect}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-white/90 font-medium">Connected</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-mono text-white/80">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                  <button
                    onClick={() => address && copyAddress(address)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedAddress === address ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NFT Gallery */}
        {isConnected && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold text-white/90 mb-8 text-center">Your NFT-Bound Accounts</h2>

            {loadingAccounts ? (
              <div className="text-center py-12">
                <Loader className="w-12 h-12 text-white/60 animate-spin mx-auto mb-4" />
                <p className="text-white/60">Loading your NFT accounts...</p>
              </div>
            ) : nftAccounts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {nftAccounts.map((account, index) => (
                  <NFTAccountCard
                    key={account.tokenId.toString()}
                    account={account}
                    index={index}
                    onCopyAddress={copyAddress}
                    copiedAddress={copiedAddress}
                    onOpenExplorer={openInExplorer}
                    onManage={() => router.push(`/account/${account.tokenId.toString()}`)}
                    generateSVG={generateContractSVG}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-12 h-12 text-white/40" />
                </div>
                <h3 className="text-xl font-semibold text-white/90 mb-2">No NFT Wallets Found</h3>
                <p className="text-white/60 mb-6">You don't own any NFT-Bound Smart Accounts yet.</p>
                <Button onClick={() => router.push("/mint")}>Mint Your First NBA</Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// NFT Account Card Component
function NFTAccountCard({
  account,
  index,
  onCopyAddress,
  copiedAddress,
  onOpenExplorer,
  onManage,
  generateSVG,
}: {
  account: NFTBoundAccount
  index: number
  onCopyAddress: (address: string) => void
  copiedAddress: string
  onOpenExplorer: (tokenId: string) => void
  onManage: () => void
  generateSVG: (account: NFTBoundAccount) => Promise<string>
}) {
  const [svg, setSvg] = useState<string>("")
  const [metadata, setMetadata] = useState<any>(null)

  useEffect(() => {
    generateSVG(account).then(setSvg)
  }, [account, generateSVG])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-panel p-6 rounded-2xl hover:border-[var(--gradient-start)]/50 transition-colors"
    >
      {/* SVG Display */}
      {svg && (
        <div
          className="w-full h-48 mb-4 rounded-lg overflow-hidden"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}

      {/* NFT Details */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-white/90">NBA #{account.tokenId.toString()}</h3>
          <button
            onClick={() => onOpenExplorer(account.tokenId.toString())}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Wallet Address:</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-white/80">
              {account.walletAddress.slice(0, 6)}...{account.walletAddress.slice(-4)}
            </span>
            <button
              onClick={() => onCopyAddress(account.walletAddress)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {copiedAddress === account.walletAddress ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-white/60" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onManage} className="flex-1 text-sm">
            Manage
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.open(`https://opensea.io/assets/story-aeneid/${process.env.NEXT_PUBLIC_NBA_FACTORY_ADDRESS}/${account.tokenId.toString()}`, "_blank")}
            className="flex-1 text-sm"
          >
            Trade
          </Button>
        </div>
      </div>
    </motion.div>
  )
}