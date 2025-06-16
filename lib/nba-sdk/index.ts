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
import { type NBAConfig, type NFTBoundAccount, type MintResult, type WalletMetadata } from './types';
import { CONTRACT_ADDRESSES, HOOK_MODULE_NOT_INSTALLED } from './constants';
import { nftWalletFactoryAbi, nftBoundValidatorAbi, kernelFactoryAbi } from './abi';

export * from './types';
export * from './constants';
export * from './abi';

export class NBAClient {
  private config: NBAConfig;
  private publicClient: PublicClient;
  
  constructor(config: NBAConfig, publicClient: PublicClient) {
    this.config = config;
    this.publicClient = publicClient;
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