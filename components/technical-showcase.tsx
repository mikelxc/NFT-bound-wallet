"use client"

import { motion } from "framer-motion"
import { Layers, Cpu, Puzzle, Zap } from "lucide-react"
import TechnicalDiagram from "./technical-diagram"

const features = [
  {
    icon: <Layers className="w-8 h-8 text-[var(--gradient-start)]" />,
    title: "ERC-7579 + ERC-721 Synergy",
    description:
      "Combining the power of modular smart accounts (ERC-7579) with the universal standard for non-fungible tokens (ERC-721).",
  },
  {
    icon: <Cpu className="w-8 h-8 text-[var(--gradient-start)]" />,
    title: "Kernel v3.3 Smart Accounts",
    description:
      "Leveraging the latest advancements in ZeroDev's Kernel for robust, secure, and flexible smart account infrastructure.",
  },
  {
    icon: <Puzzle className="w-8 h-8 text-[var(--gradient-start)]" />,
    title: "Deterministic Deployment",
    description:
      "Wallets are deployed to predictable addresses, enabling powerful pre-computation and integration possibilities.",
  },
  {
    icon: <Zap className="w-8 h-8 text-[var(--gradient-start)]" />,
    title: "On-Chain SVG Metadata",
    description:
      "NFTs feature dynamic, on-chain SVGs that reflect wallet state in real-time, making them truly 'living' assets.",
  },
]

const sectionVariants = {
  offscreen: { opacity: 0, y: 50 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      bounce: 0.3,
      duration: 0.8,
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  offscreen: { opacity: 0, y: 30 },
  onscreen: { opacity: 1, y: 0 },
}

export default function TechnicalShowcase() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-black/20">
      <div className="container px-4 md:px-6">
        <motion.div
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          className="flex flex-col items-center text-center gap-6 mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/60">
            Pioneering Web3 Innovation
          </h2>
          <p className="max-w-[700px] text-white/70 md:text-lg">
            Discover the cutting-edge technologies that make NFT-Bound Smart Accounts the future of digital ownership.
          </p>
        </motion.div>

        <motion.div
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="glass-panel p-6 flex flex-col items-start gap-4 hover:border-[var(--gradient-start)]/50 transition-colors duration-300"
            >
              <div className="bg-white/10 p-3 rounded-lg">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white/90">{feature.title}</h3>
              <p className="text-sm text-white/60">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.2 }}
          variants={itemVariants} // Re-use itemVariants for simplicity
          className="mt-12 text-center"
        >
          <TechnicalDiagram autoPlay={true} showControls={false} />
        </motion.div>
      </div>
    </section>
  )
}
