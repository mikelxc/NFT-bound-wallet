// Re-export generated ABIs from wagmi
export { nftWalletFactoryAbi, nftBoundValidatorAbi } from '../generated';

// Kernel Factory ABI (minimal interface needed)
export const kernelFactoryAbi = [
  {
    inputs: [
      { name: 'initData', type: 'bytes' },
      { name: 'salt', type: 'bytes32' }
    ],
    name: 'createAccount',
    outputs: [{ name: 'account', type: 'address' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'initData', type: 'bytes' },
      { name: 'salt', type: 'bytes32' }
    ],
    name: 'getAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;