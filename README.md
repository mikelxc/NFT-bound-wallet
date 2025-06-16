# NFT-Bound Wallet

A monorepo containing both the smart contracts and frontend for the NFT-Bound Wallet project built on Kernel v3.3.

## Project Structure

```
├── app/                    # Next.js frontend application
├── components/             # React components
├── contracts/              # Smart contracts (Foundry project)
├── lib/                    # Shared utilities and configurations
│   ├── contracts.ts        # Contract addresses and network config
│   ├── generated.ts        # Auto-generated ABIs and types (via wagmi)
│   └── utils.ts           # Utility functions
└── public/                 # Static assets
```

## Smart Contracts

The project uses Kernel v3.3 for account abstraction with NFT-bound validation:

- **NFTWalletFactory**: Main factory contract for minting wallet NFTs
- **NFTBoundValidator**: Validator that ties wallet control to NFT ownership
- **Kernel**: Account abstraction implementation
- **KernelFactory**: Factory for creating Kernel accounts

### Deployed Contracts (Story Testnet - Chain ID: 1315)

- **NFTWalletFactory**: [`0x3A1888490fF7A5c0a6c568066A9E636985AEa44c`](https://aeneid.storyscan.io/address/0x3a1888490ff7a5c0a6c568066a9e636985aea44c)
- **NFTBoundValidator**: [`0xAD021b41871D7aC878E7c3C8589B7e8E36C2Ee22`](https://aeneid.storyscan.io/address/0xad021b41871d7ac878e7c3c8589b7e8e36c2ee22)
- **Kernel**: [`0xAdb7713Ee63Acf1233A67f213CbAc9Ac6A5a8e09`](https://aeneid.storyscan.io/address/0xadb7713ee63acf1233a67f213cbac9ac6a5a8e09)
- **KernelFactory**: [`0xD53A6E3EAbECaDfF73559aa1b7678738a84313ed`](https://aeneid.storyscan.io/address/0xd53a6e3eabecadff73559aa1b7678738a84313ed)

## Development

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Foundry (for smart contract development)

### Installation

```bash
# Install dependencies
npm install

# Install contract dependencies
npm run contracts:build
```

### Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linting
```

#### Smart Contracts
```bash
npm run contracts:build    # Compile contracts
npm run contracts:test     # Run contract tests
npm run contracts:deploy   # Deploy contracts
```

#### Code Generation
```bash
npm run wagmi:generate     # Generate ABIs and types from contracts
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Optional: Add environment variables for the frontend
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

For contract deployment, see `contracts/.env.example`.

## Features

### NFT-Bound Smart Accounts
- Each wallet is represented as an NFT
- Transfer the NFT = transfer wallet control
- Built on Kernel v3.3 account abstraction
- Dynamic SVG artwork based on wallet activity

### On-Chain SVG Generation
- 400x400px square format (OpenSea optimized)
- Glassmorphism effects with animated gradients
- Balance-based visual elements and rarity filters
- Activity-driven dynamic components

### Frontend
- Next.js 15 with React 19
- Tailwind CSS for styling
- Radix UI components
- TypeScript throughout
- Auto-generated contract types via wagmi

## Contributing

1. Make changes to contracts in `contracts/` directory
2. Run `npm run contracts:build` to compile
3. Run `npm run wagmi:generate` to update types
4. Test frontend integration

## License

MIT License - see LICENSE file for details.
