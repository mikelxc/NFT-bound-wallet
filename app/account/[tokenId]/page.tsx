"use client"

import { useParams } from "next/navigation" // For App Router
import { useEffect, useState } from "react"
import NbaCard from "@/components/nba-card"
import Button from "@/components/button"
import { ArrowUpRight, ArrowDownLeft, Repeat, Send, Download } from "lucide-react"
import Loader from "@/components/loader" // Declare Loader variable

// Mock data structure for an account
interface AccountData {
  tokenId: string
  ethBalance: string
  transactionCount: number
  nftCount: number
  walletAddress: string
  assets: Asset[]
  activity: ActivityItem[]
}

interface Asset {
  id: string
  name: string
  symbol: string
  balance: string
  usdValue: string
  iconUrl?: string // Optional: URL for token icon
}

interface ActivityItem {
  id: string
  type: "send" | "receive" | "contract_interaction"
  date: string
  amount?: string
  targetAddress?: string
  status: "confirmed" | "pending" | "failed"
}

// Mock function to fetch account data
const fetchAccountData = async (tokenId: string): Promise<AccountData | null> => {
  console.log("Fetching data for token ID:", tokenId)
  // TODO: Implement actual data fetching from blockchain/backend
  // For now, return mock data
  if (tokenId) {
    return {
      tokenId,
      ethBalance: (Math.random() * 10).toFixed(2),
      transactionCount: Math.floor(Math.random() * 200),
      nftCount: Math.floor(Math.random() * 10),
      walletAddress: `0x${tokenId.padStart(10, "0")}...${Math.random().toString(16).substring(2, 6)}`,
      assets: [
        {
          id: "eth",
          name: "Ethereum",
          symbol: "ETH",
          balance: (Math.random() * 10).toFixed(2),
          usdValue: (Math.random() * 10 * 3000).toFixed(2),
          iconUrl: "/ethereum-logo.png",
        },
        {
          id: "usdc",
          name: "USD Coin",
          symbol: "USDC",
          balance: (Math.random() * 5000).toFixed(2),
          usdValue: (Math.random() * 5000).toFixed(2),
          iconUrl: "/usdc-logo.png",
        },
      ],
      activity: [
        {
          id: "1",
          type: "receive",
          date: "2024-06-15",
          amount: "1.5 ETH",
          targetAddress: "0xSENDER...",
          status: "confirmed",
        },
        {
          id: "2",
          type: "send",
          date: "2024-06-14",
          amount: "0.2 ETH",
          targetAddress: "0xRECIPIENT...",
          status: "confirmed",
        },
        {
          id: "3",
          type: "contract_interaction",
          date: "2024-06-13",
          targetAddress: "0xCONTRACT...",
          status: "confirmed",
        },
      ],
    }
  }
  return null
}

