"use client"

import { useState } from "react"
import { generateNFTSVG, generateNFTMetadata, type WalletData, getRarityTier, getActivityLevel } from "./svg-generator"
import Button from "./button"
import { Download, Copy, Check } from "lucide-react"

interface ContractPreviewProps {
  tokenId?: string
  walletAddress?: string
  balance?: string
}

export default function ContractPreview({
  tokenId: initialTokenId = "0001",
  walletAddress = "0x1234567890123456789012345678901234567890",
  balance = "2.45",
}: ContractPreviewProps) {
  const [copied, setCopied] = useState("")
  const [currentBalance, setCurrentBalance] = useState(balance)
  const [currentTokenId, setCurrentTokenId] = useState(initialTokenId)

  const walletData: WalletData = {
    tokenId: currentTokenId,
    walletAddress,
    balance: currentBalance,
    transactionCount: 142,
    nftCount: 5,
    isActive: true,
  }

  const contractSVG = generateNFTSVG(walletData, {
    width: 400,
    height: 400,
    animations: true,
  })

  const metadata = generateNFTMetadata(walletData, {
    width: 400,
    height: 400,
    animations: true,
  })

  const rarity = getRarityTier(Number.parseInt(currentTokenId))
  const activity = getActivityLevel(Number.parseFloat(currentBalance) * 1e18)

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(""), 2000)
  }

  const downloadSVG = () => {
    const blob = new Blob([contractSVG], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `NBA-${currentTokenId}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadMetadata = () => {
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `NBA-${currentTokenId}-metadata.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const balanceOptions = ["0", "0.05", "0.5", "2.45", "15.8"]
  const tokenIdOptions = ["0001", "0050", "0100", "0500", "1000", "1337", "2024", "9999"]

  return (
    <div className="space-y-8">
      {/* Main Preview Panel */}
      <div className="glass-panel p-8 rounded-2xl">
        <h3 className="text-xl font-bold text-white/90 mb-6">Contract SVG Preview</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SVG Display */}
          <div className="flex flex-col items-center">
            <div
              className="w-full max-w-[400px] aspect-square rounded-2xl overflow-hidden border border-white/20"
              dangerouslySetInnerHTML={{ __html: contractSVG }}
            />

            <div className="flex gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(contractSVG, "svg")}
                className="text-sm px-3 py-2"
              >
                {copied === "svg" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === "svg" ? "Copied!" : "Copy SVG"}
              </Button>
              <Button variant="secondary" onClick={downloadSVG} className="text-sm px-3 py-2">
                <Download className="w-4 h-4 mr-2" />
                Download SVG
              </Button>
            </div>
          </div>

          {/* Controls and Info */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Token ID</label>
              <div className="flex gap-2 flex-wrap mb-4">
                {tokenIdOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setCurrentTokenId(option)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      currentTokenId === option
                        ? "bg-[var(--gradient-start)] text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    #{option}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={currentTokenId}
                onChange={(e) => setCurrentTokenId(e.target.value.padStart(4, "0"))}
                placeholder="Custom Token ID"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-[var(--gradient-start)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Balance (ETH)</label>
              <div className="flex gap-2 flex-wrap">
                {balanceOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setCurrentBalance(option)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      currentBalance === option
                        ? "bg-[var(--gradient-start)] text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {option} ETH
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Token ID:</span>
                <span className="font-mono text-white/90">#{currentTokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Rarity Tier:</span>
                <span
                  className={`font-semibold capitalize ${
                    rarity === "legendary"
                      ? "text-yellow-400"
                      : rarity === "epic"
                        ? "text-purple-400"
                        : rarity === "rare"
                          ? "text-blue-400"
                          : "text-gray-400"
                  }`}
                >
                  {rarity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Activity Level:</span>
                <span
                  className={`font-semibold capitalize ${
                    activity === "high"
                      ? "text-orange-400"
                      : activity === "medium"
                        ? "text-red-400"
                        : activity === "low"
                          ? "text-purple-400"
                          : "text-blue-400"
                  }`}
                >
                  {activity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Wallet Address:</span>
                <span className="font-mono text-white/90 text-sm">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-white/90 mb-2">Visual Features</h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Dynamic element based on balance tier</li>
                <li>• Animated gradients and effects</li>
                <li>• Rarity-based visual filters</li>
                <li>• Special effects for high-value wallets</li>
                <li>• On-chain generation (gas optimized)</li>
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-amber-200 text-sm">
                <strong>Note:</strong> This preview matches exactly what the NFTWalletFactory contract generates
                on-chain. The SVG updates automatically based on wallet balance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Panel */}
      <div className="glass-panel p-8 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white/90">NFT Metadata</h3>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(JSON.stringify(metadata, null, 2), "metadata")}
              className="text-sm px-3 py-2"
            >
              {copied === "metadata" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === "metadata" ? "Copied!" : "Copy JSON"}
            </Button>
            <Button variant="secondary" onClick={downloadMetadata} className="text-sm px-3 py-2">
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Metadata Preview */}
          <div>
            <h4 className="font-semibold text-white/90 mb-3">Basic Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Name:</span>
                <span className="text-white/90">{metadata.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">External URL:</span>
                <span className="text-white/90 text-xs">{metadata.external_url}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Background Color:</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-white/20"
                    style={{ backgroundColor: `#${metadata.background_color}` }}
                  />
                  <span className="text-white/90">#{metadata.background_color}</span>
                </div>
              </div>
            </div>

            <h4 className="font-semibold text-white/90 mb-3 mt-6">Description</h4>
            <p className="text-sm text-white/70 leading-relaxed">{metadata.description}</p>
          </div>

          {/* Attributes */}
          <div>
            <h4 className="font-semibold text-white/90 mb-3">Attributes</h4>
            <div className="space-y-2">
              {metadata.attributes.map((attr, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                  <span className="text-white/70 text-sm">{attr.trait_type}:</span>
                  <span className="text-white/90 font-mono text-sm">
                    {attr.display_type === "number" ? attr.value.toLocaleString() : attr.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Raw JSON */}
        <div className="mt-8">
          <h4 className="font-semibold text-white/90 mb-3">Raw JSON Metadata</h4>
          <div className="bg-black/40 rounded-lg p-4 border border-white/10 max-h-96 overflow-y-auto">
            <pre className="text-xs text-white/80 whitespace-pre-wrap">{JSON.stringify(metadata, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
