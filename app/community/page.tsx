"use client"

import { motion } from "framer-motion"
import Button from "@/components/button"
import { Github, Twitter, MessageCircle, Users, ExternalLink, BookOpen } from "lucide-react"

const communityLinks = [
  {
    name: "GitHub",
    description: "Contribute to the NFT-BSA standard and reference implementation",
    icon: <Github className="w-8 h-8" />,
    url: "https://github.com/nft-bsa/standard",
    color: "hover:border-gray-500",
  },
  {
    name: "Discord",
    description: "Join our community for discussions, support, and updates",
    icon: <MessageCircle className="w-8 h-8" />,
    url: "https://discord.gg/nft-bsa",
    color: "hover:border-indigo-500",
  },
  {
    name: "Twitter",
    description: "Follow us for the latest news and announcements",
    icon: <Twitter className="w-8 h-8" />,
    url: "https://twitter.com/nftbsa",
    color: "hover:border-blue-500",
  },
  {
    name: "Forum",
    description: "Technical discussions and governance proposals",
    icon: <Users className="w-8 h-8" />,
    url: "https://forum.nft-bsa.xyz",
    color: "hover:border-green-500",
  },
]

const resources = [
  {
    title: "ERC-7579 Specification",
    description: "Learn about the modular smart account standard",
    url: "https://eips.ethereum.org/EIPS/eip-7579",
  },
  {
    title: "Kernel Documentation",
    description: "ZeroDev's smart account infrastructure",
    url: "https://docs.zerodev.app/",
  },
  {
    title: "Permissionless.js",
    description: "Account abstraction SDK and tools",
    url: "https://docs.pimlico.io/permissionless",
  },
  {
    title: "Reown AppKit",
    description: "Wallet connection and management",
    url: "https://docs.reown.com/appkit/overview",
  },
]

export default function CommunityPage() {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white/90 to-white/60">
            Join the Community
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Be part of the revolution in wallet ownership. Connect with developers, contribute to the standard, and help
            shape the future of NFT-bound accounts.
          </p>
        </motion.div>

        {/* Community Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {communityLinks.map((link, index) => (
            <motion.a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-panel p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${link.color} group`}
            >
              <div className="flex items-start gap-4">
                <div className="text-white/80 group-hover:text-white transition-colors">{link.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-white/90">{link.name}</h3>
                    <ExternalLink className="w-4 h-4 text-white/60" />
                  </div>
                  <p className="text-white/70">{link.description}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Developer Resources */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white/90 mb-8 text-center">Developer Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((resource, index) => (
              <a
                key={resource.title}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel p-4 rounded-lg hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-white/60 group-hover:text-white/80" />
                  <div>
                    <h4 className="font-semibold text-white/90 group-hover:text-white">{resource.title}</h4>
                    <p className="text-sm text-white/60">{resource.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/40 ml-auto" />
                </div>
              </a>
            ))}
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center glass-panel p-8 rounded-2xl"
        >
          <h2 className="text-2xl font-bold text-white/90 mb-4">Ready to Build?</h2>
          <p className="text-white/70 mb-6 max-w-2xl mx-auto">
            Start integrating NFT-Bound Smart Accounts into your application today. Check out our documentation and join
            the community for support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => (window.location.href = "/docs")}>
              <BookOpen className="mr-2 h-4 w-4" />
              Read Documentation
            </Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/mint")}>
              Try the Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
