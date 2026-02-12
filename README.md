# Hydra Stake Protocol

> The only liquid staking protocol on Midnight

[![Midnight](https://img.shields.io/badge/Built%20on-Midnight-purple.svg)](https://midnight.network)

## Overview

Hydra Stake Protocol is a privacy-preserving liquid staking solution built on Midnight blockchain. It allows users to stake their assets while maintaining liquidity through liquid staking tokens (LST), enabling participation in DeFi while earning staking rewards.

## Features

### 🔓 Unlocks Liquidity for Staked Assets

Stake your assets and receive liquid derivative tokens (LST) that can be used across DeFi protocols while your underlying assets continue earning staking rewards.

### 💰 Improves Capital Efficiency

Maximize yield by earning multiple returns with a single token - combine staking rewards with DeFi opportunities.

### 🔗 Enables DeFi Composability

Use your liquid staking tokens (LSTs) across the DeFi ecosystem:

- Lending protocols
- Borrowing markets
- Yield farming
- Liquidity pools
- Derivatives markets

This deepens liquidity and strengthens the entire DeFi economy.

## Architecture

### Privacy-First Design

Hydra leverages Midnight's zero-knowledge primitives to provide unprecedented privacy in liquid staking:

#### 1. **Private Staking with Compact Witnesses**

- Staking deposits and unstake requests use private witness inputs
- Amounts never appear on-chain in plaintext
- ZK proofs verify deposit/withdrawal correctness while updating shielded state
- Per-user stake amounts remain completely private

#### 2. **Public LST with Private Backing**

- Liquid staking tokens (sttDust) are publicly tradable and DeFi-composable
- Underlying staking balances are stored in Midnight's shielded state
- LST accounting is public for usability; mint/redemption proofs are private
- Users present ZK proofs of ownership without revealing amounts

#### 3. **Selective Disclosure for Compliance**

- Built-in selective disclosure APIs for auditing
- Users can prove claims like "I hold ≥ X LST" without revealing identity
- Compliance-friendly without sacrificing privacy
- Auditors can verify total staked amounts without accessing individual balances

#### 4. **Shielded Validator Delegation**

- Validator allocations remain private in shielded state
- Prevents inference of delegation patterns from large holders
- Internal slashing checks with public proof of correct validator updates
- No raw delegation assignments exposed on-chain

## Project Structure

```
turborepo-root/
├── packages/
│   ├── ui/                           # Frontend application (Vite + React)
│   │   ├── src/
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── api/                          # Backend API service
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── contract/                     # Smart contracts
│   │   ├── Admin.compact            # Admin contract
│   │   ├── GlobalStatesAndWitnesses.compact  # Global states contract
│   │   ├── hydra-stake-protocol.compact      # Hydra staking protocol
│   │   ├── utils.compact            # Contract utilities
│   │   ├── witnesses.ts             # Witness definitions
│   │   └── package.json
│   │
│   └── cli/                          # Command-line interface tool
│       ├── src/
│       └── package.json
│
├── turbo.json                        # Turborepo configuration
├── package.json                      # Root package.json
└── README.md                        
```

## Technology Stack

### Smart Contracts

- **Language**: Compact (Midnight's ZK contract language)
- **Runtime**: `@midnight-ntwrk/compact-runtime`
- **Proof Generation**: Midnight proof server (local)

### Client Integration

- **SDK**: MidnightJS
- **Wallet**: Midnight Lace Wallet integration
- **Witness Generation**: Client-side using Compact Runtime

### Security Architecture

#### Client-Side Security

All sensitive operations happen locally:

- Witness generation (stake amounts, stake asset minted amount) in browser
- ZK proof generation via Midnight proof server
- Secure RPC endpoints for proof submission

#### Wallet Integration

Midnight Lace Wallet provides:

- 🔐 Private key management
- ✅ Consent screens for ZK witness creation
- ✍️ Proof signing and verification
- 🛡️ Protection against witness tampering

## Getting Started

### Prerequisites

- Midnight Lace Wallet installed
- Minimum balance: [TBD]
- Supported network: Testnet

### Installation

```bash
# Clone the repository
git clone https://github.com/TechMartins72/hydra-stake-protocol.git

# Install dependencies
cd hydra-stake-protocol
yarn install
```

## Development

### Running Locally

```bash
#move into UI package
cd packages/ui

# copy the .env.example into an actual .env file
cp .env.example .env
# Edit .env with your settings

# builds the ui and it dependency
yarn build

# starts your app
yarn start
# Your app should be running on localhost at port: 8080

```

### Accepted assets
- tDUST

### Quick Start

1. **Connect Wallet**
   - Open the dApp and connect your Midnight Lace Wallet
   - Approve the connection request

2. **Stake Assets**
   - Enter the amount of tDUST you want to stake
   - Approve the transaction in Lace Wallet
   - Receive sttDust tokens in your wallet

3. **Unstake (when needed)**
   - Click the redeem button on the dashboard
   - Redeem your original assets

### Audits

- [ ] Pending security audit
- [ ] Bug bounty program: [Coming soon]

### Known Limitations

- No delegation third party:
- Admin functionalities not fully implemented
- KYC not implemented

## Roadmap

- [x] Core staking/unstaking functionality
- [x] Midnight Lace Wallet integration
- [ ] Security audit
- [ ] Mainnet launch
- [ ] DeFi protocol integrations
- [ ] Governance token and DAO
- [ ] Multi-validator support

## Contributors

- [@techmartins](https://github.com/TechMartins72)
- [@codebigint](https://github.com/codeBigInt)
- [@musalawal](https://github.com/musalawal04)
- [@nescampos](https://github.com/nescampos)
- [@scisamir](https://github.com/scisamir)

## Acknowledgments

Built with ❤️ on Midnight blockchain

- [Midnight Network](https://midnight.network)
- [Midnight Developer Docs](https://docs.midnight.network)

---