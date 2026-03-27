export const DEPLOY_OR_JOIN_QUESTION = `
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║           Do you want to deploy or join a contract?          ║
    ╚══════════════════════════════════════════════════════════════╝
                   [1]. Deploy new contract
                   [2]. Join an existing contract
                   [3]. Exit CLI DApp
    ════════════════════════════════════════════════════════════════
`;

export const HEADER_BANNER = `
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║                Hydra Staking CLI Test Harness                ║
    ║                ─────────────────────────────                 ║
    ║    Interact with Night Staking and Hydra Liquid Staking      ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
`;

export const CONTRACT_SELECTION_QUESTION = `
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║                Select Contract To Interact With              ║
    ╚══════════════════════════════════════════════════════════════╝
                  [1]. Night Staking
                  [2]. Hydra Liquid Staking
                  [3]. Exit CLI DApp
    ════════════════════════════════════════════════════════════════
`;

export const CREATE_WALLET_CHOICE = `
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║              Setup CLI Wallet                                ║
    ║              ─────────────────────                           ║
    ║              1. Build a fresh wallet                         ║
    ║              2. Build wallet from mnemonic phrase (24 Words) ║
    ║              3. Build from genesis mint seed                 ║
    ║              4. Build from wallet seed                       ║
    ║              5. Exit CLI DApp                                ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
`;


export const CIRCUIT_INTERACTION_CHOICE = `
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║               Night Staking contract interface               ║
    ╚══════════════════════════════════════════════════════════════╝
                  [1]. Stake
                  [2]. Claim
                  [3]. Display public contract state
                  [4]. Display private contract state
                  [5]. Exit CLI DApp
    ════════════════════════════════════════════════════════════════
`;

export const LIQUID_STAKING_INTERACTION_CHOICE = `
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║            Hydra Liquid Staking contract interface           ║
    ╚══════════════════════════════════════════════════════════════╝
                  [1]. Stake
                  [2]. Redeem
                  [3]. Delegate
                  [4]. Receive delegate reward
                  [5]. Set token color
                  [6]. Display public contract state
                  [7]. Display private contract state
                  [8]. Exit CLI DApp
    ════════════════════════════════════════════════════════════════
`;
