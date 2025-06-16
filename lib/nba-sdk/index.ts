import {
  type WalletClient,
  type PublicClient,
  type Address,
  type Hash,
  getContract,
  parseEventLogs,
  formatEther,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
} from 'viem';
import { 
  type NBAConfig, 
  type NFTBoundAccount, 
  type MintResult, 
  type WalletMetadata,
  type EnhancedWalletMetadata,
  type TokenBalance,
  type TransactionHistoryItem,
  type TransactionRequest,
  type BatchTransactionRequest
} from './types';
import { CONTRACT_ADDRESSES, HOOK_MODULE_NOT_INSTALLED } from './constants';
import { nftWalletFactoryAbi, nftBoundValidatorAbi, kernelFactoryAbi } from './abi';
import { createAlchemyClient } from '@/lib/alchemy-client';
import { createNBASmartAccountClient, createSmartAccountConfig } from '@/lib/smart-account/client';
import { Alchemy } from 'alchemy-sdk';

export * from './types';
export * from './constants';
export * from './abi';

export class NBAClient {
  private config: NBAConfig;
  private publicClient: PublicClient;
  private alchemy: Alchemy;
  
  constructor(config: NBAConfig, publicClient: PublicClient) {
    this.config = config;
    this.publicClient = publicClient;
    this.alchemy = createAlchemyClient(config.chainId);
  }

  /**
   * Mint a new NFT-bound account
   */
  async mintAccount(
    to: Address,
    walletClient: WalletClient,
    onStatusUpdate?: (status: string, hash?: string) => void
  ): Promise<MintResult> {
    const factory = getContract({
      address: this.config.factoryAddress,
      abi: nftWalletFactoryAbi,
      client: { public: this.publicClient, wallet: walletClient }
    });

    onStatusUpdate?.("Getting minting fee...");
    // Get minting fee
    const mintingFee = await factory.read.mintingFee();

    onStatusUpdate?.("Simulating transaction...");
    // Simulate transaction first
    const { request } = await factory.simulate.mintWallet([to], {
      value: mintingFee,
      account: walletClient.account! as any,
    });

    onStatusUpdate?.("Submitting transaction...");
    // Execute transaction
    const hash = await factory.write.mintWallet([to], {
      ...request,
      value: mintingFee,
      account: walletClient.account! as any,
    });

    onStatusUpdate?.("Transaction submitted! Waiting for confirmation...", hash);
    
    // Wait for transaction receipt with timeout (5 minutes)
    const receipt = await Promise.race([
      this.publicClient.waitForTransactionReceipt({ hash }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout after 5 minutes')), 5 * 60 * 1000)
      )
    ]);

    onStatusUpdate?.("Transaction confirmed! Processing results...");

    // Parse events to get tokenId and wallet address
    const logs = parseEventLogs({
      abi: nftWalletFactoryAbi,
      logs: receipt.logs,
      eventName: 'WalletCreated',
    });

    if (logs.length === 0) {
      throw new Error('Failed to parse WalletCreated event');
    }

    const event = logs[0];
    return {
      tokenId: event.args.tokenId,
      walletAddress: event.args.wallet,
      transactionHash: hash,
    };
  }

  /**
   * Get NFT-bound account details
   */
  async getAccount(tokenId: bigint): Promise<NFTBoundAccount | null> {
    const factory = getContract({
      address: this.config.factoryAddress,
      abi: nftWalletFactoryAbi,
      client: this.publicClient,
    });

    try {
      const [owner, walletAddress] = await Promise.all([
        factory.read.ownerOf([tokenId]),
        factory.read.tokenIdToWallet([tokenId]),
      ]);

      // If wallet address is zero, compute it
      const finalWalletAddress = walletAddress === '0x0000000000000000000000000000000000000000'
        ? await this.computeWalletAddress(tokenId)
        : walletAddress;

      return {
        tokenId,
        walletAddress: finalWalletAddress,
        owner,
      };
    } catch (error) {
      // Token doesn't exist
      return null;
    }
  }

  /**
   * Compute deterministic wallet address for a token ID
   */
  async computeWalletAddress(tokenId: bigint): Promise<Address> {
    const factory = getContract({
      address: this.config.factoryAddress,
      abi: nftWalletFactoryAbi,
      client: this.publicClient,
    });

    return await factory.read.getWalletAddress([tokenId]);
  }

  /**
   * Get wallet metadata for display
   */
  async getWalletMetadata(tokenId: bigint): Promise<WalletMetadata | null> {
    const account = await this.getAccount(tokenId);
    if (!account) return null;

    const [balance, nonce] = await Promise.all([
      this.publicClient.getBalance({ address: account.walletAddress }),
      this.publicClient.getTransactionCount({ address: account.walletAddress }),
    ]);

    return {
      tokenId: tokenId.toString(),
      walletAddress: account.walletAddress,
      balance: formatEther(balance),
      transactionCount: nonce,
      owner: account.owner,
      chainId: this.config.chainId,
    };
  }

