"use client"

import { useParams } from "next/navigation" // For App Router
import { useEffect, useState } from "react"
import NbaCard from "@/components/nba-card"
import Button from "@/components/button"
import { ArrowUpRight, ArrowDownLeft, Repeat, Send, Download, Loader2 } from "lucide-react"
import { createAlchemyClient, getAlchemyRpcUrl } from "@/lib/alchemy-client"
import { createPublicClient, http, getContract } from "viem"
import { createNBAClient } from "@/lib/nba-sdk"
import { CONTRACT_ADDRESSES } from "@/lib/nba-sdk/constants"
import TransactionModal from "@/components/transaction-modal"
import NFTDisplay from "@/components/nft-display"
import { useAccount } from "wagmi"

// Define the chain configuration
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1315")
const RPC_URL = getAlchemyRpcUrl(CHAIN_ID)

console.log("Debug - Chain ID:", CHAIN_ID)
console.log("Debug - RPC URL:", RPC_URL)
console.log("Debug - Factory Address:", CONTRACT_ADDRESSES[CHAIN_ID as keyof typeof CONTRACT_ADDRESSES]?.nftWalletFactory)

// Account data structure
interface AccountData {
  tokenId: string
  ethBalance: string
  transactionCount: number
  nftCount: number
  walletAddress: string
  owner: string
  isDeployed: boolean
  assets: Asset[]
  activity: ActivityItem[]
}

interface NFTPortfolioData {
  nfts: any[]
  totalCount: number
  pageKey?: string
}

interface Asset {
  id: string
  name: string
  symbol: string
  balance: string
  usdValue: string
  iconUrl?: string
}

interface ActivityItem {
  id: string
  type: "send" | "receive" | "contract_interaction"
  date: string
  amount?: string
  targetAddress?: string
  status: "confirmed" | "pending" | "failed"
  hash?: string
}

// Real function to fetch account data from blockchain using enhanced NBA SDK
const fetchAccountData = async (tokenId: string): Promise<AccountData | null> => {
  console.log("Fetching data for token ID:", tokenId)
  
  try {
    // Create clients
    const publicClient = createPublicClient({
      transport: http(RPC_URL),
    })

    // Use environment variables for contract addresses, with fallback to constants
    const factoryAddress = CONTRACT_ADDRESSES[CHAIN_ID as keyof typeof CONTRACT_ADDRESSES]?.nftWalletFactory as Address
    const entryPoint = CONTRACT_ADDRESSES[CHAIN_ID as keyof typeof CONTRACT_ADDRESSES]?.entryPoint as Address

    console.log("Debug - Using factory address:", factoryAddress)
    console.log("Debug - Using entry point:", entryPoint)

    // Test basic contract connectivity
    try {
      const testContract = getContract({
        address: factoryAddress,
        abi: [{
          inputs: [],
          name: "name",
          outputs: [{ name: "", type: "string" }],
          stateMutability: "view",
          type: "function"
        }],
        client: publicClient,
      })
      const contractName = await testContract.read.name()
      console.log("Debug - Contract name:", contractName)
    } catch (contractError) {
      console.error("Debug - Contract connection failed:", contractError)
    }

    const nbaClient = createNBAClient(
      {
        chainId: CHAIN_ID,
        factoryAddress,
        entryPoint,
      },
      publicClient
    )

    // Get enhanced wallet metadata with Alchemy integration
    const tokenIdBigInt = BigInt(parseInt(tokenId, 10))
    console.log("Debug - Token ID BigInt:", tokenIdBigInt)
    
    // First check if the account exists
    const account = await nbaClient.getAccount(tokenIdBigInt)
    console.log("Debug - Account data:", account)
    
    if (!account) {
      console.log("Debug - Account not found for token ID:", tokenId)
      return null
    }

    const enhancedMetadata = await nbaClient.getEnhancedWalletMetadata(tokenIdBigInt)
    console.log("Debug - Enhanced metadata:", enhancedMetadata)
    
    if (!enhancedMetadata) {
      console.log("Debug - Enhanced metadata not found for token ID:", tokenId)
      return null
    }

    // Convert enhanced metadata to AccountData format
    const assets: Asset[] = enhancedMetadata.tokenBalances.map(token => ({
      id: token.contractAddress,
      name: token.name,
      symbol: token.symbol,
      balance: token.balance,
      usdValue: "0", // Would need price API for real USD value
      iconUrl: token.logo || (token.symbol === 'IP' ? "/ip-logo.png" : "/placeholder.svg"),
    }))

    const activity: ActivityItem[] = enhancedMetadata.transactionHistory.map(tx => ({
      id: tx.hash,
      type: tx.type === 'contract' ? 'contract_interaction' : tx.type,
      date: new Date(tx.timestamp).toISOString().split('T')[0],
      amount: `${tx.value} ${tx.asset}`,
      targetAddress: tx.type === 'send' ? tx.to : tx.from,
      status: tx.status === 'success' ? 'confirmed' : 'failed',
      hash: tx.hash,
    }))

    return {
      tokenId,
      ethBalance: enhancedMetadata.balance,
      transactionCount: enhancedMetadata.transactionCount,
      nftCount: enhancedMetadata.nftCount,
      walletAddress: enhancedMetadata.walletAddress,
      owner: enhancedMetadata.owner,
      isDeployed: enhancedMetadata.isDeployed,
      assets,
      activity,
    }
  } catch (error) {
    console.error("Error fetching account data:", error)
    return null
  }
}

