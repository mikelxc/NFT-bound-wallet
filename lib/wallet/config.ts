import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { storyAeneid } from '@reown/appkit/networks';
import { cookieStorage, createStorage } from 'wagmi';

// Define local chain for development
export const localChain = storyAeneid.network;

// Define supported chains
export const chains = [localChain];

// Project ID from Reown
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';

if (!projectId) {
  console.warn('NEXT_PUBLIC_REOWN_PROJECT_ID is not set. Wallet connection may not work properly.');
}

// Create wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks: [storyAeneid],
});

// Create modal configuration
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [storyAeneid],
  metadata: {
    name: 'NFT-Bound Smart Accounts',
    description: 'Trade Your Wallet as an NFT',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://nft-bsa.xyz',
    icons: ['/placeholder-logo.png'],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
});