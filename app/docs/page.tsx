"use client"

import { motion } from "framer-motion"
import { Code, Layers, Zap, Database, Globe, Palette, FileImage, Cpu, Settings } from "lucide-react"

const sections = [
  {
    id: "overview",
    title: "Technical Overview",
    icon: <Globe className="w-6 h-6" />,
    content: `The NFT-Bound Smart Account (NFT-BSA) standard combines ERC-721 NFTs with Kernel v3.3 smart accounts, creating a revolutionary approach where your wallet IS the NFT. Each NFT contains dynamic, on-chain SVG metadata that reflects the real-time state of its associated smart account, built on ZeroDev's Kernel infrastructure.`,
  },
  {
    id: "contract-architecture",
    title: "Contract Architecture",
    icon: <Cpu className="w-6 h-6" />,
    content: `The NFTWalletFactory contract serves as the central hub for minting NFT-bound wallets. It integrates with Kernel v3.3's factory system to deploy deterministic smart accounts, each controlled by a unique NFT. The contract uses NFTBoundValidator for access control and implements sophisticated SVG generation directly on-chain.`,
  },
  {
    id: "svg-metadata",
    title: "Dynamic SVG Metadata System",
    icon: <Palette className="w-6 h-6" />,
    content: `Our NFTs feature fully on-chain, dynamic SVG metadata that updates in real-time to reflect wallet state. The contract generates sophisticated visual representations with balance-based activity indicators, rarity filters for early token IDs, animated elements, and special effects for high-value wallets.`,
  },
  {
    id: "visual-specifications",
    title: "Visual Design Specifications",
    icon: <FileImage className="w-6 h-6" />,
    content: `The SVG design follows the contract's strict specifications: 400x400 pixel canvas, glass morphism design with animated gradients, balance-based dynamic elements (dormant crystal, pulsing orb, rotating nexus, energized portal), rarity-based visual filters (golden for tokens ≤100, silver for tokens ≤1000), and special particle effects for high-value or special token IDs.`,
  },
  {
    id: "kernel-integration",
    title: "Kernel v3.3 Integration",
    icon: <Settings className="w-6 h-6" />,
    content: `Deep integration with ZeroDev's Kernel v3.3 infrastructure provides modular smart account functionality. The NFTBoundValidator ensures only the NFT owner can control the associated wallet, while the KernelFactory enables deterministic address generation and efficient deployment.`,
  },
  {
    id: "architecture",
    title: "Frontend Architecture",
    icon: <Layers className="w-6 h-6" />,
    content: `Built on Next.js 14 with App Router, using Tailwind CSS + Framer Motion for UI, contract-compatible SVG generation, Reown WalletKit for wallet connection, Permissionless.js + Pimlico for Account Abstraction, and Viem for type-safe contract interactions.`,
  },
  {
    id: "sdk",
    title: "NBA SDK",
    icon: <Code className="w-6 h-6" />,
    content: `The core SDK provides a clean abstraction layer with NBAClient for managing accounts and NFTBoundAccount instances for wallet operations. Includes contract-compatible SVG generation utilities and metadata management functions that mirror on-chain behavior.`,
  },
  {
    id: "integration",
    title: "Integration Guide",
    icon: <Zap className="w-6 h-6" />,
    content: `Seamless integration with existing Web3 infrastructure. The contract provides deterministic wallet addresses, enabling pre-computation and integration possibilities. SVG metadata is generated on-chain with client-side preview capabilities.`,
  },
  {
    id: "api",
    title: "API Reference",
    icon: <Database className="w-6 h-6" />,
    content: `Comprehensive APIs for contract interaction, metadata generation, and wallet management. Includes endpoints for minting, balance queries, SVG generation, and real-time wallet state synchronization with proper caching and performance optimization.`,
  },
]

