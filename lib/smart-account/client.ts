import { createSmartAccountClient } from 'permissionless';
import { toSmartAccount, getUserOperationHash, entryPoint07Abi } from 'viem/account-abstraction';
import { createPaymasterClient } from 'viem/account-abstraction';
import { 
  Address, 
  Hash, 
  WalletClient, 
  PublicClient, 
  parseEther,
  http,
  Chain,
  Hex,
  encodeAbiParameters,
  keccak256,
  toHex,
  concat,
  pad,
  size,
  encodePacked
} from 'viem';
import { SmartAccountClientConfig, TransactionRequest, BatchTransactionRequest } from './types';
import { waitForUserOperationReceipt, validateTransactionRequest } from './utils';
import { getAlchemyRpcUrl } from '@/lib/alchemy-client';
import { CONTRACT_ADDRESSES } from '@/lib/nba-sdk/constants';

// Define Story Aeneid chain
const storyAeneid: Chain = {
  id: 1315,
  name: 'Story Aeneid',
  nativeCurrency: {
    decimals: 18,
    name: 'IP',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {
      http: ['https://story-aeneid.g.alchemy.com/v2/'],
    },
  },
  blockExplorers: {
    default: { name: 'Story Explorer', url: 'https://story-aeneid.explorer.io' },
  },
  testnet: true,
};

// Define Story mainnet chain
const story: Chain = {
  id: 1514,
  name: 'Story',
  nativeCurrency: {
    decimals: 18,
    name: 'IP',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {
      http: ['https://story.g.alchemy.com/v2/'],
    },
  },
  blockExplorers: {
    default: { name: 'Story Explorer', url: 'https://story.explorer.io' },
  },
  testnet: false,
};

function getChain(chainId: number): Chain {
  switch (chainId) {
    case 1315:
      return storyAeneid;
    case 1514:
      return story;
    default:
      return storyAeneid;
  }
}

/**
 * Create NBA-specific smart account implementation with custom validator
 * Based on permissionless.js toKernelSmartAccount pattern
 */
