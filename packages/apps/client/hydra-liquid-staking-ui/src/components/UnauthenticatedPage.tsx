import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Info, Loader2, Wallet, Zap } from "lucide-react";
import { Badge } from "./ui/badge";
import useChrome from "../hooks/useChrome";
import useNewMidnightWallet from "@/hooks/useMidnightWallet";
import useDeployment from "@/hooks/useDeployment";

const UnauthenticatedPage = () => {
  const walletCtx = useNewMidnightWallet();
  const deploymentCtx = useDeployment();
  const isChromeBrowser = useChrome();

  if (!isChromeBrowser) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in flex justify-center items-center p-4">
        <Card className="relative w-full max-w-md px-8 py-14 text-center flex flex-col justify-center items-center gap-6 overflow-hidden backdrop-blur-xl border bg-linear-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 shadow-lg shadow-cyan-500/10 animate-slide-in">
          <div className="p-6 bg-linear-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Zap className="w-16 h-16 text-white" />
          </div>
          <h3 className="text-3xl font-bold">
            Welcome to Hydra Staking Platform
          </h3>
          <p className="text-md text-zinc-100">
            Midnight's most reliable Liquid Staking Protocol. Connect your
            wallet and get onboarded straight away
          </p>
          <Badge className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            <p>
              The Application only works on Chrome Browser, Try again using
              Chrome
            </p>
          </Badge>
          <Button
            onClick={() => {
              window.open("https://www.google.com/chrome/", "_blank");
            }}
            className="gap-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25 cursor-pointer"
          >
            Not installed? Download Chrome Now
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in flex justify-center items-center p-4">
      <Card className="relative w-full max-w-md px-8 py-14 text-center flex flex-col justify-center items-center gap-6 overflow-hidden backdrop-blur-xl border bg-linear-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 shadow-lg shadow-cyan-500/10 animate-slide-in">
        <div className="p-6 bg-linear-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
          <Wallet className="w-16 h-16 text-white" />
        </div>
        <h3 className="text-3xl font-bold">
          Welcome to Hydra Staking Platform
        </h3>
        <p className="text-md text-zinc-100">
          Midnight's most reliable Liquid Staking Protocol. Connect your wallet
          and get onboarded straight away
        </p>
        <Button
          onClick={async () => {
            await walletCtx?.connectFn();
            await deploymentCtx?.onJoinContract();
          }}
          className="gap-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-cyan-500/25"
        >
          {walletCtx?.isConnecting ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </>
          )}
        </Button>
      </Card>
    </div>
  );
};

export default UnauthenticatedPage;
