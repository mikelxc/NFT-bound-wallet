"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Button from "@/components/button"
import { Wallet, ExternalLink, Copy, Check } from "lucide-react"

// Mock data for NFT gallery
const mockNFTs = [
  {
    tokenId: "0001",
    walletAddress: "0x1234...5678",
    ethBalance: "2.45",
    transactionCount: 142,
    nftCount: 5,
    svgData: `<svg width="350" height="220" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667EEA;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764BA2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="350" height="220" fill="url(#grad1)" rx="20"/>
      <text x="20" y="40" fill="white" fontFamily="monospace" fontSize="14">NBA #0001</text>
      <text x="20" y="180" fill="white" fontFamily="monospace" fontSize="16">2.45 ETH</text>
      <text x="20" y="200" fill="rgba(255,255,255,0.7)" fontFamily="monospace" fontSize="12">142 txns • 5 NFTs</text>
    </svg>`,
  },
  {
    tokenId: "0002",
    walletAddress: "0x2345...6789",
    ethBalance: "1.23",
    transactionCount: 89,
    nftCount: 3,
    svgData: `<svg width="350" height="220" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#764BA2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#EA6B66;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="350" height="220" fill="url(#grad2)" rx="20"/>
      <text x="20" y="40" fill="white" fontFamily="monospace" fontSize="14">NBA #0002</text>
      <text x="20" y="180" fill="white" fontFamily="monospace" fontSize="16">1.23 ETH</text>
      <text x="20" y="200" fill="rgba(255,255,255,0.7)" fontFamily="monospace" fontSize="12">89 txns • 3 NFTs</text>
    </svg>`,
  },
  {
    tokenId: "0003",
    walletAddress: "0x3456...7890",
    ethBalance: "0.87",
    transactionCount: 234,
    nftCount: 12,
    svgData: `<svg width="350" height="220" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#EA6B66;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#667EEA;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="350" height="220" fill="url(#grad3)" rx="20"/>
      <text x="20" y="40" fill="white" fontFamily="monospace" fontSize="14">NBA #0003</text>
      <text x="20" y="180" fill="white" fontFamily="monospace" fontSize="16">0.87 ETH</text>
      <text x="20" y="200" fill="rgba(255,255,255,0.7)" fontFamily="monospace" fontSize="12">234 txns • 12 NFTs</text>
    </svg>`,
  },
]

export default function WalletPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectedAddress, setConnectedAddress] = useState<string>("")
  const [ownedNFTs, setOwnedNFTs] = useState<typeof mockNFTs>([])
  const [copiedAddress, setCopiedAddress] = useState<string>("")

  // TODO: Replace with actual wallet connection logic
  const connectWallet = async () => {
    try {
      // Simulate wallet connection
      console.log("Connecting wallet...")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockAddress = "0x1234567890123456789012345678901234567890"
      setConnectedAddress(mockAddress)
      setIsConnected(true)

      // TODO: Fetch actual owned NFTs from blockchain
      // For now, show mock data if connected
      setOwnedNFTs(mockNFTs)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setConnectedAddress("")
    setOwnedNFTs([])
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(""), 2000)
  }

  const openInExplorer = (tokenId: string) => {
    // TODO: Replace with actual explorer URL
    window.open(`https://basescan.org/token/0xFACTORY_ADDRESS/${tokenId}`, "_blank")
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
                <Button onClick={connectWallet}>
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
                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </span>
                  <button
                    onClick={() => copyAddress(connectedAddress)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedAddress === connectedAddress ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                </div>
                <Button variant="secondary" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* NFT Gallery */}
        {isConnected && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold text-white/90 mb-8 text-center">Your NFT-Bound Accounts</h2>

            {ownedNFTs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ownedNFTs.map((nft, index) => (
                  <motion.div
                    key={nft.tokenId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-panel p-6 rounded-2xl hover:border-[var(--gradient-start)]/50 transition-colors"
                  >
                    {/* SVG Display */}
                    <div
                      className="w-full h-48 mb-4 rounded-lg overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: nft.svgData }}
                    />

                    {/* NFT Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-white/90">NBA #{nft.tokenId}</h3>
                        <button
                          onClick={() => openInExplorer(nft.tokenId)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-white/60" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Wallet Address:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-white/80">{nft.walletAddress}</span>
                          <button
                            onClick={() => copyAddress(nft.walletAddress)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            {copiedAddress === nft.walletAddress ? (
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

                      <div className="flex gap-2">
                        <Button
                          onClick={() => (window.location.href = `/account/${nft.tokenId}`)}
                          className="flex-1 text-sm"
                        >
                          Manage
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => alert(`Trade NBA #${nft.tokenId} on OpenSea`)}
                          className="flex-1 text-sm"
                        >
                          Trade
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-12 h-12 text-white/40" />
                </div>
                <h3 className="text-xl font-semibold text-white/90 mb-2">No NFT Wallets Found</h3>
                <p className="text-white/60 mb-6">You don't own any NFT-Bound Smart Accounts yet.</p>
                <Button onClick={() => (window.location.href = "/mint")}>Mint Your First NBA</Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
