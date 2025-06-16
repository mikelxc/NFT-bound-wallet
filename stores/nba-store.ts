import { create } from 'zustand';
import { type Address } from 'viem';
import { type NFTBoundAccount, type MintResult } from '@/lib/nba-sdk';

interface NBAState {
  // State
  nftAccounts: NFTBoundAccount[];
  activeAccount: NFTBoundAccount | null;
  isLoading: boolean;
  error: string | null;
  
  // Minting state
  isMinting: boolean;
  mintResult: MintResult | null;
  mintingStatus: string;
  transactionHash: string | null;
  
  // Actions
  setAccounts: (accounts: NFTBoundAccount[]) => void;
  setActiveAccount: (account: NFTBoundAccount | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Minting actions
  setMinting: (minting: boolean) => void;
  setMintResult: (result: MintResult | null) => void;
  setMintingStatus: (status: string) => void;
  setTransactionHash: (hash: string | null) => void;
  
  // Utility actions
  reset: () => void;
}

export const useNBAStore = create<NBAState>((set) => ({
  // Initial state
  nftAccounts: [],
  activeAccount: null,
  isLoading: false,
  error: null,
  isMinting: false,
  mintResult: null,
  mintingStatus: '',
  transactionHash: null,
  
  // Actions
  setAccounts: (accounts) => set({ nftAccounts: accounts, error: null }),
  setActiveAccount: (account) => set({ activeAccount: account }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  
  // Minting actions
  setMinting: (minting) => set({ isMinting: minting }),
  setMintResult: (result) => set({ mintResult: result, isMinting: false }),
  setMintingStatus: (status) => set({ mintingStatus: status }),
  setTransactionHash: (hash) => set({ transactionHash: hash }),
  
  // Utility actions
  reset: () => set({
    nftAccounts: [],
    activeAccount: null,
    isLoading: false,
    error: null,
    isMinting: false,
    mintResult: null,
    mintingStatus: '',
    transactionHash: null,
  }),
}));