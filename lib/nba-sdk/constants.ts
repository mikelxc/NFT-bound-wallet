import { Address } from 'viem';

// Chain configuration
export const SUPPORTED_CHAINS = {
  // Story Aeneid testnet
  STORY_AENEID: {
    id: 1315,
    name: 'Story Aeneid',
    rpcUrl: 'https://rpc.story-aeneid.io',
  },
  // TODO: Add mainnet and other testnet configurations
} as const;

// Contract addresses based on deployment
export const CONTRACT_ADDRESSES = {
  1315: {
    nftWalletFactory: '0x3A1888490fF7A5c0a6c568066A9E636985AEa44c' as Address,
    nftBoundValidator: '0xAD021b41871D7aC878E7c3C8589B7e8E36C2Ee22' as Address,
    kernelFactory: '0xD53A6E3EAbECaDfF73559aa1b7678738a84313ed' as Address,
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address, // Standard ERC-4337 EntryPoint
  },
  // TODO: Add addresses for other networks
} as const;

// Default values
export const DEFAULT_MINTING_FEE = 10000000000000000n; // 0.01 ETH in wei

// Module constants from Kernel
export const HOOK_MODULE_NOT_INSTALLED = '0x0000000000000000000000000000000000000001' as Address;