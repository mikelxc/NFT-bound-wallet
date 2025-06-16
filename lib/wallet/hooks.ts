import { useAccount, useWalletClient, usePublicClient, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useMemo } from 'react';
import { createNBAClient, type NBAConfig } from '../nba-sdk';
import { CONTRACT_ADDRESSES } from '../nba-sdk/constants';

// Hook to get NBA client
export function useNBAClient() {
  const publicClient = usePublicClient();
  const chainId = useChainId();

  return useMemo(() => {
    if (!publicClient || !chainId) return null;

    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    if (!addresses) {
      console.error(`No contract addresses found for chain ${chainId}`);
      return null;
    }

    const config: NBAConfig = {
      chainId,
      rpcUrl: publicClient.transport.url || '',
      factoryAddress: addresses.nftWalletFactory,
      kernelImplementation: addresses.kernelFactory,
      validatorAddress: addresses.nftBoundValidator,
      bundlerUrl: process.env.NEXT_PUBLIC_BUNDLER_URL,
      paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL,
      projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
    };

    return createNBAClient(config, publicClient);
  }, [publicClient, chainId]);
}

// Hook to connect wallet
export function useConnectWallet() {
  const { open } = useAppKit();
  const { isConnected } = useAccount();

  return {
    connect: () => open(),
    isConnected,
  };
}

// Hook to get wallet client
export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  return {
    address,
    isConnected,
    chain,
    walletClient,
    publicClient,
  };
}