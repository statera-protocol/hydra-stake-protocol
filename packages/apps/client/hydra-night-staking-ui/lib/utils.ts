import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import axios from "axios";
import AxiosInstance from './axios-config';
import { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { unshieldedToken } from "@midnight-ntwrk/ledger-v7";
import { Stake } from '@/contract-build/managed/night-staking/contract';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getStakePosition(encAddress: string) {
  const response = await AxiosInstance.get("/stakes", {
    data: {
      encAddress
    }
  });

  return response.data;
}

export async function stake(
  walletApi: ConnectedAPI,
  color: string,
  stakeDetails: {
    amount: number,
    lock_until_epoch: number,
    encAddress: string
  },
  recipient: string
) {

  const transferTx = await walletApi.makeTransfer([{
    kind: "unshielded",
    type: color,
    value: BigInt(stakeDetails.amount),
    recipient
  }]);

  if (!transferTx.tx) {
    console.error(`Failed transaction`);
  }

  const response: Stake = await AxiosInstance.post("/stakes", {
    data: stakeDetails
  });

  return response;
}