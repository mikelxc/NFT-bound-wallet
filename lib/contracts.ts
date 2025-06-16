// Contract addresses and configuration for NFT-Bound Wallet
export const CONTRACTS = {
  // Story Testnet (Chain ID: 1315) - Aeneid
  1315: {
    EntryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
    Kernel: "0xFBA450Ca1fAd02E47f30e4006893545789087a8C",
    KernelFactory: "0xc2318B9b91dDc58EFB345a328883fc633c5b88F1",
    NFTBoundValidator: "0xe14458Ae8191593C5830873ea065Fa8522045875",
    NFTWalletFactory: "0x6bD76F8D71F796003385777d5666EFEdA01406F3",
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