  /**
   * Get minting fee
   */
  async getMintingFee(): Promise<bigint> {
    const factory = getContract({
      address: this.config.factoryAddress,
      abi: nftWalletFactoryAbi,
      client: this.publicClient,
    });

    return await factory.read.mintingFee();
  }

  /**
   * Check if an address owns any NFT-bound accounts
   */
  async getOwnedAccounts(owner: Address): Promise<NFTBoundAccount[]> {
    const factory = getContract({
      address: this.config.factoryAddress,
      abi: nftWalletFactoryAbi,
      client: this.publicClient,
    });

    const balance = await factory.read.balanceOf([owner]);
    const accounts: NFTBoundAccount[] = [];

    // Note: This is a simplified approach. In production, you'd want to use
    // event logs or a more efficient method to get all owned tokens
    for (let i = 0n; i < balance; i++) {
      try {
        // This assumes sequential token IDs, which may not be the case
        // You'd need to implement proper enumeration or use events
        const account = await this.getAccount(i);
        if (account && account.owner === owner) {
          accounts.push(account);
        }
      } catch (error) {
        // Continue to next token
      }
    }

    return accounts;
  }

  /**
   * Get enhanced wallet metadata with Alchemy integration
   */
  async getEnhancedWalletMetadata(tokenId: bigint): Promise<EnhancedWalletMetadata | null> {
    const baseMetadata = await this.getWalletMetadata(tokenId);
    if (!baseMetadata) return null;

    const account = await this.getAccount(tokenId);
    if (!account) return null;

    // Check if wallet is deployed
    const isDeployed = baseMetadata.transactionCount > 0;

    // Get token balances from Alchemy
    const tokenBalances = await this.getTokenBalances(account.walletAddress);
    
    // Get transaction history from Alchemy
    const transactionHistory = await this.getTransactionHistory(account.walletAddress);
    
    // Get NFT count from Alchemy
    const nftCount = await this.getNFTCount(account.walletAddress);

    return {
      ...baseMetadata,
      isDeployed,
      tokenBalances,
      transactionHistory,
      nftCount,
    };
  }

  /**
   * Get token balances using Alchemy
   */
  async getTokenBalances(walletAddress: Address): Promise<TokenBalance[]> {
    try {
      const balances = await this.alchemy.core.getTokenBalances(walletAddress);
      const tokenBalances: TokenBalance[] = [];

      // Add native token (ETH/IP)
      const nativeBalance = await this.publicClient.getBalance({ address: walletAddress });
      tokenBalances.push({
        contractAddress: '0x0000000000000000000000000000000000000000' as Address,
        name: this.config.chainId === 1315 ? 'IP Token' : 'IP Token',
        symbol: 'IP',
        balance: formatEther(nativeBalance),
        decimals: 18,
      });

      // Add ERC-20 tokens
      for (const token of balances.tokenBalances) {
        if (token.tokenBalance && token.tokenBalance !== '0x0') {
          try {
            const metadata = await this.alchemy.core.getTokenMetadata(token.contractAddress);
            if (metadata.name && metadata.symbol) {
              const balance = parseInt(token.tokenBalance, 16);
              const decimals = metadata.decimals || 18;
              const formattedBalance = (balance / Math.pow(10, decimals)).toFixed(6);
              
              tokenBalances.push({
                contractAddress: token.contractAddress as Address,
                name: metadata.name,
                symbol: metadata.symbol,
                balance: formattedBalance,
                decimals,
                logo: metadata.logo,
              });
            }
          } catch (error) {
            console.warn(`Failed to get metadata for token ${token.contractAddress}:`, error);
          }
        }
      }

      return tokenBalances;
    } catch (error) {
      console.warn('Failed to get token balances:', error);
      // Return just native balance
      const nativeBalance = await this.publicClient.getBalance({ address: walletAddress });
      return [{
        contractAddress: '0x0000000000000000000000000000000000000000' as Address,
        name: 'IP Token',
        symbol: 'IP',
        balance: formatEther(nativeBalance),
        decimals: 18,
      }];
    }
  }

