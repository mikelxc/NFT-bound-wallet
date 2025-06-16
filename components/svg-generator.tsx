"use client"

/**
 * SVG Generator Utility for NFT-Bound Smart Accounts
 *
 * This utility generates dynamic, on-chain SVG metadata that reflects
 * the real-time state of NFT-bound smart accounts. Each NFT's visual
 * appearance is algorithmically determined based on its token ID and
 * current wallet state.
 */

export interface WalletData {
  tokenId: string
  walletAddress: string
  balance: string
  transactionCount: number
  nftCount: number
  isActive: boolean
  lastUpdate?: number
}

export interface SVGOptions {
  width?: number
  height?: number
  variant?: "compact" | "default" | "detailed"
  theme?: "dark" | "light" | "auto"
  animations?: boolean
  showGrid?: boolean
  customGradient?: { start: string; end: string }
}

/**
 * Generates a deterministic color gradient based on token ID
 * This ensures each NFT has a unique, consistent visual identity
 */
export function generateDeterministicGradient(tokenId: string): { start: string; end: string } {
  // Convert token ID to numeric hash
  const hash = tokenId.split("").reduce((acc, char, index) => {
    return acc + char.charCodeAt(0) * (index + 1)
  }, 0)

  // Generate hue values using golden ratio for pleasing color distribution
  const goldenRatio = 137.508
  const hue1 = (hash * goldenRatio) % 360
  const hue2 = (hue1 + 60) % 360

  // Ensure good contrast and saturation
  const saturation = 70
  const lightness1 = 60
  const lightness2 = 50

  return {
    start: `hsl(${hue1}, ${saturation}%, ${lightness1}%)`,
    end: `hsl(${hue2}, ${saturation}%, ${lightness2}%)`,
  }
}

/**
 * Generates SVG that matches the NFTWalletFactory contract implementation
 * This ensures consistency between on-chain and client-side rendering
 */
export function generateNFTSVG(walletData: WalletData, options: SVGOptions = {}): string {
  const {
    width = 400,
    height = 400,
    variant = "default",
    theme = "dark",
    animations = true,
    showGrid = false, // Contract doesn't use grid
    customGradient,
  } = options

  const balance = Number.parseFloat(walletData.balance) * 1e18 // Convert to wei for calculations
  const tokenId = Number.parseInt(walletData.tokenId)

  // Generate truncated wallet address like the contract
  const walletStr = walletData.walletAddress
  const truncatedWallet = `${walletStr.slice(0, 6)}...${walletStr.slice(-4)}`

  return `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      ${generateContractDefs(balance, tokenId, animations)}
      ${generateContractBackground()}
      ${generateContractGlassCard()}
      ${generateContractDynamicElement(balance)}
      ${generateContractText(tokenId, truncatedWallet, balance)}
      ${generateContractDecorations(balance, tokenId)}
    </svg>
  `.trim()
}

function generateContractDefs(balance: number, tokenId: number, animations: boolean): string {
  return `
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1">
          ${animations ? '<animate attributeName="stop-color" values="#667eea;#764ba2;#667eea" dur="10s" repeatCount="indefinite"/>' : ""}
        </stop>
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1">
          ${animations ? '<animate attributeName="stop-color" values="#764ba2;#667eea;#764ba2" dur="10s" repeatCount="indefinite"/>' : ""}
        </stop>
      </linearGradient>
      <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.2);stop-opacity:1" />
        <stop offset="50%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
        <stop offset="100%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
      </linearGradient>
      ${generateContractActivityGradient(balance)}
      ${generateContractBalanceFilter(balance)}
      ${generateContractRarityFilter(tokenId)}
    </defs>
  `
}

function generateContractActivityGradient(balance: number): string {
  const ethBalance = balance / 1e18

  if (ethBalance === 0) {
    return '<radialGradient id="activityGradient"><stop offset="0%" style="stop-color:#4F46E5;stop-opacity:0.8"/><stop offset="100%" style="stop-color:#4F46E5;stop-opacity:0.3"/></radialGradient>'
  } else if (ethBalance <= 0.1) {
    return '<radialGradient id="activityGradient"><stop offset="0%" style="stop-color:#7C3AED;stop-opacity:0.9"/><stop offset="100%" style="stop-color:#7C3AED;stop-opacity:0.4"/></radialGradient>'
  } else if (ethBalance <= 1) {
    return '<radialGradient id="activityGradient"><stop offset="0%" style="stop-color:#DC2626;stop-opacity:1"/><stop offset="100%" style="stop-color:#DC2626;stop-opacity:0.5"/></radialGradient>'
  } else {
    return '<radialGradient id="activityGradient"><stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1"/><stop offset="100%" style="stop-color:#F59E0B;stop-opacity:0.6"/></radialGradient>'
  }
}

