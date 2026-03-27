# Hydra Stake Protocol

Privacy-focused staking apps and contracts built on Midnight.

## Overview

This repository currently contains two Midnight contract packages and the tooling around them:

- `Hydra Night Staking`: fixed-term staking flows
- `Hydra Liquid Staking`: liquid staking with stake, redeem, delegate, and reward flows
- a shared CLI that can interact with both contracts
- client apps for each staking experience
- an Express server package used for backend integration

Hydra staking currently has two tracks:

- `Hydra Liquid Staking`
  Liquid staking for different token assets, where users stake supported tokens and receive a liquid representation that can be used elsewhere in the ecosystem.
- `Hydra Night Staking`
  A NIGHT-focused staking flow intended to let users stake NIGHT to a backend wallet connected to the contract, generate DUST from those NIGHT UTXOs, and then use that DUST for downstream protocol interactions. The current design direction is per-UTXO handling for delegation and related operations.

## Repository Layout

```text
packages/
  apps/
    client/
      hydra-night-staking-ui/
      hydra-liquid-staking-ui/
    server/
  cli/
  contracts/
    hydra-night-staking/
    hydra-liquid-staking/
```

## Packages

### Contracts

- `packages/contracts/hydra-night-staking`
  Night staking Compact contract and generated bindings.
- `packages/contracts/hydra-liquid-staking`
  Liquid staking Compact contract and generated bindings.

Both contract packages expose build artifacts from `dist/` after running their local build scripts.

### CLI

- `packages/cli`

The CLI is a combined operator/developer tool for both contracts. It lets you:

- choose either Night Staking or Hydra Liquid Staking
- deploy a new contract instance or join an existing one
- call the supported circuits for the selected contract
- inspect public and private contract state

The CLI loads compiled contract bindings from:

- `packages/contracts/hydra-night-staking/dist`
- `packages/contracts/hydra-liquid-staking/dist`

Build the contract packages first before running the CLI.

### Apps

- `packages/apps/client/hydra-night-staking-ui`
  Next.js client for the night staking flow.
- `packages/apps/client/hydra-liquid-staking-ui`
  Vite/React client for the liquid staking flow.
- `packages/apps/server`
  Express server package for API and contract-integration endpoints.

## Tooling

- Package manager: `bun`
- Monorepo task runner: `turbo`
- Contract language: Compact
- Contract runtime: Midnight Compact runtime / Midnight JS

## Getting Started

### Prerequisites

- `bun`
- `turbo`
- Midnight `compact` CLI available on your `PATH`
- access to a Midnight proof server and target network, depending on the package you are running

### Install Dependencies

```bash
bun install
```

## Common Commands

From the repo root:

```bash
bun run build
bun run dev
bun run lint
bun run compact
```

## Building The Contracts

Build each contract package directly:

```bash
cd packages/contracts/hydra-night-staking
bun run build

cd ../hydra-liquid-staking
bun run build
```

Useful contract commands:

```bash
bun run compact
bun run test:compact
bun run typecheck
```

## Running The CLI

After both contracts are built:

```bash
cd packages/cli
bun install
bun run build
bun run preview
```

For local/docker-backed development:

```bash
cd packages/cli
bun run standalone
```

The CLI prompts you to:

1. create or restore a wallet
2. choose which contract to work with
3. deploy or join a contract instance
4. interact with the selected contract

## Running The Apps

### Night Staking UI

```bash
cd packages/apps/client/hydra-night-staking-ui
bun install
bun run dev
```

### Liquid Staking UI

```bash
cd packages/apps/client/hydra-liquid-staking-ui
bun install
bun run dev
```

### Server

```bash
cd packages/apps/server
bun install
bun run dev
```

## Current State

The repo is in active development. Some packages still have inconsistent naming or version alignment inherited from earlier recovery work. The current source of truth for the runtime layout is the actual package tree under `packages/`.

## Contributors

- [@techmartins](https://github.com/TechMartins72)
- [@codebigint](https://github.com/codeBigInt)
- [@musalawal](https://github.com/musalawal04)
- [@nescampos](https://github.com/nescampos)
- [@scisamir](https://github.com/scisamir)

## References

- [Midnight Network](https://midnight.network)
- [Midnight Developer Docs](https://docs.midnight.network)