  /**
   * Get transaction history using Alchemy
   */
  async getTransactionHistory(walletAddress: Address): Promise<TransactionHistoryItem[]> {
    try {
      const [sentTransfers, receivedTransfers] = await Promise.all([
        this.alchemy.core.getAssetTransfers({
          fromAddress: walletAddress,
          excludeZeroValue: true,
          category: ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
          maxCount: 20,
        }),
        this.alchemy.core.getAssetTransfers({
          toAddress: walletAddress,
          excludeZeroValue: true,
          category: ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
          maxCount: 20,
        }),
      ]);

      const allTransfers = [
        ...sentTransfers.transfers.map(t => ({ ...t, type: 'send' as const })),
        ...receivedTransfers.transfers.map(t => ({ ...t, type: 'receive' as const })),
      ].sort((a, b) => 
        new Date(b.metadata.blockTimestamp).getTime() - new Date(a.metadata.blockTimestamp).getTime()
      );

      return allTransfers.slice(0, 20).map(transfer => ({
        hash: transfer.hash as Hash,
        blockNumber: BigInt(transfer.blockNum),
        timestamp: transfer.metadata.blockTimestamp,
        from: transfer.from as Address,
        to: transfer.to as Address,
        value: transfer.value?.toString() || '0',
        asset: transfer.asset || 'IP',
        type: transfer.type,
        status: 'success' as const,
      }));
    } catch (error) {
      console.warn('Failed to get transaction history:', error);
      return [];
    }
  }

  /**
   * Get NFT count using Alchemy
   */
  async getNFTCount(walletAddress: Address): Promise<number> {
    try {
      const nfts = await this.alchemy.nft.getNftsForOwner(walletAddress, {
        pageSize: 1,
      });
      return nfts.totalCount || 0;
    } catch (error) {
      console.warn('Failed to get NFT count:', error);
      // Fallback: could implement a backup method or return 0
      return 0;
    }
  }

  /**
   * Get detailed NFT portfolio using Alchemy
   */
  async getNFTPortfolio(walletAddress: Address, pageSize: number = 20, pageKey?: string) {
    try {
      const response = await this.alchemy.nft.getNftsForOwner(walletAddress, {
        pageSize,
        pageKey,
        omitMetadata: false, // Include full metadata
      });

      return {
        nfts: response.ownedNfts.map(nft => ({
          contractAddress: nft.contract.address,
          tokenId: nft.tokenId,
          name: nft.name || `${nft.contract.symbol || 'Unknown'} #${nft.tokenId}`,
          description: nft.description,
          image: nft.image.originalUrl || nft.image.thumbnailUrl || nft.image.pngUrl || '',
          collection: {
            name: nft.contract.name || nft.contract.symbol,
            floorPrice: nft.contract.openSeaMetadata?.floorPrice,
          },
          tokenType: nft.tokenType,
          timeLastUpdated: nft.timeLastUpdated,
        })),
        totalCount: response.totalCount,
        pageKey: response.pageKey,
      };
    } catch (error) {
      console.warn('Failed to get NFT portfolio:', error);
      return {
        nfts: [],
        totalCount: 0,
        pageKey: undefined,
      };
    }
  }

  /**
   * Create smart account client for this NBA wallet
   */
  async createSmartAccountClient(
    tokenId: bigint,
    ownerWallet: WalletClient
  ) {
    const account = await this.getAccount(tokenId);
    if (!account) {
      throw new Error('NBA wallet not found');
    }

    const config = createSmartAccountConfig(this.config.chainId);
    
    return await createNBASmartAccountClient(
      config,
      account.walletAddress,
      ownerWallet,
      this.publicClient
    );
  }

  /**
   * Send transaction using smart account
   */
  async sendTransaction(
    tokenId: bigint,
    ownerWallet: WalletClient,
    transaction: TransactionRequest,
    onStatusUpdate?: (status: string, hash?: Hash) => void
  ): Promise<Hash> {
    const smartAccountClient = await this.createSmartAccountClient(tokenId, ownerWallet);
    return await smartAccountClient.sendTransaction(transaction, onStatusUpdate);
  }

  /**
   * Send batch transaction using smart account
   */
  async sendBatchTransaction(
    tokenId: bigint,
    ownerWallet: WalletClient,
    batchRequest: BatchTransactionRequest,
    onStatusUpdate?: (status: string, hash?: Hash) => void
  ): Promise<Hash> {
    const smartAccountClient = await this.createSmartAccountClient(tokenId, ownerWallet);
    return await smartAccountClient.sendBatchTransaction(batchRequest, onStatusUpdate);
  }

  /**
   * Estimate gas for transaction
   */
  async estimateTransactionGas(
    tokenId: bigint,
    ownerWallet: WalletClient,
    transaction: TransactionRequest
  ): Promise<{
    gas: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  }> {
    const smartAccountClient = await this.createSmartAccountClient(tokenId, ownerWallet);
    return await smartAccountClient.estimateGas(transaction);
  }

  /**
   * Create salt for deterministic deployment
   */
  private createSalt(tokenId: bigint, factoryAddress: Address): Hash {
    return keccak256(
      encodeAbiParameters(
        parseAbiParameters('uint256 tokenId, address factory'),
        [tokenId, factoryAddress]
      )
    );
  }
}

// Factory function to create NBA client
export function createNBAClient(
  config: NBAConfig,
  publicClient: PublicClient
): NBAClient {
  return new NBAClient(config, publicClient);
}