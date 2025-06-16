"use client"

import { motion } from "framer-motion"
import Button from "./button"
import NbaCard from "./nba-card" // Re-use the NBA card for the demo
import Link from "next/link"

const sectionVariants = {
  offscreen: { opacity: 0, y: 50 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      bounce: 0.3,
      duration: 0.8,
    },
  },
}

export default function InteractiveDemo() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <motion.div
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          className="flex flex-col items-center text-center gap-6 mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/60">
            Experience It Live
          </h2>
          <p className="max-w-[700px] text-white/70 md:text-lg">
            Try the NFT-BSA standard now. Interact with a demo account and see the magic for yourself. No wallet needed
            for this preview.
          </p>
        </motion.div>

        <motion.div
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants} // Re-use variants
          className="glass-panel p-8 md:p-12 rounded-3xl"
        >
          <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
            <div className="lg:w-1/2 flex justify-center">
              {/* TODO: Add more dynamic elements to this card for demo if needed */}
              <NbaCard />
            </div>
            <div className="lg:w-1/2 flex flex-col items-center lg:items-start gap-6 text-center lg:text-left">
              <h3 className="text-2xl font-semibold text-white/90">Interactive Playground</h3>
              <p className="text-white/60">
                This is a sandboxed environment. Click around, simulate transactions, and see how the NFT card would
                react.
              </p>
              {/* TODO: Implement actual interactive elements for the demo */}
              <div className="space-y-4 w-full max-w-sm">
                <Button className="w-full">Simulate Transaction</Button>
                <Link href="/account">
                  <Button variant="secondary" className="w-full">
                    View Gallery
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-white/40">
                Full functionality requires wallet connection on the Mint or Wallet pages.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
