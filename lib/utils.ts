import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Chain } from "viem"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get explorer URL for a transaction hash from chain config
 */
export function getExplorerTxUrl(chain: Chain | undefined, txHash: string): string | null {
  if (!chain?.blockExplorers?.default?.url) {
    return null
  }
  return `${chain.blockExplorers.default.url}/tx/${txHash}`
}

/**
 * Get explorer URL for a token from chain config
 */
export function getExplorerTokenUrl(chain: Chain | undefined, contractAddress: string, tokenId: string): string | null {
  if (!chain?.blockExplorers?.default?.url) {
    return null
  }
  return `${chain.blockExplorers.default.url}/token/${contractAddress}/${tokenId}`
}

/**
 * Get explorer URL for an address from chain config
 */
export function getExplorerAddressUrl(chain: Chain | undefined, address: string): string | null {
  if (!chain?.blockExplorers?.default?.url) {
    return null
  }
  return `${chain.blockExplorers.default.url}/address/${address}`
}