const codeExamples = {
  "contract-architecture": `// NFTWalletFactory Core Functions
contract NFTWalletFactory is ERC721, Ownable {
    KernelFactory public immutable _kernelFactory;
    address public immutable nftBoundValidator;
    
    function mintWallet(address to) external payable 
        returns (uint256 tokenId, address wallet) {
        if (msg.value < mintingFee) revert InsufficientFee();
        
        tokenId = _nextTokenId++;
        _mint(to, tokenId);
        
        // Create ValidationId for NFTBoundValidator
        ValidationId rootValidator = ValidatorLib.validatorToIdentifier(
            NFTBoundValidator(nftBoundValidator)
        );
        
        // Deploy deterministic wallet
        bytes32 salt = keccak256(abi.encodePacked(tokenId, address(this)));
        wallet = _kernelFactory.createAccount(initData, salt);
        
        tokenIdToWallet[tokenId] = wallet;
        emit WalletCreated(tokenId, wallet, to);
    }
}`,

  "svg-metadata": `// On-Chain SVG Generation
function generateSVG(uint256 tokenId) internal view returns (string memory) {
    address wallet = getWalletAddress(tokenId);
    uint256 balance = wallet.balance;
    
    return string(abi.encodePacked(
        '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
        generateDefs(balance, tokenId),
        generateBackground(),
        generateGlassCard(),
        generateDynamicElement(balance), // Balance-based animations
        generateText(tokenId, truncatedWallet, balance),
        generateDecorations(balance, tokenId),
        '</svg>'
    ));
}

// Dynamic elements based on wallet balance
function generateDynamicElement(uint256 balance) internal pure returns (string memory) {
    if (balance == 0) {
        // Dormant crystal (static)
        return '<polygon points="200,160 220,180 200,200 180,180" fill="url(#activityGradient)"/>';
    } else if (balance <= 0.1 ether) {
        // Pulsing orb with animations
        return '<circle cx="200" cy="180" r="18" fill="url(#activityGradient)">
                  <animate attributeName="r" values="18;25;18" dur="2s" repeatCount="indefinite"/>
                </circle>';
    }
    // ... more balance tiers
}`,

  "visual-specifications": `// Visual Design System
const VISUAL_SPECS = {
  canvas: { width: 400, height: 400 },
  glassCard: { x: 30, y: 30, width: 340, height: 340, rx: 20 },
  
  balanceTiers: {
    dormant: { balance: 0, element: 'crystal', color: '#4F46E5' },
    low: { balance: '≤0.1 ETH', element: 'pulsing_orb', color: '#7C3AED' },
    medium: { balance: '≤1 ETH', element: 'rotating_nexus', color: '#DC2626' },
    high: { balance: '>1 ETH', element: 'energized_portal', color: '#F59E0B' }
  },
  
  rarityFilters: {
    legendary: { tokenId: '≤100', filter: 'golden', effect: 'shimmer' },
    epic: { tokenId: '≤1000', filter: 'silver', effect: 'glow' },
    rare: { condition: 'special_patterns', effect: 'particles' }
  },
  
  animations: {
    gradient: { duration: '10s', type: 'color_cycle' },
    activity: { duration: '2-4s', type: 'balance_based' },
    particles: { condition: 'high_value_or_special', paths: 'orbital' }
  }
};`,

  "kernel-integration": `// Kernel v3.3 Integration
import { KernelFactory } from "kernel/src/factory/KernelFactory.sol";
import { NFTBoundValidator } from "./NFTBoundValidator.sol";

// Initialize with Kernel infrastructure
constructor(
    KernelFactory kernelFactory_,
    address _nftBoundValidator,
    string memory name_,
    string memory symbol_
) {
    _kernelFactory = kernelFactory_;
    nftBoundValidator = _nftBoundValidator;
}

// Deterministic wallet address calculation
function getWalletAddress(uint256 tokenId) public view returns (address) {
    ValidationId rootValidator = ValidatorLib.validatorToIdentifier(
        NFTBoundValidator(nftBoundValidator)
    );
    
    bytes memory initData = abi.encodeWithSignature(
        "initialize(bytes21,address,bytes,bytes,bytes[])",
        rootValidator,
        IHook(HOOK_MODULE_NOT_INSTALLED),
        abi.encode(tokenId), // Validator data
        "",
        new bytes[](0)
    );
    
    bytes32 salt = keccak256(abi.encodePacked(tokenId, address(this)));
    return _kernelFactory.getAddress(initData, salt);
}`,

  sdk: `// NBA SDK with Contract Compatibility
import { NBAClient, generateContractCompatibleSVG } from '@nft-bsa/sdk';

const client = new NBAClient({
  factoryAddress: '0x...',
  kernelFactory: '0x...',
  nftBoundValidator: '0x...',
  chain: base,
});

// Mint NFT-bound wallet
const { tokenId, walletAddress } = await client.mintWallet(userAddress, {
  value: parseEther('0.01') // Minting fee
});

// Generate contract-compatible SVG preview
const walletData = await client.getWalletData(tokenId);
const svg = generateContractCompatibleSVG(walletData, {
  animations: true,
  variant: 'full'
});

// The SVG matches exactly what the contract generates
console.log('Contract SVG matches:', svg === contractGeneratedSVG);`,

  integration: `// Integration with Existing Infrastructure
import { createPublicClient, createWalletClient } from 'viem';
import { base } from 'viem/chains';

// Setup clients
const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

const walletClient = createWalletClient({
  chain: base,
  transport: custom(window.ethereum)
});

// Deploy factory contract
const factory = getContract({
  address: FACTORY_ADDRESS,
  abi: NFTWalletFactoryABI,
  publicClient,
  walletClient
});

// Mint wallet with proper fee
const { request } = await factory.simulate.mintWallet([userAddress], {
  value: parseEther('0.01')
});

const hash = await walletClient.writeContract(request);
const receipt = await publicClient.waitForTransactionReceipt({ hash });

// Extract tokenId and wallet address from events
const mintEvent = receipt.logs.find(log => 
  log.topics[0] === keccak256('WalletCreated(uint256,address,address)')
);`,

  api: `// API Endpoints for NBA Management
// GET /api/nft/{tokenId}/metadata - Contract-compatible metadata
{
  "name": "NBA #0001",
  "description": "This NFT represents ownership of an NFT-Bound Smart Account...",
  "image": "data:image/svg+xml;base64,PHN2Zy4uLg==",
  "external_url": "https://nft-bsa.xyz/account/0001",
  "background_color": "667eea",
  "attributes": [
    { "trait_type": "Wallet Address", "value": "0x..." },
    { "trait_type": "ETH Balance", "value": 2450, "display_type": "number" },
    { "trait_type": "Kernel Version", "value": "v3.3" },
    { "trait_type": "Validator", "value": "NFT-Bound" }
  ]
}

// POST /api/wallet/mint - Mint new NFT wallet
{
  "to": "0x...",
  "mintingFee": "0.01",
  "gasEstimate": "0.002"
}

// GET /api/wallet/{tokenId}/balance - Real-time balance
{
  "tokenId": "0001",
  "walletAddress": "0x...",
  "balance": "2.45",
  "balanceWei": "2450000000000000000",
  "lastUpdated": "2024-06-15T10:30:00Z"
}`,
}

