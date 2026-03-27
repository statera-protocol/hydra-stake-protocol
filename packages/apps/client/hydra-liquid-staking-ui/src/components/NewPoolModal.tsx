import { useState } from "react";
import ModalStep from "./ModalSteps";
import { Check, ChevronRight } from "lucide-react";
import type { StakingModalProps } from "./StakingModal";

type StepType = "stake-info" | "processing" | "complete";

const NewPoolModal = ({ onClose, onComplete }: Omit<StakingModalProps, "action">) => {
  const [poolName, setPoolName] = useState("");
  const [acceptableToken, setAcceptableToken] = useState("");
  const [delegationAddress, setDelegationAddress] = useState("");
  const [domainSep, setDomainSep] = useState("");
  const [scaleFactor, setScaleFactor] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [currentStep, setCurrentStep] = useState<StepType>("stake-info");

  const handleCreatePool = async () => {
    if (poolName.length < 1) {
      onComplete(false, "Please enter a valid pool name");
    }
    if (acceptableToken.length < 1) {
      onComplete(false, "Please enter a valid token color");
    }
    setCurrentStep("processing");
    try {
      setTimeout(() => {
        setCurrentStep("complete");
      }, 5000);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="glass rounded-2xl border border-border/50 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-in">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <ModalStep title="Enter Pool Information">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Pool Name
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="e.g NIGHT"
                      value={poolName}
                      onChange={(e) => setPoolName(e.target.value)}
                      className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Acceptable Token Name
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="e.g NIGHT"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Domain Seperator
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="enter CA or coinPubKey"
                      value={domainSep}
                      onChange={(e) => setDomainSep(e.target.value)}
                      className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Scale Factor
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="enter CA or coinPubKey"
                      value={scaleFactor}
                      onChange={(e) => setScaleFactor(e.target.value)}
                      className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Acceptable Token Color
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="enter CA or coinPubKey"
                      value={delegationAddress}
                      onChange={(e) => setDelegationAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Acceptable Token Color
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="enter CA or coinPubKey"
                      value={delegationAddress}
                      onChange={(e) => setDelegationAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    />
                  </div>
                </div>
              </div>
            </ModalStep>

            {currentStep === "processing" && (
              <ModalStep
                title="Processing"
                subtitle="Your staking transaction is being processed"
              >
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
                  </div>
                  <p className="text-muted-foreground text-center text-sm">
                    Please wait while your pool is being created on the
                    blockchain...
                  </p>
                </div>
              </ModalStep>
            )}

            {currentStep === "complete" && (
              <ModalStep
                title="Stake Pool Created Successfully"
                subtitle="Your pool has been created"
              >
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-accent" />
                  </div>
                  <p className="text-center text-foreground font-semibold mb-4">
                    {poolName} successfully created
                  </p>
                  <div className="w-full bg-card/50 rounded-lg p-3 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Transaction Hash:
                      </span>
                      <span className="text-accent text-xs font-mono">
                        ****************
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-accent font-semibold">
                        Confirmed
                      </span>
                    </div>
                  </div>
                </div>
              </ModalStep>
            )}
            <button
              onClick={handleCreatePool}
              disabled={currentStep === "processing"}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                currentStep === "processing"
                  ? "bg-accent/50 text-accent-foreground cursor-not-allowed"
                  : "bg-accent text-accent-foreground hover:shadow-lg hover:glow-accent-hover"
              }`}
            >
              {currentStep === "complete" ? "Done" : "Next"}
              {currentStep !== "complete" && currentStep !== "processing" && (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewPoolModal;
