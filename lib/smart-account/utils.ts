import { Address, PublicClient, WalletClient, Hash } from 'viem';
import { UserOperationStatus } from './types';

/**
 * Wait for user operation to be included in a block
 */
export async function waitForUserOperationReceipt(
  smartAccountClient: any,
  hash: Hash,
  timeout: number = 60000
): Promise<UserOperationStatus> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const receipt = await smartAccountClient.getUserOperationReceipt({ hash });
      
      if (receipt) {
        return {
          hash,
          status: receipt.success ? 'included' : 'failed',
          transactionHash: receipt.receipt.transactionHash,
          blockNumber: receipt.receipt.blockNumber,
          gasUsed: receipt.receipt.gasUsed,
        };
      }
    } catch (error) {
      // UserOp not found yet, continue polling
    }
    
    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return {
    hash,
    status: 'pending',
  };
}

/**
 * Format user operation hash for display
 */
export function formatUserOpHash(hash: Hash): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Get explorer URL for user operation
 */
export function getUserOpExplorerUrl(hash: Hash, chainId: number): string {
  switch (chainId) {
    case 1315:
      return `https://story-aeneid.explorer.io/tx/${hash}`;
    case 1514:
      return `https://story.explorer.io/tx/${hash}`;
    default:
      return `https://etherscan.io/tx/${hash}`;
  }
}

/**
 * Estimate gas for transaction
 */
export async function estimateTransactionGas(
  publicClient: PublicClient,
  transaction: {
    to: Address;
    value?: bigint;
    data?: `0x${string}`;
  },
  from: Address
): Promise<bigint> {
  try {
    return await publicClient.estimateGas({
      ...transaction,
      account: from,
    });
  } catch (error) {
    console.warn('Gas estimation failed:', error);
    // Return a reasonable default
    return BigInt(21000);
  }
}

/**
 * Check if address is a contract
 */
export async function isContract(
  publicClient: PublicClient,
  address: Address
): Promise<boolean> {
  try {
    const code = await publicClient.getCode({ address });
    return code !== undefined && code !== '0x';
  } catch (error) {
    return false;
  }
}

/**
 * Validate transaction request
 */
export function validateTransactionRequest(transaction: {
  to: Address;
  value?: bigint;
  data?: `0x${string}`;
}): { valid: boolean; error?: string } {
  if (!transaction.to) {
    return { valid: false, error: 'Recipient address is required' };
  }
  
  if (transaction.to === '0x0000000000000000000000000000000000000000') {
    return { valid: false, error: 'Cannot send to zero address' };
  }
  
  if (transaction.value && transaction.value < 0n) {
    return { valid: false, error: 'Value cannot be negative' };
  }
  
  return { valid: true };
}