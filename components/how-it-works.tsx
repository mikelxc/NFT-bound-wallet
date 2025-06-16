"use client"

import { motion } from "framer-motion"
import { Combine, KeyRound, ShoppingCart } from "lucide-react"

const steps = [
  {
    icon: <KeyRound className="w-8 h-8 text-white/80" />,
    title: "1. Mint NFT = Deploy Wallet",
    description:
      "Your journey begins by minting a unique NFT. This action simultaneously deploys a brand new, secure smart account on-chain, forever linked to your NFT.",
  },
  {
    icon: <Combine className="w-8 h-8 text-white/80" />,
    title: "2. NFT Controls Everything Inside",
    description:
      "The NFT is not just a picture; it's the master key. It holds exclusive control over the smart account and all the assets—tokens, and other NFTs—it contains.",
  },
  {
    icon: <ShoppingCart className="w-8 h-8 text-white/80" />,
    title: "3. Trade NFT = Trade Wallet",
    description:
      "Transferring the NFT means transferring the entire wallet. Sell it on any marketplace, and the new owner gets the keys to the kingdom, assets and all.",
  },
]

const cardVariants = {
  offscreen: {
    y: 50,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      bounce: 0.4,
      duration: 0.8,
    },
  },
}

export default function HowItWorks() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <motion.div
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.2 }}
          className="grid gap-8 md:grid-cols-3"
        >
          {steps.map((step, index) => (
            <motion.div key={index} variants={cardVariants} className="glass-panel p-8 flex flex-col items-start gap-4">
              <div className="bg-white/10 p-3 rounded-full">{step.icon}</div>
              <h3 className="text-xl font-bold text-white/90">{step.title}</h3>
              <p className="text-white/70">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
