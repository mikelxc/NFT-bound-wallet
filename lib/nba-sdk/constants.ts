import { Address } from 'viem';

// Chain configuration
export const SUPPORTED_CHAINS = {
  // Story Aeneid testnet
  STORY_AENEID: {
    id: 1315,
    name: 'Story Aeneid',
    rpcUrl: 'https://rpc.story-aeneid.io',
  },
  // Story Mainnet
  STORY_MAINNET: {
    id: 1514,
    name: 'Story',
    rpcUrl: 'https://rpc.story.foundation',
  },
} as const;

// Contract addresses based on deployment
export const CONTRACT_ADDRESSES = {
  1315: {
    nftWalletFactory: '0x6bD76F8D71F796003385777d5666EFEdA01406F3' as Address,
    nftBoundValidator: '0xe14458Ae8191593C5830873ea065Fa8522045875' as Address,
    kernelFactory: '0xc2318B9b91dDc58EFB345a328883fc633c5b88F1' as Address,
    entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as Address, // New EntryPoint
    kernelImplementation: '0xFBA450Ca1fAd02E47f30e4006893545789087a8C' as Address,
  },
  1514: {
    // Story mainnet addresses (update when deployed)
    nftWalletFactory: '0x6bD76F8D71F796003385777d5666EFEdA01406F3' as Address,
    nftBoundValidator: '0xe14458Ae8191593C5830873ea065Fa8522045875' as Address,
    kernelFactory: '0xc2318B9b91dDc58EFB345a328883fc633c5b88F1' as Address,
    entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as Address,
    kernelImplementation: '0xFBA450Ca1fAd02E47f30e4006893545789087a8C' as Address,
  },
} as const;

// Default values
export const DEFAULT_MINTING_FEE = 10000000000000000n; // 0.01 ETH in wei

// Module constants from Kernel
export const HOOK_MODULE_NOT_INSTALLED = '0x0000000000000000000000000000000000000001' as Address;