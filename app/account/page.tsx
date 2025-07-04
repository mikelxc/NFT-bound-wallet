"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Button from "@/components/button"
import { Search, Grid, List, ExternalLink, Copy, Check, Wallet, Loader2 } from "lucide-react"
import Link from "next/link"
import { createAlchemyClient, getAlchemyRpcUrl } from "@/lib/alchemy-client"
import { createPublicClient, http } from "viem"
import { createNBAClient } from "@/lib/nba-sdk"
import { CONTRACT_ADDRESSES } from "@/lib/nba-sdk/constants"

// Replace the existing generateNFTSVG function with contract-compatible version
import { generateNFTSVG, type WalletData } from "@/components/svg-generator"

// Define the chain configuration
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1315")
const RPC_URL = getAlchemyRpcUrl(CHAIN_ID)

// NFT data structure
interface NFTData {
  tokenId: string
  owner: string
  walletAddress: string
  ethBalance: string
  transactionCount: number
  nftCount: number
  mintDate: string
  lastActivity: string
}

// Update the function call in the component
const generateContractSVG = (nft: NFTData) => {
  const walletData: WalletData = {
    tokenId: nft.tokenId,
    walletAddress: nft.walletAddress,
    balance: nft.ethBalance,
    transactionCount: nft.transactionCount,
    nftCount: nft.nftCount,
    isActive: true,
  }

  return generateNFTSVG(walletData, {
    width: 300,
    height: 200,
    animations: true,
  })
}

type ViewMode = "grid" | "list"
type SortBy = "newest" | "oldest" | "balance" | "activity"

