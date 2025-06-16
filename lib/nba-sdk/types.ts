import { Address, Hash, Hex } from 'viem';

export interface NFTBoundAccount {
  tokenId: bigint;
  walletAddress: Address;
  owner: Address;
}

export interface NBAConfig {
  // Network config
  chainId: number;
  rpcUrl: string;
  
  // Contract addresses
  factoryAddress: Address;
  kernelImplementation: Address;
  validatorAddress: Address;
  
  // AA Infrastructure
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