# NFT-Bound Kernel v3.3 Smart Account

An NFT collection where each token represents ownership of a deterministic smart account wallet. The NFT acts as the primary validator for the wallet, creating an intuitive ownership model where transferring the NFT transfers control of the wallet.

## Features

- **NFT-Controlled Wallets**: Each NFT token controls exactly one smart contract wallet
- **Deterministic Addresses**: Wallet addresses are predictable and computed off-chain
- **Instant Transfer**: Transferring the NFT immediately transfers wallet control
- **On-Chain Metadata**: Dynamic SVG showing wallet stats (balance, nonce, address)
- **ERC-4337 Compatible**: Full Account Abstraction support via Kernel v3.3
- **Gas Optimized**: Built with Solady for minimal gas costs

## Architecture

```
┌─────────────────────────┐
│   NFTWalletFactory      │
│  (ERC721 + Factory)     │
├─────────────────────────┤
│ - Mints NFTs            │
│ - Deploys wallets       │
│ - Generates metadata    │
└───────────┬─────────────┘
            │ deploys
            ▼
┌─────────────────────────┐
│   Kernel v3.3 Proxy     │
│  (Deterministic Clone)  │
├─────────────────────────┤
│ - Uses NFTBoundValidator│
│ - Standard Kernel logic │
└─────────────────────────┘
            │ validates with
            ▼
┌─────────────────────────┐
│   NFTBoundValidator     │
│  (IPlugin)              │
├─────────────────────────┤
│ - Checks NFT ownership  │
│ - Validates signatures  │
└─────────────────────────┘
```

## Contracts

### NFTWalletFactory
- **Contract**: `src/NFTWalletFactory.sol`
- **Purpose**: ERC721 NFT collection + wallet factory
- **Key Features**:
  - Sequential token ID minting starting from 0 (0, 1, 2...)
  - Deterministic wallet address generation
  - OpenSea-compatible metadata with dynamic SVG
  - Collection-level metadata with `contractURI()`
  - Real-time wallet stats (balance, transactions, address)
  - Minting fee collection and withdrawal

### NFTBoundValidator
- **Contract**: `src/NFTBoundValidator.sol`
- **Purpose**: Kernel plugin for NFT-based authentication
- **Key Features**:
  - Validates signatures from NFT owners
  - Works with ERC-4337 UserOperations
  - Supports ERC-1271 signature validation
  - Automatically respects NFT transfers

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd nft-wallet

# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test
```

## Deployment

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Fill in your private key and other settings in `.env`

3. Deploy to testnet:
```bash
# Deploy to Sepolia
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify

# Deploy to local network
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

## Usage

### Minting a Wallet NFT

```solidity
// Contract interaction
uint256 mintingFee = factory.mintingFee(); // 0.01 ETH by default
(uint256 tokenId, address wallet) = factory.mintWallet{value: mintingFee}(recipient);
```

### Using the Wallet

Once you own an NFT, you control the corresponding wallet:

1. **Sign UserOperations**: Use your private key to sign transactions for the wallet
2. **Execute Transactions**: Send UserOperations through any ERC-4337 bundler
3. **Transfer Control**: Transfer the NFT to transfer wallet control instantly

### Getting Wallet Address

```solidity
// Get wallet address for any token ID (even before minting)
address wallet = factory.getWalletAddress(tokenId);
```

### NFT Metadata

The NFT metadata is fully on-chain and OpenSea-compatible:
- **Individual NFTs**: Dynamic metadata with wallet stats
  - Wallet address (full address in attributes)
  - Current ETH balance (with display_type: number)
  - Transaction count/nonce (with display_type: number)
  - Chain ID, Kernel version, account type
  - Beautiful gradient SVG with wallet icon
- **Collection**: `contractURI()` for collection-level metadata
  - Collection name, description, and image
  - External link and seller fee configuration

## Testing

```bash
# Run all tests
forge test

# Run tests with verbosity
forge test -vv

# Run specific test file
forge test --match-contract NFTWalletFactoryTest

# Run with gas reporting
forge test --gas-report
```

## Gas Costs

Approximate gas costs on mainnet:

| Operation | Gas Cost |
|-----------|----------|
| Mint NFT + Deploy Wallet | ~200k |
| Transfer NFT | ~50k |
| UserOp Validation | ~50k overhead |
| SVG Generation | ~100k |

## Security Considerations

1. **Immutable Binding**: Once deployed, the validator cannot be changed
2. **NFT = Control**: Whoever owns the NFT controls the wallet completely
3. **No Recovery**: Lost NFT = lost wallet access (design feature)
4. **Instant Transfer**: No time delays or confirmations when transferring NFTs

## Contract Addresses

### Mainnet
- EntryPoint: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`
- NFTWalletFactory: TBD
- NFTBoundValidator: TBD

### Sepolia Testnet
- EntryPoint: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`
- NFTWalletFactory: TBD
- NFTBoundValidator: TBD

## Development

### Project Structure

```
├── src/
│   ├── NFTWalletFactory.sol      # Main factory + ERC721
│   ├── NFTBoundValidator.sol     # Kernel plugin
│   └── interfaces/
│       └── INFTWalletFactory.sol # Factory interface
├── test/
│   ├── NFTWalletFactory.t.sol    # Factory tests
│   └── NFTBoundValidator.t.sol   # Validator tests
├── script/
│   └── Deploy.s.sol              # Deployment script
└── lib/                          # Dependencies
    ├── solady/                   # Gas-optimized utilities
    ├── kernel/                   # Kernel v3.3 smart accounts
    └── forge-std/                # Testing framework
```

### Key Dependencies

- **Solady**: Gas-optimized implementations of ERC721, cloning, etc.
- **Kernel**: ZeroDev's account abstraction framework
- **Account Abstraction**: ERC-4337 implementation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Audit Status

⚠️ **Not Audited**: These contracts have not been professionally audited. Use at your own risk.

## Support

For questions and support:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the test files for usage examples