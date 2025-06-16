import { Address } from 'viem';

// Chain configuration
export const SUPPORTED_CHAINS = {
  // Local network from deployment
  LOCAL: {
    id: 1514,
    name: 'Local Network',
    rpcUrl: 'http://localhost:8545',
  },
  // TODO: Add mainnet and testnet configurations
} as const;

// Contract addresses based on deployment
export const CONTRACT_ADDRESSES = {
  1514: {
    nftWalletFactory: '0xd53a6e3eabecadff73559aa1b7678738a84313ed' as Address,
    nftBoundValidator: '0xadb7713ee63acf1233a67f213cbac9ac6a5a8e09' as Address,
    kernelFactory: '0x33d756F5901C3843964d0682D41fB50b054d2315' as Address,
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address, // Standard ERC-4337 EntryPoint
  },
  // TODO: Add addresses for other networks
} as const;

// Default values
export const DEFAULT_MINTING_FEE = 10000000000000000n; // 0.01 ETH in wei

// Module constants from Kernel
export const HOOK_MODULE_NOT_INSTALLED = '0x0000000000000000000000000000000000000001' as Address;