export default function AccountGalleryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortBy>("newest")
  const [copiedAddress, setCopiedAddress] = useState<string>("")
  const [nfts, setNfts] = useState<NFTData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  // Load NFT collection data
  useEffect(() => {
    const loadNFTCollection = async () => {
      try {
        setIsLoading(true)
        setError("")

        // Create clients
        const publicClient = createPublicClient({
          transport: http(RPC_URL),
        })

        // Use environment variables for contract addresses, with fallback to constants
        const factoryAddress = CONTRACT_ADDRESSES[CHAIN_ID as keyof typeof CONTRACT_ADDRESSES]?.nftWalletFactory as Address
        const entryPoint = CONTRACT_ADDRESSES[CHAIN_ID as keyof typeof CONTRACT_ADDRESSES]?.entryPoint as Address

        console.log("Gallery Debug - Chain ID:", CHAIN_ID)
        console.log("Gallery Debug - Factory Address:", factoryAddress)
        console.log("Gallery Debug - RPC URL:", RPC_URL)

        const nbaClient = createNBAClient(
          {
            chainId: CHAIN_ID,
            factoryAddress,
            entryPoint,
          },
          publicClient
        )

        // Load the first 50 NFTs from the contract using enhanced metadata
        const nftData: NFTData[] = []
        
        // Start from token ID 0 since it exists in this NBA collection
        // This is a simplified approach - in production you'd use events for better performance
        for (let tokenId = 0n; tokenId < 50n; tokenId++) {
          try {
            const enhancedMetadata = await nbaClient.getEnhancedWalletMetadata(tokenId)
            if (enhancedMetadata) {
              nftData.push({
                tokenId: tokenId.toString().padStart(4, '0'),
                owner: enhancedMetadata.owner,
                walletAddress: enhancedMetadata.walletAddress,
                ethBalance: enhancedMetadata.balance,
                transactionCount: enhancedMetadata.transactionCount,
                nftCount: enhancedMetadata.nftCount,
                mintDate: new Date().toISOString().split('T')[0], // Would need to get from mint event
                lastActivity: enhancedMetadata.transactionHistory.length > 0 
                  ? new Date(enhancedMetadata.transactionHistory[0].timestamp).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0],
              })
            }
          } catch (tokenError) {
            // Token doesn't exist, continue
            console.debug(`Token ID ${tokenId} not found, skipping...`)
            continue
          }
        }

        setNfts(nftData)
      } catch (err) {
        console.error("Failed to load NFT collection:", err)
        setError("Failed to load NFT collection. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadNFTCollection()
  }, [])

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(""), 2000)
  }

  const openInExplorer = (tokenId: string) => {
    const factoryAddress = CONTRACT_ADDRESSES[1315].nftWalletFactory
    // Link to the NFT collection page on the explorer, not individual token
    window.open(`https://story-aeneid.explorer.io/token/${factoryAddress}?tab=nft_transfers&a=${tokenId}`, "_blank")
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/60">
              NFT-BSA Gallery
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Loading NFT-Bound Smart Accounts from the blockchain...
            </p>
          </motion.div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--gradient-start)] mr-3" />
            <span className="text-white/70">Loading collection...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/60">
              NFT-BSA Gallery
            </h1>
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">{error}</div>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Filter and sort NFTs
  const filteredAndSortedNFTs = nfts
    .filter(
      (nft) =>
        nft.tokenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.owner.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.mintDate).getTime() - new Date(a.mintDate).getTime()
        case "oldest":
          return new Date(a.mintDate).getTime() - new Date(b.mintDate).getTime()
        case "balance":
          return Number.parseFloat(b.ethBalance) - Number.parseFloat(a.ethBalance)
        case "activity":
          return b.transactionCount - a.transactionCount
        default:
          return 0
      }
    })

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/60">
            NFT-BSA Gallery
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Explore all minted NFT-Bound Smart Accounts. Each NFT represents a complete wallet that can be traded,
            transferred, or managed independently.
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="Search by Token ID or Owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-[var(--gradient-start)] transition-colors"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--gradient-start)] transition-colors"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="balance">Highest Balance</option>
            <option value="activity">Most Active</option>
          </select>

          {/* View Mode */}
          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid" ? "bg-[var(--gradient-start)] text-white" : "text-white/60 hover:text-white/80"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list" ? "bg-[var(--gradient-start)] text-white" : "text-white/60 hover:text-white/80"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-4 text-center">
            <div className="text-2xl font-bold text-white/90">{nfts.length}</div>
            <div className="text-sm text-white/60">Total Minted</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <div className="text-2xl font-bold text-white/90">
              {nfts.reduce((sum, nft) => sum + Number.parseFloat(nft.ethBalance), 0).toFixed(2)}
            </div>
            <div className="text-sm text-white/60">Total ETH</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <div className="text-2xl font-bold text-white/90">
              {nfts.reduce((sum, nft) => sum + nft.transactionCount, 0)}
            </div>
            <div className="text-sm text-white/60">Total Transactions</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <div className="text-2xl font-bold text-white/90">{nfts.reduce((sum, nft) => sum + nft.nftCount, 0)}</div>
            <div className="text-sm text-white/60">Total NFTs Held</div>
          </div>
        </div>

        {/* NFT Gallery */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedNFTs.map((nft, index) => (
              <motion.div
                key={nft.tokenId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-panel p-6 rounded-2xl hover:border-[var(--gradient-start)]/50 transition-colors group"
              >
                {/* SVG Display */}
                <div
                  className="w-full h-40 mb-4 rounded-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: generateContractSVG(nft) }}
                />

                {/* NFT Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white/90">NBA #{nft.tokenId}</h3>
                    <button
                      onClick={() => openInExplorer(nft.tokenId)}
                      className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="w-4 h-4 text-white/60" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Owner:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-white/80">{nft.owner}</span>
                      <button
                        onClick={() => copyAddress(nft.owner)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {copiedAddress === nft.owner ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-white/60" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/5 rounded p-2">
                      <div className="font-mono text-white/90">{nft.ethBalance} ETH</div>
                      <div className="text-white/60">Balance</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="font-mono text-white/90">{nft.transactionCount}</div>
                      <div className="text-white/60">Txns</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="font-mono text-white/90">{nft.nftCount}</div>
                      <div className="text-white/60">NFTs</div>
                    </div>
                  </div>

                  <Link href={`/account/${nft.tokenId}`}>
                    <Button className="w-full text-sm">
                      <Wallet className="mr-2 h-4 w-4" />
                      View Account
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredAndSortedNFTs.map((nft, index) => (
              <motion.div
                key={nft.tokenId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className="glass-panel p-4 rounded-lg hover:border-[var(--gradient-start)]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-12 rounded overflow-hidden flex-shrink-0"
                    dangerouslySetInnerHTML={{ __html: generateContractSVG(nft) }}
                  />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div>
                      <div className="font-bold text-white/90">NBA #{nft.tokenId}</div>
                      <div className="text-xs text-white/60">Minted {nft.mintDate}</div>
                    </div>
                    <div className="font-mono text-white/80">{nft.owner}</div>
                    <div className="font-mono text-white/90">{nft.ethBalance} ETH</div>
                    <div className="text-white/80">{nft.transactionCount} txns</div>
                    <div className="text-white/80">{nft.nftCount} NFTs</div>
                    <div className="flex gap-2">
                      <Link href={`/account/${nft.tokenId}`}>
                        <Button className="text-xs px-3 py-1">View</Button>
                      </Link>
                      <button
                        onClick={() => openInExplorer(nft.tokenId)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-white/60" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredAndSortedNFTs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-white/40" />
            </div>
            <h3 className="text-xl font-semibold text-white/90 mb-2">No NFTs Found</h3>
            <p className="text-white/60 mb-6">Try adjusting your search or filter criteria.</p>
            <Button onClick={() => setSearchTerm("")}>Clear Search</Button>
          </div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-16 glass-panel p-8 rounded-2xl"
        >
          <h2 className="text-2xl font-bold text-white/90 mb-4">Ready to Create Your Own?</h2>
          <p className="text-white/70 mb-6">
            Join the revolution and mint your own NFT-Bound Smart Account. Trade wallets like never before.
          </p>
          <Link href="/mint">
            <Button>
              <Wallet className="mr-2 h-4 w-4" />
              Mint Your NBA
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
