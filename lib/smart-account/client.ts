import { createSmartAccountClient } from 'permissionless';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { toSmartAccount, getUserOperationHash, entryPoint07Abi } from 'viem/account-abstraction';
import { 
  Address, 
  WalletClient, 
  PublicClient, 
  http,
  Chain,
  Hex,
  encodeFunctionData,
  decodeFunctionData,
  encodeAbiParameters,
  concat,
  pad,
  toHex,
} from 'viem';
import { SmartAccountClientConfig } from './types';
import { CONTRACT_ADDRESSES } from '@/lib/nba-sdk/constants';

// ERC-7579 Execute ABI for NBA wallets
const ERC7579ExecuteAbi = [
  {
    inputs: [
      { name: 'mode', type: 'bytes32' },
      { name: 'executionCalldata', type: 'bytes' }
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  }
] as const;

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
      if (calls.length === 0) {
        throw new Error("No calls to encode");
      }

      // ERC-7579 encoding
      let mode: Hex;
      let executionCalldata: Hex;

      if (calls.length === 1) {
        // Single call mode
        // mode: calltype (1 byte) + exectype (1 byte) + selector (4 bytes) + payload (26 bytes)
        // CALLTYPE_SINGLE = 0x00, EXECTYPE_DEFAULT = 0x00
        mode = "0x0000000000000000000000000000000000000000000000000000000000000000";
        
        const call = calls[0];
        // For single call: abi.encodePacked(target, value, callData)
        executionCalldata = concat([
          call.to,
          pad(toHex(call.value ?? 0n), { size: 32 }),
          call.data ?? "0x"
        ]);
      } else {
        // Batch call mode  
        // CALLTYPE_BATCH = 0x01, EXECTYPE_DEFAULT = 0x00
        mode = "0x0101000000000000000000000000000000000000000000000000000000000000";
        
        // For batch calls, encode as array of execution structs
        executionCalldata = encodeAbiParameters(
          [{
            components: [
              { name: 'target', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'callData', type: 'bytes' }
            ],
            name: 'executions',
            type: 'tuple[]'
          }],
          [calls.map(call => ({
            target: call.to,
            value: call.value ?? 0n,
            callData: call.data ?? "0x"
          }))]
        );
      }

      return encodeFunctionData({
        abi: ERC7579ExecuteAbi,
        functionName: "execute",
        args: [mode, executionCalldata]
      });
    },

    async decodeCalls(callData) {
      try {
        const decoded = decodeFunctionData({
          abi: ERC7579ExecuteAbi,
          data: callData
        });

        if (decoded.functionName === "execute") {
          const [mode, executionCalldata] = decoded.args;
          
          // Parse mode to determine call type
          const modeBytes = mode.slice(2); // Remove 0x
          const callType = parseInt(modeBytes.slice(0, 2), 16); // First byte
          
          if (callType === 0x01) {
            // Batch call
            // Decode execution calldata as array of structs
            // This is a simplified decode - actual implementation would be more complex
            return [{
              to: address,
              value: 0n,
              data: executionCalldata
            }];
          } else {
            // Single call - decode from packed data
            // target (20 bytes) + value (32 bytes) + callData
            const executionData = executionCalldata.slice(2);
            const target = "0x" + executionData.slice(0, 40) as Address;
            const value = BigInt("0x" + executionData.slice(40, 104));
            const callDataHex = "0x" + executionData.slice(104) as Hex;
            
            return [{
              to: target,
              value,
              data: callDataHex
            }];
          }
        }

        throw new Error(`Unknown function: ${decoded.functionName}`);
      } catch (error) {
        console.error("Failed to decode call data:", error);
        // Fallback - return raw data
        return [{
          to: address,
          value: 0n,
          data: callData
        }];
      }
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
        '1c' as `0x${string}`; // v (recovery id)
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
  
  // Create Pimlico paymaster client
  const paymasterClient = createPimlicoClient({
    transport: http(config.paymasterUrl),
    entryPoint: {
      address: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
      version: "0.7",
    }
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
        return (await paymasterClient.getUserOperationGasPrice()).fast;
      },
    },
  });

  return smartAccountClient;
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