import NbaCard from "@/components/nba-card"
import Button from "@/components/button"
import { ArrowRight, PlayCircle } from "lucide-react"
import HowItWorks from "@/components/how-it-works"
import TechnicalShowcase from "@/components/technical-showcase"
import InteractiveDemo from "@/components/interactive-demo"
import Link from "next/link"

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full min-h-screen flex items-center justify-center pt-32 pb-16 md:pt-24 md:pb-12">
        <div className="container px-4 md:px-6 text-center flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white/90 to-white/40">
              Your Smart Account IS an NFT
            </h1>
            <p className="max-w-[700px] text-white/70 md:text-xl">
              Trade wallets like never before. Each NFT controls a complete smart account — transfer the NFT, transfer
              everything inside.
            </p>
          </div>

          <NbaCard />

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/mint">
              <Button>
                Mint Account NFT <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/account">
              <Button variant="secondary">
                <PlayCircle className="mr-2 h-4 w-4" /> View Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Technical Showcase Section */}
      <TechnicalShowcase />

      {/* Interactive Demo Section */}
      <InteractiveDemo />

      {/* Footer Placeholder - Not explicitly in requirements but good practice */}
      <footer className="py-12 text-center text-white/50">
        <p>&copy; {new Date().getFullYear()} NFT-Bound Smart Accounts. All rights reserved.</p>
        {/* TODO: Add social links or other footer content if needed */}
      </footer>
    </>
  )
}
