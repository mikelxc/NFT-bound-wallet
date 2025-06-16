import { Address, Hash, Hex } from 'viem';

export interface SmartAccountClientConfig {
  chainId: number;
  bundlerUrl: string;
  paymasterUrl: string;
  alchemyApiKey: string;
}

export interface TransactionRequest {
  to: Address;
  value?: bigint;
  data?: Hex;
}

export interface BatchTransactionRequest {
  transactions: TransactionRequest[];
}

export interface UserOperationStatus {
  hash: Hash;
  status: 'pending' | 'included' | 'failed';
  transactionHash?: Hash;
  blockNumber?: bigint;
  gasUsed?: bigint;
}

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

export interface EnhancedWalletMetadata {
  tokenId: string;
  walletAddress: Address;
  owner: Address;
  balance: string;
  transactionCount: number;
  chainId: number;
  isDeployed: boolean;
  tokenBalances: TokenBalance[];
  transactionHistory: TransactionHistoryItem[];
  nftCount: number;
}