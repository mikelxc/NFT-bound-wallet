"use client"

import { motion } from "framer-motion"
import ContractPreview from "@/components/contract-preview"

export default function ContractPreviewPage() {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/60">
            Contract SVG Preview
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Interactive preview of the on-chain SVG generation system. This matches exactly what the NFTWalletFactory
            contract produces, including all dynamic elements, visual effects, and complete metadata.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ContractPreview />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 glass-panel p-8 rounded-2xl"
        >
          <h2 className="text-2xl font-bold text-white/90 mb-6">Contract Implementation Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white/90 mb-4">Balance-Based Visual Tiers</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <div>
                    <div className="font-medium text-white/90">Dormant (0 ETH)</div>
                    <div className="text-sm text-white/60">Static crystal element</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-500 rounded animate-pulse"></div>
                  <div>
                    <div className="font-medium text-white/90">Low (≤0.1 ETH)</div>
                    <div className="text-sm text-white/60">Pulsing orb with animations</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <div>
                    <div className="font-medium text-white/90">Medium (≤1 ETH)</div>
                    <div className="text-sm text-white/60">Rotating nexus with rings</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <div>
                    <div className="font-medium text-white/90">High {">1 ETH"}</div>
                    <div className="text-sm text-white/60">Energized portal with particles</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white/90 mb-4">Rarity System</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <div>
                    <div className="font-medium text-white/90">Legendary (≤100)</div>
                    <div className="text-sm text-white/60">Golden filter with shimmer effect</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <div>
                    <div className="font-medium text-white/90">Epic (≤1000)</div>
                    <div className="text-sm text-white/60">Silver filter with glow effect</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-400 rounded"></div>
                  <div>
                    <div className="font-medium text-white/90">Rare (Special IDs)</div>
                    <div className="text-sm text-white/60">Particle effects and animations</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <div>
                    <div className="font-medium text-white/90">Common (Others)</div>
                    <div className="text-sm text-white/60">Standard appearance</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white/90 mb-3">Technical Specifications</h3>
            <ul className="text-white/70 space-y-2">
              <li>
                • <strong>Canvas Size:</strong> 400x400 pixels (optimized for NFT marketplaces)
              </li>
              <li>
                • <strong>File Format:</strong> SVG with embedded animations and filters
              </li>
              <li>
                • <strong>Gas Optimization:</strong> Efficient string concatenation and minimal storage
              </li>
              <li>
                • <strong>Real-time Updates:</strong> Metadata reflects current wallet balance automatically
              </li>
              <li>
                • <strong>Cross-platform:</strong> Compatible with all major NFT marketplaces and wallets
              </li>
              <li>
                • <strong>Accessibility:</strong> Includes proper metadata and descriptions
              </li>
            </ul>
          </div>

          <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white/90 mb-3">Metadata Standards</h3>
            <ul className="text-white/70 space-y-2">
              <li>
                • <strong>ERC-721 Compatible:</strong> Follows OpenSea and standard marketplace metadata format
              </li>
              <li>
                • <strong>Dynamic Attributes:</strong> Balance, transaction count, and wallet state reflected in traits
              </li>
              <li>
                • <strong>Base64 Encoded SVG:</strong> Fully on-chain image data with no external dependencies
              </li>
              <li>
                • <strong>Rich Descriptions:</strong> Comprehensive descriptions explaining the NFT's functionality
              </li>
              <li>
                • <strong>External Links:</strong> Direct links to account management interface
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
