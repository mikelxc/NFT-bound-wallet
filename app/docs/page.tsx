"use client"

import { motion } from "framer-motion"
import { Code, Layers, Zap, Database, Globe, Shield } from "lucide-react"

const sections = [
  {
    id: "overview",
    title: "Technical Overview",
    icon: <Globe className="w-6 h-6" />,
    content: `The NFT-Bound Smart Account (NFT-BSA) standard combines ERC-721 NFTs with ERC-7579 modular smart accounts, creating a revolutionary approach where your wallet IS the NFT.`,
  },
  {
    id: "architecture",
    title: "Architecture",
    icon: <Layers className="w-6 h-6" />,
    content: `Built on Next.js 14 with App Router, using Tailwind CSS + Framer Motion for UI, Zustand + TanStack Query for state management, Reown WalletKit for wallet connection, Permissionless.js + Pimlico for Account Abstraction, and Viem for blockchain interactions.`,
  },
  {
    id: "sdk",
    title: "NBA SDK",
    icon: <Code className="w-6 h-6" />,
    content: `The core SDK provides a clean abstraction layer with NBAClient for managing accounts and NFTBoundAccount instances for wallet operations.`,
  },
  {
    id: "integration",
    title: "Integration",
    icon: <Zap className="w-6 h-6" />,
    content: `Seamless integration with Reown WalletKit for wallet connections, Permissionless.js + Pimlico for gasless transactions, and Viem for type-safe contract interactions.`,
  },
  {
    id: "contracts",
    title: "Smart Contracts",
    icon: <Shield className="w-6 h-6" />,
    content: `Factory contract for minting NFT-bound accounts, Kernel v3.3 implementation for smart account functionality, and ERC-7579 validators for modular security.`,
  },
  {
    id: "api",
    title: "API Reference",
    icon: <Database className="w-6 h-6" />,
    content: `RESTful APIs for metadata generation, analytics tracking, and account management with proper caching and performance optimization.`,
  },
]

const codeExamples = {
  sdk: `// NBA SDK Usage
import { NBAClient } from '@nft-bsa/sdk';

const client = new NBAClient({
  chain: base,
  factoryAddress: '0x...',
  bundlerUrl: 'https://api.pimlico.io/v2/bundler',
});

// Mint a new NFT-bound account
const account = await client.mintAccount(userAddress);

// Send transaction through the smart account
const hash = await account.sendTransaction({
  to: '0x...',
  value: parseEther('0.1'),
});`,

  integration: `// Wallet Integration
import { createAppKit } from '@reown/appkit/react';

const appKit = createAppKit({
  projectId: 'your-project-id',
  metadata: {
    name: 'NFT-Bound Smart Accounts',
    description: 'Trade Your Wallet as an NFT',
  },
});

// Connect and create smart account
const smartAccount = await createNBAClient(nftAccount, signer);`,

  contract: `// Contract Interaction
const { tokenId, walletAddress } = await mintNFTBoundAccount(
  userAddress,
  parseEther('0.01') // Minting fee
);

// The NFT now controls the smart wallet
console.log(\`NBA #\${tokenId} controls \${walletAddress}\`);`,
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
            Complete technical documentation for the NFT-Bound Smart Account standard. Learn how to integrate, deploy,
            and extend this revolutionary wallet technology.
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

            {/* Getting Started Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-panel p-8"
            >
              <h2 className="text-2xl font-bold text-white/90 mb-4">Getting Started</h2>
              <div className="space-y-4 text-white/70">
                <div className="flex items-start gap-3">
                  <span className="bg-[var(--gradient-start)] text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                    1
                  </span>
                  <div>
                    <h3 className="font-semibold text-white/90">Install the SDK</h3>
                    <p>npm install @nft-bsa/sdk viem @reown/appkit</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-[var(--gradient-start)] text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                    2
                  </span>
                  <div>
                    <h3 className="font-semibold text-white/90">Configure Your App</h3>
                    <p>Set up wallet connection and NBA client with your contract addresses</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-[var(--gradient-start)] text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                    3
                  </span>
                  <div>
                    <h3 className="font-semibold text-white/90">Start Building</h3>
                    <p>Mint NFT-bound accounts and enable wallet trading functionality</p>
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
