// Contract addresses and configuration for NFT-Bound Wallet
export const CONTRACTS = {
  // Story Testnet (Chain ID: 1315) - Aeneid
  1315: {
    EntryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    Kernel: "0xAdb7713Ee63Acf1233A67f213CbAc9Ac6A5a8e09",
    KernelFactory: "0xD53A6E3EAbECaDfF73559aa1b7678738a84313ed",
    NFTBoundValidator: "0xAD021b41871D7aC878E7c3C8589B7e8E36C2Ee22",
    NFTWalletFactory: "0x3A1888490fF7A5c0a6c568066A9E636985AEa44c",
  },
} as const;

export const NETWORK_CONFIG = {
  1315: {
    name: "Story Testnet",
    symbol: "IP",
    rpcUrl: "https://story-aeneid.g.alchemy.com/v2/dvKxM8znVv-_uLp2ncQ8Q",
    blockExplorer: "https://aeneid.storyscan.io",
    chainId: 1315,
  },
} as const;

export const NFT_CONFIG = {
  name: "Wallet NFT",
  symbol: "WNFT",
  mintingFee: "0.01", // ETH
} as const;

// Get contract addresses for current chain
export const getContracts = (chainId: keyof typeof CONTRACTS) => {
  return CONTRACTS[chainId];
};

// Get network config for current chain
export const getNetworkConfig = (chainId: keyof typeof NETWORK_CONFIG) => {
  return NETWORK_CONFIG[chainId];
};

// Default chain ID
export const DEFAULT_CHAIN_ID = 1315;