"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/context/WalletContext";
import { Loader2, Wallet } from "lucide-react";

export function WalletButton() {
  const { isConnected, walletAddress, connect, disconnect, isConnecting } =
    useWallet();

  if (isConnected && walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Connected</p>
          <p className="text-sm font-mono truncate max-w-xs">
            {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
          </p>
        </div>
        <Button
          onClick={disconnect}
          variant="outline"
          size="sm"
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect} className="gap-2 bg-primary hover:bg-primary/90">
      {isConnecting ? (
        <div className="flex justify-center item-center w-full">
          <Loader2 color="#ffffff " className="w-4 h-4 animate-spin delay-100"/>
        </div>
      ) : (
        <div className="flex justify-center item-center w-full">
          <Wallet className="w-4 h-4" />
          Connect Lace Wallet
        </div>
      )}
    </Button>
  );
}
