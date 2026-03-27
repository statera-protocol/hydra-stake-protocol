"use client";

import { stake } from "@/lib/utils";
import React, { createContext, useState, useContext } from "react";
import { useWallet } from "./WalletContext";
import { unshieldedToken } from "@midnight-ntwrk/ledger-v7";
import { encodeUserAddress, toHex } from "@midnight-ntwrk/compact-runtime";

export interface Stake {
  id: string;
  address: string;
  amount: number;
  apy: number;
  startDate: Date;
  yieldEarned: number;
  isOwn?: boolean;
}

interface ContractContextType {
  stakes: Stake[];
  userStakes: Stake[];
  addStake: (amount: number, lock_duration: number) => void;
  withdrawStake: (stakeId: string, amount: number) => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

const MOCK_STAKES: Stake[] = [
  {
    id: "1",
    address: "addr1qy2p5qa0p8f2v8l7n6m5k4j3h2g1f0e9d8c7b6a5z4y3x2w1v",
    amount: 50000,
    apy: 5.5,
    startDate: new Date("2024-01-15"),
    yieldEarned: 2250,
  },
  {
    id: "2",
    address: "addr1qz3q6rb1q9g3w9m8l7k6j5i4h3g2f1e0d9c8b7a6z5y4x3w2v",
    amount: 75000,
    apy: 5.5,
    startDate: new Date("2023-12-01"),
    yieldEarned: 4125,
  },
  {
    id: "3",
    address: "addr1qx4r7sc2r0h4x0n9m8l7k6j5i4h3g2f1e0d9c8b7a6z5y4x3w2v",
    amount: 100000,
    apy: 5.5,
    startDate: new Date("2023-11-10"),
    yieldEarned: 6875,
  },
];

export function ContractProvider({ children }: { children: React.ReactNode }) {
  const [stakes, setStakes] = useState<Stake[]>(MOCK_STAKES);
  const [userStakes, setUserStakes] = useState<Stake[]>([]);
  const { walletApi, walletAddress } = useWallet();

  const addStake = async (
    amount: number,
    lock_duration: number,
  ) => {
    const PROTOCOL_ADDRESS = process.env.PROTOCOL_ADDRESS ?? "";

    if (!PROTOCOL_ADDRESS) {
      console.error(`Couldn't find protocol address`);
    }

    if (!walletApi || !walletAddress) {
      console.error(`Couldn't find connected wallet api`);
      return;
    }

    try {
      await stake(
        walletApi,
        unshieldedToken().raw,
        {
          amount,
          lock_until_epoch: lock_duration,
          encAddress: toHex(encodeUserAddress(walletAddress)),
        },
        PROTOCOL_ADDRESS,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `Unknown error occured`;
      console.error(errorMessage);
    }
  };

  const withdrawStake = (stakeId: string, amount: number) => {
    setUserStakes(
      userStakes.map((stake) =>
        stake.id === stakeId
          ? { ...stake, amount: Math.max(0, stake.amount - amount) }
          : stake,
      ),
    );
  };

  return (
    <ContractContext.Provider
      value={{ stakes, userStakes, addStake, withdrawStake }}
    >
      {children}
    </ContractContext.Provider>
  );
}

export function useStakes() {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useStakes must be used within ContractProvider");
  }
  return context;
}
