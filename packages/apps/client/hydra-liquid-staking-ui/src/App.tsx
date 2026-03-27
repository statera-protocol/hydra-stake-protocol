import { useContext } from "react";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import Header from "./components/Header";
import StakingModal from "./components/StakingModal";
import NotificationCenter from "./components/NotificationCenter";
import { DappContext } from "./contextProviders/DappContextProvider";
import NewPoolModal from "./components/NewPoolModal";
import AdminDashboard from "./components/Admin";
import UnauthenticatedPage from "./components/UnauthenticatedPage";
import useNewMidnightWallet from "./hooks/useMidnightWallet";
import useDeployment from "./hooks/useDeployment";
import { Loader2 } from "lucide-react";

function App() {
  const {
    notification,
    setNotification,
    route,
    isStakingOpen,
    setIsStakingOpen,
    isOpenCreatePool,
    action,
  } = useContext(DappContext)!;
  const walletContext = useNewMidnightWallet();
  const deploymentCtx = useDeployment();

  const handleActionComplete = (success: boolean, message: string) => {
    setNotification({ type: success ? "success" : "error", message });
    setIsStakingOpen(false);
    setTimeout(() => setNotification(null), 4000);
  };

  if (deploymentCtx?.isJoining) {
    return <div className="w-full h-screen flex items-center justify-center">
      <Loader2 className="fill-[#00d9ff] animate-spin h-32 w-32" />
    </div>
  }

  return walletContext?.hasConnected ? (
    <>
      <Header />
      {route === "dashboard" && <Dashboard />}
      {route === "admin" && <AdminDashboard />}
      {isStakingOpen && (
        <StakingModal
          action={action}
          onClose={() => setIsStakingOpen(false)}
          onComplete={handleActionComplete}
        />
      )}
      {isOpenCreatePool && (
        <NewPoolModal
          onClose={() => setIsStakingOpen(false)}
          onComplete={handleActionComplete}
        />
      )}
      <NotificationCenter notification={notification} />
      <Footer />
    </>
  ) : (
    <>
      <UnauthenticatedPage />
      <NotificationCenter notification={notification} />
    </>
  );
}

export default App;