export default function AccountPage() {
  const params = useParams()
  const tokenId = (params?.tokenId as string) || "default" // Handle potential array or undefined

  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"assets" | "activity" | "nfts" | "trade">("assets")

  useEffect(() => {
    if (tokenId) {
      setIsLoading(true)
      fetchAccountData(tokenId)
        .then((data) => {
          setAccountData(data)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching account data:", error)
          setIsLoading(false)
          // TODO: Handle error state in UI
        })
    }
  }, [tokenId])

  if (isLoading) {
    // TODO: Implement Gradient Skeleton Screen
    return (
      <div className="min-h-screen flex items-center justify-center text-white/80">
        <Loader className="w-12 h-12 animate-spin text-[var(--gradient-start)]" />
        <p className="ml-4">Loading Account Data...</p>
      </div>
    )
  }

  if (!accountData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center text-white/80 p-4">
        <h1 className="text-2xl font-bold mb-4">Account Not Found</h1>
        <p className="mb-8">Could not load data for token ID: {tokenId}.</p>
        <Button onClick={() => (window.location.href = "/")}>Go to Homepage</Button>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "assets":
        return (
          <div className="space-y-3">
            {accountData.assets.length > 0 ? (
              accountData.assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={asset.iconUrl || `/placeholder.svg?width=32&height=32&query=${asset.symbol}`}
                      alt={asset.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-white/90">
                        {asset.name} ({asset.symbol})
                      </p>
                      <p className="text-xs text-white/60">${asset.usdValue}</p>
                    </div>
                  </div>
                  <p className="font-mono text-white/80">
                    {asset.balance} {asset.symbol}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-white/50 py-8">No assets found in this account.</p>
            )}
            {/* TODO: Add "Add Token" functionality */}
          </div>
        )
      case "activity":
        return (
          <div className="space-y-3">
            {accountData.activity.length > 0 ? (
              accountData.activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {item.type === "send" && <ArrowUpRight className="w-5 h-5 text-red-500" />}
                    {item.type === "receive" && <ArrowDownLeft className="w-5 h-5 text-green-500" />}
                    {item.type === "contract_interaction" && <Repeat className="w-5 h-5 text-blue-500" />}
                    <div>
                      <p className="font-semibold text-white/90 capitalize">{item.type.replace("_", " ")}</p>
                      <p className="text-xs text-white/60">{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {item.amount && <p className="font-mono text-white/80">{item.amount}</p>}
                    <p
                      className={`text-xs ${item.status === "confirmed" ? "text-green-500" : item.status === "pending" ? "text-amber-500" : "text-red-500"}`}
                    >
                      {item.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-white/50 py-8">No recent activity.</p>
            )}
          </div>
        )
      case "nfts":
        // TODO: Implement NFT display
        return <p className="text-center text-white/50 py-8">NFTs display coming soon.</p>
      case "trade":
        return (
          <div className="text-center p-6 bg-white/5 rounded-lg">
            <h3 className="text-xl font-semibold text-white/90 mb-4">Trade Your NFT-Bound Account</h3>
            <p className="text-white/70 mb-2">
              ⚠️ <span className="font-bold">Important:</span> Trading this NFT transfers ownership of the entire smart
              account and all its contents.
            </p>
            <div className="my-4 p-4 bg-black/20 rounded-md text-left text-sm">
              <p className="font-semibold text-white/80">Account Contents:</p>
              <ul className="list-disc list-inside text-white/60">
                <li>{accountData.ethBalance} ETH</li>
                <li>{accountData.nftCount} other NFTs</li>
                {/* TODO: List other significant assets */}
                <li>Total Estimated Value: {/* TODO: Calculate total value */} ~$XXXX</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {/* TODO: Implement actual marketplace linking logic */}
              <Button variant="secondary" onClick={() => alert("Link to OpenSea")}>
                List on OpenSea
              </Button>
              <Button variant="secondary" onClick={() => alert("Link to Blur")}>
                View on Blur
              </Button>
              <Button variant="secondary" onClick={() => alert("Transfer NFT")}>
                Direct Transfer NFT
              </Button>
              <Button variant="secondary" onClick={() => alert("Bridge to L2")}>
                Bridge Account to L2
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 pt-24 md:pt-32">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: NBA Card and Actions */}
        <div className="lg:col-span-1 space-y-6">
          <NbaCard /> {/* TODO: Pass actual accountData to NbaCard to make it dynamic */}
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => alert("Send Action")}>
              <Send className="mr-2 h-4 w-4" /> Send
            </Button>
            <Button variant="secondary" onClick={() => alert("Receive Action")}>
              <Download className="mr-2 h-4 w-4" /> Receive
            </Button>
          </div>
          {/* TODO: Add more actions like "Buy Crypto", "Swap Tokens" if needed */}
        </div>

        {/* Right Column: Tabs and Content */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex border-b border-white/10 mb-6">
            {["assets", "activity", "nfts", "trade"].map((tabName) => (
              <button
                key={tabName}
                onClick={() => setActiveTab(tabName as any)}
                className={`px-4 py-3 text-sm font-medium transition-colors
                  ${
                    activeTab === tabName
                      ? "text-[var(--gradient-start)] border-b-2 border-[var(--gradient-start)]"
                      : "text-white/60 hover:text-white/90"
                  }`}
              >
                {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
              </button>
            ))}
          </div>
          <div>{renderTabContent()}</div>
        </div>
      </div>
    </div>
  )
}