async function createNBAKernelAccount({
  client,
  owner,
  address,
  validatorAddress,
  entryPoint,
}: {
  client: PublicClient;
  owner: WalletClient; // Update type to WalletClient
  address: Address;
  validatorAddress: Address;
  entryPoint: { address: Address; version: "0.6" | "0.7" };
}) {
  return toSmartAccount({
    client,
    entryPoint: {
      address: entryPoint.address,
      abi: entryPoint07Abi,
      version: entryPoint.version,
    },
    
    async getFactoryArgs() {
      // Return factory and factoryData for deployment if needed
      // For existing wallets, we don't need deployment
      const code = await client.getCode({ address });
      if (code && code !== '0x') {
        return {
          factory: '0x0000000000000000000000000000000000000000' as Address,
          factoryData: '0x' as Hex,
        };
      }
      
      // If wallet needs deployment, return actual factory data
      return {
        factory: '0x0000000000000000000000000000000000000000' as Address,
        factoryData: '0x' as Hex,
      };
    },

    async getAddress() {
      return address;
    },

    async encodeCalls(calls) {
      // For single call, return the call data directly
      if (calls.length === 1) {
        return calls[0].data || '0x';
      }
      
      // For multiple calls, encode as batch
      // This would need to match your Kernel account's batch calling mechanism
      return encodeAbiParameters(
        [{ type: 'bytes[]' }],
        [calls.map(call => call.data || '0x')]
      );
    },

    async decodeCalls(callData) {
      // Decode calls from callData - simplified implementation
      return [{
        to: address, // This would need proper parsing
        value: 0n,
        data: callData,
      }];
    },

    async getNonce(args) {
      try {
        const nonce = await client.readContract({
          address: entryPoint.address,
          abi: [
            {
              inputs: [
                { type: 'address', name: 'sender' },
                { type: 'uint192', name: 'key' },
              ],
              name: 'getNonce',
              outputs: [{ type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'getNonce',
          args: [address, args?.key || 0n],
        });
        return nonce as bigint;
      } catch (error) {
        console.warn('Failed to get nonce, using 0:', error);
        return 0n;
      }
    },

    async getStubSignature() {
      // Return a stub signature for gas estimation
      // New NFTBoundValidator uses ECDSA format: simple 65-byte signature
      // Format: r(32 bytes) + s(32 bytes) + v(1 byte)
      return '0x' + 
        '1234567890123456789012345678901234567890123456789012345678901234' + // r (32 bytes)
        '1234567890123456789012345678901234567890123456789012345678901234' + // s (32 bytes)
        '1c'; // v (recovery id)
    },

    async sign({ hash }) {
      if (!owner.account) {
        throw new Error("Owner wallet account not available");
      }
      return await owner.signMessage({ 
        account: owner.account,
        message: hash 
      });
    },

    async signMessage({ message }) {
      if (!owner.account) {
        throw new Error("Owner wallet account not available");
      }
      return await owner.signMessage({ 
        account: owner.account,
        message 
      });
    },

    async signTypedData(typedData) {
      if (!owner.account) {
        throw new Error("Owner wallet account not available");
      }
      return await owner.signTypedData({
        account: owner.account,
        ...typedData
      });
    },

    async signUserOperation(parameters) {
      const { chainId, ...userOperation } = parameters;
      
      // Get the user operation hash
      const hash = getUserOperationHash({
        userOperation: {
          ...userOperation,
          sender: userOperation.sender ?? address,
          signature: "0x"
        },
        entryPointAddress: entryPoint.address,
        entryPointVersion: entryPoint.version,
        chainId: chainId || 1315, // Default to Story Aeneid testnet
      });

      // Sign the user operation hash with the owner wallet client
      if (!owner.account) {
        throw new Error("Owner wallet account not available");
      }
      
      const signature = await owner.signMessage({
        account: owner.account,
        message: { raw: hash },
      });

      // New NFTBoundValidator uses simple ECDSA format like standard validators
      return signature;
    },
  });
}

/**
 * Create a smart account client for NBA wallets
 */
export async function createNBASmartAccountClient(
  config: SmartAccountClientConfig,
  walletAddress: Address,
  ownerWallet: WalletClient,
  publicClient: PublicClient
) {
  const chain = getChain(config.chainId);
  
  // Create paymaster client
  const paymasterClient = createPaymasterClient({
    transport: http(config.paymasterUrl),
  });

  // Validate owner wallet account
  if (!ownerWallet.account) {
    throw new Error("Owner wallet account is undefined. Please ensure the wallet is properly connected.");
  }

  console.log("Creating Kernel smart account with owner:", ownerWallet.account.address);
  console.log("NBA wallet address:", walletAddress);
  console.log("Chain info:", chain);
  console.log("Public client chain:", publicClient.chain);

  // Create a custom NBA account that uses the NFTBoundValidator
  const validatorAddress = CONTRACT_ADDRESSES[config.chainId as keyof typeof CONTRACT_ADDRESSES]?.nftBoundValidator;
  
  if (!validatorAddress) {
    throw new Error(`NFTBoundValidator address not found for chain ${config.chainId}`);
  }

  console.log("Using NFTBoundValidator at:", validatorAddress);

  // Create custom NBA smart account with NFTBoundValidator
  const kernelAccount = await createNBAKernelAccount({
    client: publicClient,
    owner: ownerWallet, // Pass the full wallet client, not just account
    address: walletAddress,
    validatorAddress: validatorAddress,
    entryPoint: {
      address: "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // New EntryPoint
      version: "0.7" as const,
    },
  });

  // Create smart account client
  const smartAccountClient = createSmartAccountClient({
    account: kernelAccount,
    chain,
    bundlerTransport: http(config.bundlerUrl),
    paymaster: paymasterClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        try {
          // Use Pimlico bundler for gas estimation
          const response = await fetch(config.bundlerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'pimlico_getUserOperationGasPrice',
              params: [],
            }),
          });
          const gasData = await response.json();
          
          if (gasData.result) {
            return {
              maxFeePerGas: BigInt(gasData.result.fast.maxFeePerGas),
              maxPriorityFeePerGas: BigInt(gasData.result.fast.maxPriorityFeePerGas),
            };
          }
          throw new Error('No gas price data');
        } catch (error) {
          console.warn('Failed to get gas price from Pimlico:', error);
          // Fallback to public client
          const gasPrice = await publicClient.getGasPrice();
          return {
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice / 10n, // 10% of gas price
          };
        }
      },
    },
  });

  return {
    smartAccountClient,
    kernelAccount,
    paymasterClient,
    
    /**
     * Send a single transaction
     */
    async sendTransaction(
      transaction: TransactionRequest,
      onStatusUpdate?: (status: string, hash?: Hash) => void
    ): Promise<Hash> {
      // Validate transaction
      const validation = validateTransactionRequest(transaction);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      onStatusUpdate?.("Preparing transaction...");

      try {
        // Send user operation
        const userOpHash = await smartAccountClient.sendUserOperation({
          calls: [{
            to: transaction.to,
            value: transaction.value || 0n,
            data: transaction.data || '0x',
          }],
        });

        onStatusUpdate?.("Transaction submitted! Waiting for confirmation...", userOpHash);

        // Wait for user operation receipt
        const status = await waitForUserOperationReceipt(smartAccountClient, userOpHash);
        
        if (status.status === 'failed') {
          throw new Error('Transaction failed');
        }

        onStatusUpdate?.("Transaction confirmed!", status.transactionHash);
        return status.transactionHash || userOpHash;
      } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
      }
    },

    /**
     * Send multiple transactions in a batch
     */
    async sendBatchTransaction(
      batchRequest: BatchTransactionRequest,
      onStatusUpdate?: (status: string, hash?: Hash) => void
    ): Promise<Hash> {
      // Validate all transactions
      for (const transaction of batchRequest.transactions) {
        const validation = validateTransactionRequest(transaction);
        if (!validation.valid) {
          throw new Error(`Invalid transaction: ${validation.error}`);
        }
      }

      onStatusUpdate?.("Preparing batch transaction...");

      try {
        // Convert to calls format
        const calls = batchRequest.transactions.map(tx => ({
          to: tx.to,
          value: tx.value || 0n,
          data: tx.data || '0x',
        }));

        // Send batch user operation
        const userOpHash = await smartAccountClient.sendUserOperation({
          calls,
        });

        onStatusUpdate?.("Batch transaction submitted! Waiting for confirmation...", userOpHash);

        // Wait for user operation receipt
        const status = await waitForUserOperationReceipt(smartAccountClient, userOpHash);
        
        if (status.status === 'failed') {
          throw new Error('Batch transaction failed');
        }

        onStatusUpdate?.("Batch transaction confirmed!", status.transactionHash);
        return status.transactionHash || userOpHash;
      } catch (error) {
        console.error('Batch transaction failed:', error);
        throw error;
      }
    },

    /**
     * Estimate gas for a transaction
     */
    async estimateGas(transaction: TransactionRequest): Promise<{
      gas: bigint;
      maxFeePerGas: bigint;
      maxPriorityFeePerGas: bigint;
    }> {
      try {
        const gasEstimate = await smartAccountClient.estimateUserOperationGas({
          calls: [{
            to: transaction.to,
            value: transaction.value || 0n,
            data: transaction.data || '0x',
          }],
        });

        const feeData = await publicClient.getGasPrice();
        const gasInfo = {
          maxFeePerGas: feeData,
          maxPriorityFeePerGas: feeData / 10n,
        };

        return {
          gas: gasEstimate.callGasLimit + gasEstimate.preVerificationGas + gasEstimate.verificationGasLimit,
          maxFeePerGas: gasInfo.maxFeePerGas,
          maxPriorityFeePerGas: gasInfo.maxPriorityFeePerGas,
        };
      } catch (error) {
        console.error('Gas estimation failed:', error);
        throw error;
      }
    },

    /**
     * Get user operation status
     */
    async getUserOperationStatus(hash: Hash) {
      try {
        const receipt = await smartAccountClient.getUserOperationReceipt({ hash });
        return receipt;
      } catch (error) {
        return null;
      }
    },
  };
}

/**
 * Factory function to create smart account client config
 */
export function createSmartAccountConfig(
  chainId: number = 1315,
  bundlerApiKey?: string,
  paymasterApiKey?: string,
  alchemyApiKey?: string
): SmartAccountClientConfig {
  const bundlerKey = bundlerApiKey || process.env.NEXT_PUBLIC_BUNDLER_API_KEY;
  const paymasterKey = paymasterApiKey || process.env.NEXT_PUBLIC_PAYMASTER_API_KEY;
  const alchemyKey = alchemyApiKey || process.env.NEXT_PUBLIC_ALCHEMY_API;

  if (!bundlerKey || !paymasterKey || !alchemyKey) {
    throw new Error('Missing required API keys for smart account configuration');
  }

  return {
    chainId,
    bundlerUrl: `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${bundlerKey}`,
    paymasterUrl: `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${paymasterKey}`,
    alchemyApiKey: alchemyKey,
  };
}