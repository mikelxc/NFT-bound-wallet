"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ExternalLink, Loader2, Image as ImageIcon, Palette, RefreshCw } from "lucide-react"
import { Address } from "viem"
import { createAlchemyClient } from "@/lib/alchemy-client"
import Button from "@/components/button"

interface NFTItem {
  contractAddress: string
  tokenId: string
  name?: string
  description?: string
  image: string
  collection?: {
    name?: string
    floorPrice?: number
  }
  tokenType: string
  timeLastUpdated: string
}

interface NFTDisplayProps {
  walletAddress: Address
}

export default function NFTDisplay({ walletAddress }: NFTDisplayProps) {
  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [totalCount, setTotalCount] = useState(0)
  const [pageKey, setPageKey] = useState<string>()
  const [hasMore, setHasMore] = useState(false)

  const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1315")

  const loadNFTs = async (loadMore: boolean = false) => {
    try {
      if (!loadMore) {
        setIsLoading(true)
        setError("")
      }

      const alchemy = createAlchemyClient(CHAIN_ID)
      
      const response = await alchemy.nft.getNftsForOwner(walletAddress, {
        pageSize: 12,
        pageKey: loadMore ? pageKey : undefined,
        omitMetadata: false, // Include metadata for better display
      })

      const formattedNFTs: NFTItem[] = response.ownedNfts.map(nft => ({
        contractAddress: nft.contract.address,
        tokenId: nft.tokenId,
        name: nft.name || `${nft.contract.symbol || 'Unknown'} #${nft.tokenId}`,
        description: nft.description,
        image: nft.image.originalUrl || nft.image.thumbnailUrl || nft.image.pngUrl || '',
        collection: {
          name: nft.contract.name || nft.contract.symbol,
          floorPrice: nft.contract.openSeaMetadata?.floorPrice,
        },
        tokenType: nft.tokenType,
        timeLastUpdated: nft.timeLastUpdated,
      }))

      if (loadMore) {
        setNfts(prev => [...prev, ...formattedNFTs])
      } else {
        setNfts(formattedNFTs)
        setTotalCount(response.totalCount)
      }

      setPageKey(response.pageKey)
      setHasMore(!!response.pageKey)

    } catch (err) {
      console.error('Failed to load NFTs:', err)
      setError('Failed to load NFT collection. This might be due to network limitations on the Story testnet.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNFTs()
  }, [walletAddress])

  const handleRefresh = () => {
    setPageKey(undefined)
    loadNFTs()
  }

  const getExplorerUrl = (contractAddress: string, tokenId: string) => {
    return `https://story-aeneid.explorer.io/token/${contractAddress}?a=${tokenId}`
  }

  const getOpenSeaUrl = (contractAddress: string, tokenId: string) => {
    // Note: OpenSea might not support Story testnet
    return `https://opensea.io/assets/story/${contractAddress}/${tokenId}`
  }

  if (isLoading && nfts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--gradient-start)] mr-3" />
        <span className="text-white/70">Loading NFT collection...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-white/90 mb-2">Unable to Load NFTs</h3>
        <p className="text-white/60 mb-4 max-w-md mx-auto">{error}</p>
        <Button onClick={handleRefresh} variant="secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Palette className="w-8 h-8 text-white/40" />
        </div>
        <h3 className="text-lg font-semibold text-white/90 mb-2">No NFTs Found</h3>
        <p className="text-white/60 mb-4">
          This wallet doesn't own any NFTs yet, or they haven't been indexed on the Story network.
        </p>
        <Button onClick={handleRefresh} variant="secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white/90">NFT Collection</h3>
          <p className="text-sm text-white/60">{totalCount} total NFTs owned</p>
        </div>
        <Button onClick={handleRefresh} variant="secondary" className="text-xs px-3 py-2">
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfts.map((nft, index) => (
          <motion.div
            key={`${nft.contractAddress}-${nft.tokenId}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-colors group"
          >
            {/* NFT Image */}
            <div className="aspect-square bg-white/5 relative overflow-hidden">
              {nft.image ? (
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div className={`absolute inset-0 flex items-center justify-center ${nft.image ? 'hidden' : ''}`}>
                <ImageIcon className="w-12 h-12 text-white/30" />
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(getExplorerUrl(nft.contractAddress, nft.tokenId), '_blank')}
                    className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* NFT Info */}
            <div className="p-4">
              <h4 className="font-semibold text-white/90 mb-1 truncate" title={nft.name}>
                {nft.name}
              </h4>
              
              {nft.collection?.name && (
                <p className="text-xs text-white/60 mb-2 truncate">
                  {nft.collection.name}
                </p>
              )}
              
              {nft.description && (
                <p className="text-xs text-white/50 mb-3 line-clamp-2">
                  {nft.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-white/10 rounded text-white/70">
                    {nft.tokenType}
                  </span>
                  <span className="text-white/50">
                    #{nft.tokenId}
                  </span>
                </div>
                
                {nft.collection?.floorPrice && (
                  <div className="text-right">
                    <p className="text-white/70">
                      Floor: {nft.collection.floorPrice} ETH
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => loadNFTs(true)}
            variant="secondary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More NFTs'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}