export default function DocsPage() {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/60">
            NFT-BSA Documentation
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Complete technical documentation for the NFT-Bound Smart Account standard with on-chain SVG generation.
            Built on Kernel v3.3 with sophisticated visual representations and deterministic wallet deployment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 sticky top-32">
              <h3 className="font-semibold text-white/90 mb-4">Contents</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg text-white/70 hover:text-white/90 hover:bg-white/5 transition-colors"
                  >
                    {section.icon}
                    <span className="text-sm">{section.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {sections.map((section, index) => (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-panel p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  {section.icon}
                  <h2 className="text-2xl font-bold text-white/90">{section.title}</h2>
                </div>
                <p className="text-white/70 mb-6 leading-relaxed">{section.content}</p>

                {/* Code Examples */}
                {codeExamples[section.id as keyof typeof codeExamples] && (
                  <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                    <pre className="text-sm text-white/80 overflow-x-auto">
                      <code>{codeExamples[section.id as keyof typeof codeExamples]}</code>
                    </pre>
                  </div>
                )}
              </motion.section>
            ))}

            {/* Contract Implementation Guide */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="glass-panel p-8"
            >
              <h2 className="text-2xl font-bold text-white/90 mb-4">Contract Implementation Details</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white/90 mb-2">Key Contract Features</h3>
                  <ul className="list-disc list-inside text-white/70 space-y-1">
                    <li>
                      <strong>Deterministic Deployment:</strong> Wallets deployed to predictable addresses using CREATE2
                    </li>
                    <li>
                      <strong>On-Chain SVG Generation:</strong> Complete SVG metadata generated and stored on-chain
                    </li>
                    <li>
                      <strong>Balance-Based Visuals:</strong> Dynamic elements that change based on wallet ETH balance
                    </li>
                    <li>
                      <strong>Rarity System:</strong> Special visual effects for early token IDs and special patterns
                    </li>
                    <li>
                      <strong>Kernel v3.3 Integration:</strong> Full compatibility with ZeroDev's modular account system
                    </li>
                    <li>
                      <strong>Gas Optimization:</strong> Efficient SVG generation with minimal gas usage
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white/90 mb-2">Visual Tier System</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-semibold text-white/90 mb-2">Balance Tiers</h4>
                      <ul className="text-sm text-white/70 space-y-1">
                        <li>
                          <strong>Dormant (0 ETH):</strong> Static crystal
                        </li>
                        <li>
                          <strong>Low (&lt;=0.1 ETH):</strong> Pulsing orb
                        </li>
                        <li>
                          <strong>Medium (&lt;=1 ETH):</strong> Rotating nexus
                        </li>
                        <li>
                          <strong>High (&gt;1 ETH):</strong> Energized portal
                        </li>
                      </ul>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-semibold text-white/90 mb-2">Rarity Tiers</h4>
                      <ul className="text-sm text-white/70 space-y-1">
                        <li>
                          <strong>Legendary (&lt;=100):</strong> Golden filter
                        </li>
                        <li>
                          <strong>Epic (&lt;=1000):</strong> Silver filter
                        </li>
                        <li>
                          <strong>Rare (Special IDs):</strong> Particle effects
                        </li>
                        <li>
                          <strong>Common (Others):</strong> Standard appearance
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white/90 mb-2">Integration Considerations</h3>
                  <ul className="list-disc list-inside text-white/70 space-y-1">
                    <li>
                      <strong>Minting Fee:</strong> Configurable fee (default 0.01 ETH) to cover deployment costs
                    </li>
                    <li>
                      <strong>Deterministic Addresses:</strong> Wallet addresses can be computed before minting
                    </li>
                    <li>
                      <strong>Validator Integration:</strong> NFTBoundValidator ensures only NFT owner controls wallet
                    </li>
                    <li>
                      <strong>Metadata Updates:</strong> SVG automatically reflects current wallet balance
                    </li>
                    <li>
                      <strong>Cross-platform Compatibility:</strong> Standard ERC-721 with enhanced metadata
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Getting Started Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="glass-panel p-8"
            >
              <h2 className="text-2xl font-bold text-white/90 mb-4">Getting Started</h2>
              <div className="space-y-4 text-white/70">
                <div className="flex items-start gap-3">
                  <span className="bg-[var(--gradient-start)] text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                    1
                  </span>
                  <div>
                    <h3 className="font-semibold text-white/90">Deploy Factory Contract</h3>
                    <p>Deploy NFTWalletFactory with KernelFactory and NFTBoundValidator addresses</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-[var(--gradient-start)] text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                    2
                  </span>
                  <div>
                    <h3 className="font-semibold text-white/90">Configure Frontend</h3>
                    <p>Set up contract-compatible SVG generation and wallet interaction</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-[var(--gradient-start)] text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                    3
                  </span>
                  <div>
                    <h3 className="font-semibold text-white/90">Start Minting</h3>
                    <p>Enable users to mint NFT-bound wallets with dynamic visual representations</p>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  )
}