function generateContractBalanceFilter(balance: number): string {
  const ethBalance = balance / 1e18

  if (ethBalance >= 10) {
    return '<filter id="shimmer"><feGaussianBlur stdDeviation="1" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
  } else if (ethBalance >= 1) {
    return '<filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
  }
  return ""
}

function generateContractRarityFilter(tokenId: number): string {
  if (tokenId <= 100) {
    return '<filter id="golden"><feColorMatrix values="1.2 0.8 0.2 0 0.1 0.8 1.1 0.3 0 0.1 0.3 0.4 1.0 0 0 0 0 1 0"/></filter>'
  } else if (tokenId <= 1000) {
    return '<filter id="silver"><feColorMatrix values="1.1 1.1 1.1 0 0 1.1 1.1 1.1 0 0 1.1 1.1 1.1 0 0 0 0 0 1 0"/></filter>'
  }
  return ""
}

function generateContractBackground(): string {
  return '<rect width="400" height="400" fill="url(#bg)"/>'
}

function generateContractGlassCard(): string {
  return `
    <rect x="30" y="30" width="340" height="340" rx="20" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
    <rect x="30" y="30" width="340" height="340" rx="20" fill="url(#glassGradient)" opacity="0.5"/>
  `
}

function generateContractDynamicElement(balance: number): string {
  const ethBalance = balance / 1e18

  if (ethBalance === 0) {
    // Dormant crystal (static)
    return `
      <polygon points="200,160 220,180 200,200 180,180" fill="url(#activityGradient)" opacity="0.8"/>
      <polygon points="200,165 215,180 200,195 185,180" fill="rgba(255,255,255,0.3)"/>
    `
  } else if (ethBalance <= 0.1) {
    // Pulsing orb
    return `
      <circle cx="200" cy="180" r="18" fill="url(#activityGradient)">
        <animate attributeName="r" values="18;25;18" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="200" cy="180" r="12" fill="rgba(255,255,255,0.4)">
        <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite"/>
      </circle>
    `
  } else if (ethBalance <= 1) {
    // Active nexus with rotating rings
    return `
      <g transform-origin="200 180">
        <animateTransform attributeName="transform" type="rotate" values="0 200 180;360 200 180" dur="4s" repeatCount="indefinite"/>
        <circle cx="200" cy="180" r="25" fill="none" stroke="url(#activityGradient)" strokeWidth="3"/>
        <circle cx="200" cy="180" r="18" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"/>
      </g>
      <circle cx="200" cy="180" r="10" fill="url(#activityGradient)"/>
    `
  } else {
    // Energized portal with particle effects
    return `
      <circle cx="200" cy="180" r="28" fill="url(#activityGradient)" opacity="0.6">
        <animate attributeName="r" values="28;35;28" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0 200 180;360 200 180" dur="3s" repeatCount="indefinite"/>
        <circle cx="225" cy="180" r="3" fill="white" opacity="0.8"/>
        <circle cx="200" cy="155" r="2" fill="white" opacity="0.6"/>
        <circle cx="175" cy="180" r="3" fill="white" opacity="0.8"/>
        <circle cx="200" cy="205" r="2" fill="white" opacity="0.6"/>
      </g>
    `
  }
}

function generateContractText(tokenId: number, truncatedWallet: string, balance: number): string {
  const ethBalance = balance / 1e18
  const balanceFilter = ethBalance >= 1 ? ' filter="url(#glow)"' : ""
  const rarityFilter = tokenId <= 100 ? ' filter="url(#golden)"' : tokenId <= 1000 ? ' filter="url(#silver)"' : ""
  const formattedBalance = formatEtherDisplay(balance)

  return `
    <text x="50" y="80" fontFamily="monospace" fontSize="28" fontWeight="bold" fill="white"${rarityFilter}>
      NBA #${tokenId}
    </text>
    <text x="50" y="100" fontFamily="monospace" fontSize="11" fill="rgba(255,255,255,0.6)">
      NFT-BOUND SMART ACCOUNT
    </text>
    <text x="50" y="130" fontFamily="monospace" fontSize="14" fill="rgba(255,255,255,0.8)">
      ${truncatedWallet}
    </text>
    <text x="50" y="330" fontFamily="monospace" fontSize="16" fill="rgba(255,255,255,0.9)"${balanceFilter}>
      ⟡ ${formattedBalance} ETH
    </text>
  `
}

