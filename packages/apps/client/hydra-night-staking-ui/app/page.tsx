'use client';

import { WalletStateProvider, useWallet } from '@/context/WalletContext';
import { StakesProvider } from '@/context/StakesContext';
import { WalletButton } from '@/components/WalletButton';
import { PublicStakesView } from '@/components/PublicStakesView';
import { StakeDashboard } from '@/components/StakeDashboard';

function StakingAppContent() {
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">◆</span>
              </div>
              <h1 className="text-xl font-bold">Night Staking</h1>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isConnected ? <StakeDashboard /> : <PublicStakesView />}
      </main>
    </div>
  );
}

export default function StakingApp() {
  return (
    <WalletStateProvider>
      <StakesProvider>
        <StakingAppContent />
      </StakesProvider>
    </WalletStateProvider>
  );
}
