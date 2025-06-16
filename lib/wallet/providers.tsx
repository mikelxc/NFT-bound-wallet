'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { type State, WagmiProvider } from 'wagmi';
import { wagmiAdapter } from './config';
import { AppKitProvider } from '@reown/appkit/react';

// Setup query client
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface WalletProviderProps {
  children: ReactNode;
  initialState?: State;
}

export function WalletProvider({ children, initialState }: WalletProviderProps) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
        <AppKitProvider />
      </QueryClientProvider>
    </WagmiProvider>
  );
}