function generateContractDecorations(balance: number, tokenId: number): string {
  const cornerAccents = `
    <path d="M30 60 L30 30 L60 30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
    <path d="M340 60 L370 60 L370 30 L340 30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
    <path d="M30 340 L30 370 L60 370" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
    <path d="M340 370 L370 370 L370 340" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
  `

  const ethBalance = balance / 1e18
  let particles = ""

  if (ethBalance >= 10 || isSpecialTokenId(tokenId)) {
    particles = `
      <circle r="1.5" fill="white" opacity="0.6">
        <animateMotion dur="6s" repeatCount="indefinite" path="M70,70 Q200,50 330,70 Q200,90 70,70"/>
      </circle>
      <circle r="1" fill="white" opacity="0.4">
        <animateMotion dur="8s" repeatCount="indefinite" path="M330,330 Q200,310 70,330 Q200,350 330,330"/>
      </circle>
    `
  }

  return cornerAccents + particles
}

function isSpecialTokenId(tokenId: number): boolean {
  if (tokenId < 10) return false
  if (tokenId < 100) {
    return Math.floor(tokenId / 10) === tokenId % 10
  }
  if (tokenId < 1000) {
    const first = Math.floor(tokenId / 100)
    const last = tokenId % 10
    return first === last
  }
  return tokenId % 1000 === 0 || tokenId % 500 === 0
}

function formatEtherDisplay(weiAmount: number): string {
  if (weiAmount === 0) return "0.0"

  const eth = Math.floor(weiAmount / 1e18)
  const remainder = weiAmount % 1e18

  if (remainder === 0) {
    return `${eth}.0`
  }

  const decimals = Math.floor(remainder / 1e15) // 3 decimal places
  return `${eth}.${decimals.toString().padStart(3, "0")}`
}

/**
 * Generates complete NFT metadata including the SVG image
 */
export function generateNFTMetadata(walletData: WalletData, options: SVGOptions = {}) {
  const svgString = generateNFTSVG(walletData, options)

  // Use proper base64 encoding that handles Unicode characters
  const base64SVG =
    typeof window !== "undefined"
      ? btoa(unescape(encodeURIComponent(svgString)))
      : Buffer.from(svgString, "utf8").toString("base64")

  const balance = Number.parseFloat(walletData.balance) * 1e18 // Convert to wei
  const tokenId = Number.parseInt(walletData.tokenId)

  return {
    name: `NBA #${walletData.tokenId}`,
    description:
      "This NFT represents ownership of an NFT-Bound Smart Account (NBA) built on Kernel v3.3. The owner of this NFT has full control over the associated wallet. Transfer this NFT to transfer wallet control instantly.",
    image: `data:image/svg+xml;base64,${base64SVG}`,
    external_url: `https://nft-bsa.xyz/account/${walletData.tokenId}`,
    background_color: "667eea",
    attributes: [
      {
        trait_type: "Wallet Address",
        value: walletData.walletAddress,
      },
      {
        trait_type: "ETH Balance",
        value: Math.floor(balance / 1e15), // milliether for precision
        display_type: "number",
      },
      {
        trait_type: "Token ID",
        value: tokenId,
        display_type: "number",
      },
      {
        trait_type: "Account Type",
        value: "Smart Contract Wallet",
      },
      {
        trait_type: "Kernel Version",
        value: "v3.3",
      },
      {
        trait_type: "Validator",
        value: "NFT-Bound",
      },
      {
        trait_type: "Chain ID",
        value: 8453, // Base chain
        display_type: "number",
      },
    ],
  }
}

/**
 * Utility to create a wallet state fingerprint for caching
 */
export function createWalletFingerprint(walletData: WalletData): string {
  const fingerprintData = JSON.stringify({
    tokenId: walletData.tokenId,
    balance: walletData.balance,
    transactionCount: walletData.transactionCount,
    nftCount: walletData.nftCount,
    isActive: walletData.isActive,
  })

  return typeof window !== "undefined"
    ? btoa(unescape(encodeURIComponent(fingerprintData)))
    : Buffer.from(fingerprintData, "utf8").toString("base64")
}

/**
 * Determines rarity tier based on token ID (matches contract logic)
 */
export function getRarityTier(tokenId: number): "legendary" | "epic" | "rare" | "common" {
  if (tokenId <= 100) return "legendary"
  if (tokenId <= 1000) return "epic"
  if (isSpecialTokenId(tokenId)) return "rare"
  return "common"
}

/**
 * Gets activity level based on balance (matches contract logic)
 */
export function getActivityLevel(balance: number): "dormant" | "low" | "medium" | "high" {
  const ethBalance = balance / 1e18
  if (ethBalance === 0) return "dormant"
  if (ethBalance <= 0.1) return "low"
  if (ethBalance <= 1) return "medium"
  return "high"
}

/**
 * Contract-compatible balance formatting
 */
export function formatEtherContract(weiAmount: number): string {
  if (weiAmount === 0) return "0.0"

  const eth = Math.floor(weiAmount / 1e18)
  const remainder = weiAmount % 1e18

  if (remainder === 0) {
    return `${eth}.0`
  }

  const decimals = Math.floor(remainder / 1e15) // 3 decimal places
  return `${eth}.${decimals}`
}
