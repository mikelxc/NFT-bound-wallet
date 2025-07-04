import { Address, Hash, Hex } from 'viem';

export interface NFTBoundAccount {
  tokenId: bigint;
  walletAddress: Address;
  owner: Address;
}

export interface NBAConfig {
  // Network config
  chainId: number;
  
  // Contract addresses
  factoryAddress: Address;
  entryPoint: Address;
  
  // AA Infrastructure (optional)
  bundlerUrl?: string;
  paymasterUrl?: string;
  
  // Optional
  projectId?: string; // Reown project ID
}

export interface MintResult {
  tokenId: bigint;
  walletAddress: Address;
  transactionHash: Hash;
}

export interface WalletMetadata {
  tokenId: string;
  walletAddress: string;
  balance: string;
  transactionCount: number;
  owner: string;
  chainId: number;
}

export interface TransactionRequest {
  to: Address;
  value?: bigint;
  data?: Hex;
}

export interface BatchTransactionRequest {
  transactions: TransactionRequest[];
}

// Enhanced types with Alchemy integration
export interface TokenBalance {
  contractAddress: Address;
  name: string;
  symbol: string;
  balance: string;
  decimals: number;
  logo?: string;
}

export interface TransactionHistoryItem {
  hash: Hash;
  blockNumber: bigint;
  timestamp: string;
  from: Address;
  to: Address;
  value: string;
  asset: string;
  type: 'send' | 'receive' | 'contract';
  status: 'success' | 'failed';
}

export interface EnhancedWalletMetadata extends WalletMetadata {
  isDeployed: boolean;
  tokenBalances: TokenBalance[];
  transactionHistory: TransactionHistoryItem[];
  nftCount: number;
}