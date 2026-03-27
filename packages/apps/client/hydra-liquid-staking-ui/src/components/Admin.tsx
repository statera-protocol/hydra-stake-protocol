import { useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Lock,
  Plus,
  TrendingUp,
  Users,
  Wallet,
  Shield,
  Trash2,
} from "lucide-react";
import useDeployment from "@/hooks/useDeployment";

const AdminDashboard = () => {
  const deploymentCtx = useDeployment();
  const SCALE_FACTOR = deploymentCtx?.contractState ? deploymentCtx?.contractState.scaleFactor : BigInt(1_000_000);

  const [activeTab, setActiveTab] = useState("pools");
  const [newAdminAddress, setNewAdminAddress] = useState("");
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [delegateAddress, setDelegateAddress] = useState("");
  const [delegateAmount, setDelegateAmount] = useState("");
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isDelegating, setIsDelegating] = useState(false);

  // if(!deploymentCtx?.contractState) return;

  // Mock data - replace with actual data from your context
  const delegateTokens = () => {};

  const handleAddAdmin = async () => {
    try {
      setIsAddingAdmin(true);
      if (!deploymentCtx?.deployedHydraAPI) {
        return;
      }
      console.log("Removing admin...");
      await deploymentCtx?.deployedHydraAPI.removeAdmin(newAdminAddress.trim());
      alert("Admin Removed");
    } catch (error) {
      console.log(error);
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (coinPubKey: string) => {
    try {
      setIsDeleting(true);
      if (!deploymentCtx?.deployedHydraAPI) {
        return;
      }
      console.log("Deleting Admin");
      await deploymentCtx?.deployedHydraAPI.removeAdmin(coinPubKey);
      alert(`Admin ${coinPubKey}, has been added successfully`);
    } catch (error) {
      console.log(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelegate = async () => {
    try {
      setIsDelegating(true);
      if (!deploymentCtx?.deployedHydraAPI) {
        return;
      }
      console.log("Delegating stake...");
      await deploymentCtx?.deployedHydraAPI.delegate();
      alert("Stake delegated successfully");
    } catch (error) {
      console.log({ error });
    } finally {
      setIsDelegating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage stake pools and administrators
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total TVL</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {deploymentCtx?.contractState ? (deploymentCtx?.contractState?.protocolTVL.value) / SCALE_FACTOR : 0}{" "}
              <small>tDUST</small>
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">stAssets Minted</p>
              <Wallet className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {deploymentCtx?.contractState ? (deploymentCtx?.contractState?.totalMint) / SCALE_FACTOR : 0}{" "}<small>sttDUST</small>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across all pools
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Active Pools</p>
              <Lock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">1</p>
            <p className="text-xs text-muted-foreground mt-1">
              All operational
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Administrators</p>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {deploymentCtx?.contractState ? deploymentCtx?.contractState?.admins.length + 1 : 1}
            </p>
            <p className="text-xs text-muted-foreground mt-1">1 super admin</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("pools")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "pools"
                ? "text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Stake Pools
          </button>
          <button
            onClick={() => setActiveTab("admins")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "admins"
                ? "text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Administrators
          </button>
        </div>

        {/* Stake Pools Tab */}
        {activeTab === "pools" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">
                  Super Admins and admins can create new pools
                </p>
              </div>
              <button
                onClick={() => setShowAddAdmin(!showAddAdmin)}
                className="px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-all font-semibold text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Pool
              </button>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 hover:border-accent/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    tDUST
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                    tDUST Pool
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">APY</p>
                  <p className="text-2xl font-bold text-accent">12%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Value Locked
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    tDUST {deploymentCtx?.contractState ? deploymentCtx?.contractState?.protocolTVL.value / SCALE_FACTOR : 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    stAssets Minted
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    sttDUST {deploymentCtx?.contractState ? deploymentCtx?.contractState?.totalMint / SCALE_FACTOR : 0}
                  </p>
                </div>
              </div>

              <button
                onClick={delegateTokens}
                className="w-full px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-all font-semibold text-sm flex items-center justify-center gap-2"
              >
                {!isDelegating ? (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Delegate Locked Tokens
                  </>
                ) : (
                  <>
                    <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
                    </div>
                    <p>Delegating Locked Tokens</p>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Administrators Tab */}
        {activeTab === "admins" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">Super Admins cannot be removed</p>
              </div>
              <button
                onClick={() => setShowAddAdmin(!showAddAdmin)}
                className="px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-all font-semibold text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Administrator
              </button>
            </div>

            {showAddAdmin && (
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Add New Administrator
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      User coin public key
                    </label>
                    <input
                      type="text"
                      value={newAdminAddress}
                      onChange={(e) => setNewAdminAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddAdmin}
                      className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-all font-semibold"
                    >
                      {isAddingAdmin ? (
                        <div className="relative w-16 h-16 mb-4">
                          <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
                        </div>
                      ) : (
                        <p>Add Admin</p>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddAdmin(false);
                        setNewAdminAddress("");
                      }}
                      className="px-6 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-accent/10 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="bg-card border border-border rounded-lg p-6 flex items-center justify-between hover:border-accent/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-500/10">
                    <Shield className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-mono text-foreground font-medium">
                      {import.meta.env.VITE_CONTRACT_ADDRESS.substring(0, 10) + "***"}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mediumbg-purple-500/10 text-purple-500">
                      Super Admin
                    </span>
                  </div>
                </div>
              </div>
              {deploymentCtx?.contractState?.admins.map((admin, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-border rounded-lg p-6 flex items-center justify-between hover:border-accent/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent/10">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-mono text-foreground font-medium">
                        {admin.substring(0, 20) + "***"}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                          Admin
                        </span>
                      </div>
                    </div>
                    <button
                      disabled={isDeleting}
                      onClick={() => handleRemoveAdmin(admin)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-all group"
                    >
                      {isDeleting ? (
                        <div className="relative w-16 h-16 mb-4">
                          <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
                        </div>
                      ) : (
                        <Trash2 className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-all" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delegation Modal */}
      {selectedPool && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Delegate Locked Tokens
            </h3>
            <p className="text-sm text-muted-foreground mb-6">Pool:</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Amount to Delegate
                </label>
                <input
                  type="text"
                  value={delegateAmount}
                  onChange={(e) => setDelegateAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <p className="text-xs text-muted-foreground mt-1">Available:</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Third Party Address
                </label>
                <input
                  type="text"
                  value={delegateAddress}
                  onChange={(e) => setDelegateAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDelegate}
                className="flex-1 px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-all font-semibold"
              >
                Delegate
              </button>
              <button
                onClick={() => {
                  setSelectedPool(null);
                  setDelegateAmount("");
                  setDelegateAddress("");
                }}
                className="flex-1 px-6 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-accent/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