export default function AccountPage() {
  const params = useParams()
  const tokenId = (params?.tokenId as string) || "default" // Handle potential array or undefined
  const { address: connectedAddress } = useAccount()

  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"assets" | "activity" | "nfts" | "trade">("assets")
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<string>("")

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

  // Handle transaction sending
  const handleSendTransaction = async (transaction: {
    to: `0x${string}`
    value?: bigint
    data?: `0x${string}`
  }) => {
    console.log("Received transaction:", transaction);
    console.log("Transaction value:", transaction.value);
    console.log("Transaction value type:", typeof transaction.value);
    if (!accountData || !connectedAddress) {
      throw new Error("Not connected or account data not loaded")
    }

    // Check if connected wallet is the owner
    if (connectedAddress.toLowerCase() !== accountData.owner.toLowerCase()) {
      throw new Error("Only the NBA owner can send transactions")
    }

    try {
      setTransactionStatus("Initializing smart account...")

      // Create public client with chain
      const { storyAeneid } = await import("@reown/appkit/networks")
      const publicClient = createPublicClient({
        chain: storyAeneid,
        transport: http(RPC_URL),
      })

      // Get wallet client from wagmi (this is the owner wallet)
      const { getWalletClient } = await import("wagmi/actions")
      const { wagmiAdapter } = await import("@/lib/wallet/config")
      const ownerWalletClient = await getWalletClient(wagmiAdapter.wagmiConfig, {
        account: connectedAddress
      })

      if (!ownerWalletClient || !ownerWalletClient.account) {
        throw new Error("Owner wallet not connected. Please make sure your wallet is connected.")
      }

      console.log("Owner wallet account:", ownerWalletClient.account.address)

      setTransactionStatus("Creating smart account client...")

      // Import smart account utilities
      const { createSmartAccountConfig, createNBASmartAccountClient } = await import("@/lib/smart-account/client")
      
      // Create smart account config
      const smartAccountConfig = createSmartAccountConfig(CHAIN_ID)
      
      // Create smart account client for the NBA wallet address
      const smartAccountClient = await createNBASmartAccountClient(
        smartAccountConfig,
        accountData.walletAddress as `0x${string}`,
        ownerWalletClient,
        publicClient
      )

      setTransactionStatus("Preparing transaction...")

      // Send transaction using smart account client (uses standard viem interface)
      const hash = await smartAccountClient.sendTransaction({
        to: transaction.to,
        value: transaction.value || 0n,
        data: transaction.data || "0x",
      })

      setTransactionStatus("Transaction submitted! Waiting for confirmation...")

      // Wait for the transaction to be included in a block using public client
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      })

      setTransactionStatus("Transaction confirmed!")

      // Refresh account data after successful transaction
      setTimeout(() => {
        fetchAccountData(tokenId).then(setAccountData)
      }, 3000)

      return hash
    } catch (error) {
      console.error("Transaction failed:", error)
      setTransactionStatus("Transaction failed")
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/80">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--gradient-start)]" />
        <p className="ml-4">Loading Account Data...</p>
      </div>
    )
  }

  if (!accountData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center text-white/80 p-4">
        <h1 className="text-2xl font-bold mb-4">NBA Wallet Not Found</h1>
        <p className="mb-4">Token ID {tokenId} doesn't exist or hasn't been minted yet.</p>
        <p className="mb-8 text-white/60">
          This could mean the NFT-Bound Account hasn't been created, or the token ID is invalid.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => (window.location.href = "/account")}>
            View Gallery
          </Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/mint")}>
            Mint NBA
          </Button>
        </div>
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
                      {item.targetAddress && (
                        <p className="text-xs text-white/50 font-mono">
                          {item.type === 'send' ? 'To: ' : 'From: '}{item.targetAddress.slice(0, 10)}...{item.targetAddress.slice(-4)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {item.amount && <p className="font-mono text-white/80">{item.amount}</p>}
                    <p
                      className={`text-xs ${item.status === "confirmed" ? "text-green-500" : item.status === "pending" ? "text-amber-500" : "text-red-500"}`}
                    >
                      {item.status}
                    </p>
                    {item.hash && (
                      <button
                        onClick={() => window.open(`https://story-aeneid.explorer.io/tx/${item.hash}`, '_blank')}
                        className="text-xs text-[var(--gradient-start)] hover:text-white/80 transition-colors"
                      >
                        View tx
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-white/50 py-8">
                {accountData.isDeployed ? "No recent activity." : "No activity yet. Wallet will show transactions after deployment."}
              </p>
            )}
          </div>
        )
      case "nfts":
        return (
          <div className="space-y-6">
            {/* NFT Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-white/90">{accountData.nftCount}</div>
                <div className="text-xs text-white/60">Total NFTs</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-white/90">-</div>
                <div className="text-xs text-white/60">Collections</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-white/90">-</div>
                <div className="text-xs text-white/60">Est. Value</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-white/90">
                  {accountData.isDeployed ? "Active" : "Pending"}
                </div>
                <div className="text-xs text-white/60">Status</div>
              </div>
            </div>

            {/* NFT Collection */}
            <NFTDisplay walletAddress={accountData.walletAddress} />
          </div>
        )
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
                <li>{accountData.assets.length - 1} token types</li>
                <li>{accountData.nftCount} NFTs</li>
                <li>{accountData.transactionCount} transaction history</li>
                <li>Deployment Status: {accountData.isDeployed ? 'Active' : 'Not Deployed'}</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <Button 
                variant="secondary" 
                onClick={() => alert("Marketplace integration coming soon")}
                disabled
              >
                List on OpenSea
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => alert("Marketplace integration coming soon")}
                disabled
              >
                View on Blur
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => alert("Direct transfer integration coming soon")}
                disabled
              >
                Direct Transfer NFT
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => alert("Bridge integration coming soon")}
                disabled
              >
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
          <NbaCard
            tokenId={accountData.tokenId}
            walletAddress={accountData.walletAddress}
            ethBalance={accountData.ethBalance}
            transactionCount={accountData.transactionCount}
            nftCount={accountData.nftCount}
            isActive={accountData.isDeployed}
            variant="detailed"
          />
          
          {/* Deployment Status */}
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${accountData.isDeployed ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-white/90 font-medium">
                {accountData.isDeployed ? 'Wallet Deployed' : 'Wallet Not Deployed'}
              </span>
            </div>
            <p className="text-xs text-white/60">
              {accountData.isDeployed 
                ? 'This wallet is active and has been deployed on-chain'
                : 'This wallet exists as an NFT but hasn\'t been deployed yet. It will be deployed on first transaction.'
              }
            </p>
          </div>

          {/* Owner Info */}
          <div className="glass-panel p-4">
            <h3 className="text-white/90 font-medium mb-2">Owner</h3>
            <p className="font-mono text-sm text-white/70 break-all">{accountData.owner}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => setIsTransactionModalOpen(true)} 
              disabled={!accountData.isDeployed || !connectedAddress || connectedAddress.toLowerCase() !== accountData.owner.toLowerCase()}
            >
              <Send className="mr-2 h-4 w-4" /> Send
            </Button>
            <Button variant="secondary" onClick={() => alert("Show receive address")}>
              <Download className="mr-2 h-4 w-4" /> Receive
            </Button>
          </div>
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

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleSendTransaction}
        walletAddress={accountData.walletAddress}
        balance={accountData.ethBalance}
      />
    </div>
  )
}
