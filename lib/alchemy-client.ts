import { Alchemy, Network } from 'alchemy-sdk';

// Helper function to get the correct network based on chain ID
export function getAlchemyNetwork(chainId: number): Network {
  switch (chainId) {
    case 1:
      return Network.ETH_MAINNET;
    case 11155111:
      return Network.ETH_SEPOLIA;
    case 8453:
      return Network.BASE_MAINNET;
    case 84532:
      return Network.BASE_SEPOLIA;
    case 137:
      return Network.MATIC_MAINNET;
    case 10:
      return Network.OPT_MAINNET;
      return Network.OPT_GOERLI;
    case 42161:
      return Network.ARB_MAINNET;
    case 1315:
      return Network.STORY_AENEID;
    case 1514:
      return Network.STORY_MAINNET;
    default:
      return Network.ETH_MAINNET;
  }
}

// Create Alchemy client for specific chain
export function createAlchemyClient(chainId: number): Alchemy {
  const network = getAlchemyNetwork(chainId);
  
  return new Alchemy({
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API!,
    network: network,
  });
}

// Get Alchemy RPC URL using the network constant
export function getAlchemyRpcUrl(chainId: number): string {
  const network = getAlchemyNetwork(chainId);
  return `https://${network}.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API}`;
}

// Initialize default Alchemy client for Story testnet
export const alchemy = createAlchemyClient(1315);