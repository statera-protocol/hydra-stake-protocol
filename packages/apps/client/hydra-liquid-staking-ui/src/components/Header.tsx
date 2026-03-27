import { Wallet, History, LogOut } from "lucide-react";
import { DappContext } from "../contextProviders/DappContextProvider";
import { useContext, useEffect, useState } from "react";
import useNewMidnightWallet from "@/hooks/useMidnightWallet";
import useDeployment from "@/hooks/useDeployment";

const Header = () => {
  const { setRoute, route } = useContext(DappContext)!;
  // const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const walletCtx = useNewMidnightWallet();
  const deploymentCtx = useDeployment();

  useEffect(() => {
    if (!deploymentCtx?.contractState) {
      return;
    }
    setIsSuperAdmin(() => {
      return (
        deploymentCtx?.contractState?.superAdmin ===
        import.meta.env.VITE_SUPER_ADMIN_COIN_PUBKEY
      );
    });
  });

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto py-4 flex items-center justify-between">
        <div
          onClick={() => setRoute("dashboard")}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center cursor-pointer">
            <Wallet className="w-6 h-6 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground cursor-pointer">
            Hydra Stake
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setRoute("dashboard");
              }}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                route === "dashboard"
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground hover:text-accent"
              }`}
            >
              Dashboard
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => {
                  setRoute("admin");
                }}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  route === "admin"
                    ? "bg-accent/20 text-accent"
                    : "text-muted-foreground hover:text-accent"
                }`}
              >
                <History className="w-4 h-4" />
                Admin
              </button>
            )}
          </div>
          <button
            onClick={walletCtx?.connectFn}
            className="px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-all font-semibold text-sm cursor-pointer"
          >
            {!walletCtx?.isConnecting
              ? walletCtx?.hasConnected
                ? walletCtx?.state?.address?.substring(0, 21)
                : "Connect Wallet"
              : "connecting..."}
          </button>
          {walletCtx?.hasConnected && (
            <button
              onClick={walletCtx?.disconnect}
              className="p-2 rounded-lg hover:bg-card transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-muted-foreground hover:text-accent transition-all" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
export default Header;
