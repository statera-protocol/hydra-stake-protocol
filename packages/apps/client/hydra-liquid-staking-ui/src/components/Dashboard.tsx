import { Zap, Lock, Wallet, TrendingUp, DollarSign, Award, Loader2 } from "lucide-react";
import PoolCard from "./PoolCard";
import { useContext, useEffect } from "react";
import { DappContext } from "../contextProviders/DappContextProvider";
import useDeployment from "@/hooks/useDeployment";
import useNewMidnightWallet from "@/hooks/useMidnightWallet";

const Dashboard = () => {
  const deploymentCtx = useDeployment();
  const walletCtx = useNewMidnightWallet();
  const { setNotification, setIsStakingOpen } = useContext(DappContext)!;
  // const [_, setIsRedeeming] = useState<boolean>(false);
  const SCALE_FACTOR = deploymentCtx?.contractState
    ? deploymentCtx?.contractState.scaleFactor
    : BigInt(1_000_000);

  // Redeem handler
  // const handleRedeemStake = async () => {
  //   setIsRedeeming(true);
  //   try {
  //     if (!deploymentCtx?.deployedHydraAPI) {
  //       return;
  //     }

  //     await deploymentCtx?.deployedHydraAPI.redeem(
  //       Number(deploymentCtx?.privateState?.stakeMetadata.stAssets_minted)
  //     );

  //     setNotification({
  //       type: "success",
  //       message: "Redeemed successfully"
  //     })

  //     setIsRedeeming(false);
  //   } catch (error) {
  //     console.log({ error });
  //     setNotification({
  //       type: "error",
  //       message: "Failed to redeemed"
  //     })
  //     setIsRedeeming(false);
  //   }
  // };

  useEffect(() => {
    (async () => {
      if(walletCtx?.state.hasConnected){
        try {
          await deploymentCtx?.onJoinContract()
          setNotification({
            type: "success",
            message: "Joined contract successfully"
          })
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          setNotification({
            type: "error",
            message: errMsg
          })
        }finally{

        }
      }
    })();
  }, [walletCtx?.state])

  
  if (deploymentCtx?.isJoining) {
    return <div className="w-full h-screen flex items-center justify-center">
      <Loader2 className="fill-[#00d9ff] animate-spin h-32 w-32" />
    </div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="glass glass-hover rounded-2xl p-8 border border-border/50">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-foreground to-accent bg-clip-text text-transparent mb-2">
                  Welcome Back
                </h1>
                <p className="text-muted-foreground text-lg">
                  Maximize your crypto returns with our liquid staking protocol
                </p>
              </div>
              <button
                onClick={() => {
                  walletCtx?.hasConnected
                    ? setIsStakingOpen(true)
                    : setNotification({
                        type: "error",
                        message: "Connect wallet to stake",
                      });
                }}
                className="px-8 py-3 bg-accent text-accent-foreground rounded-xl font-semibold hover:shadow-lg hover:glow-accent-hover transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Zap className="w-5 h-5" />
                Start Staking
              </button>
            </div>
          </div>

          {/* User Personal Stats */}
          {walletCtx?.hasConnected && (
            <div className="glass rounded-3xl p-8 border border-cyan-500/20 bg-linear-to-br from-cyan-950/40 via-blue-950/20 to-transparent">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Wallet className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Your Portfolio
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="glass glass-hover rounded-2xl p-6 border border-purple-500/30 bg-linear-to-br from-purple-500/5 to-transparent">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-300">
                      stAsset Minted
                    </h3>
                  </div>
                  {deploymentCtx?.isJoining ? (
                    <div className="h-9 w-32 bg-purple-500/10 animate-pulse rounded" />
                  ) : (
                    <p className="text-3xl font-bold text-white mb-1">
                      {deploymentCtx?.contractState ? (deploymentCtx?.contractState?.stAssetMinted / SCALE_FACTOR) :
                        0}
                      sttDUST
                    </p>
                  )}
                </div>

                <div className="glass glass-hover rounded-2xl p-6 border border-emerald-500/30 bg-linear-to-br from-emerald-500/5 to-transparent">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-300">
                        Stake total
                    </h3>
                  </div>
                  {deploymentCtx?.isJoining ? (
                    <div className="h-9 w-32 bg-emerald-500/10 animate-pulse rounded" />
                  ) : (
                    <p className="text-3xl font-bold text-white mb-1">
                      {deploymentCtx?.contractState ? (deploymentCtx?.contractState?.depositAmount / SCALE_FACTOR) : 0 } {" "}
                      tDUST
                    </p>
                  )}
                </div>

                <div className="glass glass-hover rounded-2xl p-6 border border-amber-500/30 bg-linear-to-br from-amber-500/5 to-transparent">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-300">
                      Total Rewards
                    </h3>
                  </div>
                  {deploymentCtx?.isJoining ? (
                    <div className="h-9 w-32 bg-amber-500/10 animate-pulse rounded" />
                  ) : (
                    <p className="text-3xl font-bold text-white mb-1">
                      {deploymentCtx?.contractState ? (deploymentCtx?.contractState?.redeemable / SCALE_FACTOR) : 0} {" "}
                      tDUST
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pools Section */}
          <div className="glass rounded-3xl p-8 border border-blue-500/20 bg-linear-to-br from-blue-950/40 via-indigo-950/20 to-transparent">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2 justify-center">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Pools
                </h2>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Pools
              </h2>
            </div>
            <div className="flex flex-col justify-center items-center w-full gap-4">
              <PoolCard
                token="tDUST/sttDUST"
                title="tDUST Pool"
                icon={<Lock className="w-5 h-5 text-blue-400" />}
              />
            </div>
          </div>

          {/* Protocol Stats Grid */}
          <div className="glass rounded-3xl p-8 border border-indigo-500/20 bg-linear-to-br from-indigo-950/40 via-slate-950/20 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <TrendingUp className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Protocol Statistics
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass glass-hover rounded-2xl p-6 border border-green-500/30 bg-linear-to-br from-green-500/5 to-transparent">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Lock className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300">
                    Pool Status
                  </h3>
                </div>
                {deploymentCtx?.isJoining ? (
                  <div className="h-9 w-32 bg-green-500/10 animate-pulse rounded" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-white capitalize mb-1">
                      {deploymentCtx?.contractState?.stakePoolStatus === 0
                        ? "Available"
                        : "Delegated"}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <p className="text-sm text-green-400">Active</p>
                    </div>
                  </>
                )}
              </div>

              <div className="glass glass-hover rounded-2xl p-6 border border-blue-500/30 bg-linear-to-br from-blue-500/5 to-transparent">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300">
                    Total stAsset Minted
                  </h3>
                </div>
                {deploymentCtx?.isJoining ? (
                  <div className="h-9 w-20 bg-blue-500/10 animate-pulse rounded" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-white mb-1">
                      {String(
                        deploymentCtx?.contractState
                          ? deploymentCtx?.contractState.totalMint /
                              SCALE_FACTOR
                          : 0
                      )}
                    </p>
                    <p className="text-sm text-blue-400">sttDUST</p>
                  </>
                )}
              </div>

              <div className="glass glass-hover rounded-2xl p-6 border border-violet-500/30 bg-linear-to-br from-violet-500/5 to-transparent">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Wallet className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300">
                    Protocol TVL
                  </h3>
                </div>
                {deploymentCtx?.isJoining ? (
                  <div className="h-9 w-24 bg-violet-500/10 animate-pulse rounded" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-white mb-1">
                      {String(
                        deploymentCtx?.contractState
                          ? deploymentCtx?.contractState.protocolTVL.value /
                              SCALE_FACTOR
                          : 0
                      )}
                    </p>
                    <p className="text-sm text-violet-400">tDUST</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass glass-hover rounded-2xl p-6 border border-border/50">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent glow-accent" />
                Staking Growth
              </h3>
            </div>

            <div className="glass glass-hover rounded-2xl p-6 border border-border/50">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent glow-accent" />
                Weekly Rewards
              </h3>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
