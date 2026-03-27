import { useState } from "react";
import { X, Check, ChevronRight } from "lucide-react";
import ModalStep from "./ModalSteps";
import useDeployment from "@/hooks/useDeployment";

export interface StakingModalProps {
  onClose: () => void;
  onComplete: (success: boolean, message: string) => void;
  action: "stake" | "redeem";
}

export type StepType = "amount" | "confirm" | "processing" | "complete";

const StakingModal = ({ onClose, onComplete }: StakingModalProps) => {
  const deploymentCtx = useDeployment();
  const [currentStep, setCurrentStep] = useState<StepType>("amount");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, _] = useState<string>("");

  const handleCreateStake = async () => {
    if (currentStep === "amount") {
      if (!amount || Number.parseFloat(amount) <= 0) {
        onComplete(false, "Please enter a valid amount");
        return;
      }

      setCurrentStep("confirm");
    } else if (currentStep === "confirm") {
      if (!deploymentCtx?.contractState || !deploymentCtx.deployedHydraAPI) {
        return;
      }

      setCurrentStep("processing");
      setIsProcessing(true);
      await deploymentCtx?.deployedHydraAPI.stake(
        Number(amount)
      );
      setCurrentStep("complete");
    } else if (currentStep === "complete") {
      onComplete(true, `Successfully staked ${amount} tDUST!`);
      handleReset();
    }
  };

  const handleReset = () => {
    setCurrentStep("amount");
    setAmount("");
    onClose();
  };

  const handleBack = () => {
    if (currentStep === "confirm") {
      setCurrentStep("amount");
    }
  };

  const progressPercentage =
    currentStep === "amount"
      ? 33
      : currentStep === "confirm"
        ? 66
        : currentStep === "complete"
          ? 100
          : 80;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="glass rounded-2xl border border-border/50 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-in">
          {/* Header */}
          <div className="border-b border-border/50 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              Stake Your Asset
            </h2>
            <button
              onClick={handleReset}
              className="p-1 hover:bg-card rounded-lg transition-all cursor-pointer"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pt-6 pb-4">
            <div className="h-1 bg-card rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Step{" "}
              {currentStep === "amount"
                ? "1"
                : currentStep === "confirm"
                  ? "2"
                  : currentStep === "processing"
                    ? "3"
                    : "4"}{" "}
              of 4
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {currentStep === "amount" && (
              <ModalStep
                title="Enter Amount"
                subtitle={"How much would you like to stake?"}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Amount (tDUST)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-card border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        tDUST
                      </span>
                    </div>
                  </div>

                  <div className="bg-card/50 rounded-lg p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAmount("100")}
                        className="flex-1 py-2 text-xs bg-border/50 hover:bg-border rounded transition-all text-foreground cursor-pointer"
                      >
                        100 tDUST
                      </button>
                      <button
                        onClick={() => setAmount("500")}
                        className="flex-1 py-2 text-xs bg-border/50 hover:bg-border rounded transition-all text-foreground cursor-pointer"
                      >
                        500 tDUST
                      </button>
                      <button
                        onClick={() => setAmount("1000")}
                        className="flex-1 py-2 text-xs bg-border/50 hover:bg-border rounded transition-all text-foreground cursor-pointer"
                      >
                        1000
                      </button>
                    </div>
                  </div>

                  <div className="bg-accent/10 rounded-lg p-3 text-sm">
                    <p className="text-accent">
                      <span className="font-semibold">Est. Annual Yield:</span>{" "}
                      {amount &&
                        `${(Number.parseFloat(amount) * 0.184).toFixed(2)} tDUST`}
                    </p>
                  </div>
                </div>
              </ModalStep>
            )}

            {currentStep === "confirm" && (
              <ModalStep
                title={"Confirm Staking"}
                subtitle={"Review your staking details"}
              >
                <div className="space-y-4">
                  <div className="bg-card/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Amount to Stake
                      </span>
                      <span className="text-foreground font-semibold">
                        {amount} tDUST
                      </span>
                    </div>
                    <div className="border-t border-border/30" />

                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Estimated APY
                        </span>
                        <span className="text-accent font-semibold">18.4%</span>
                      </div>
                      <div className="border-t border-border/30" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Est. Annual Rewards
                        </span>
                        <span className="text-accent font-semibold">
                          {(Number.parseFloat(amount) * 0.184).toFixed(2)} tDUST
                        </span>
                      </div>
                    </>
                  </div>

                  <div className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3">
                    By confirming, you agree to lock your assets for the staking
                    period. Your rewards will be automatically compounded.
                  </div>
                </div>
              </ModalStep>
            )}

            {currentStep === "processing" && (
              <ModalStep
                title="Processing"
                subtitle={`Your staking transaction is being processed`}
              >
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
                  </div>
                  <p className="text-muted-foreground text-center text-sm">
                    Please wait while your transaction is being confirmed on the
                    blockchain...
                  </p>
                </div>
              </ModalStep>
            )}

            {currentStep === "complete" && (
              <ModalStep
                title="Staking Successful"
                subtitle="Your assets have been staked"
              >
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-accent" />
                  </div>
                  <p className="text-center text-foreground font-semibold mb-4">
                    {amount} tDUST successfully staked
                  </p>
                  <div className="w-full bg-card/50 rounded-lg p-3 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Transaction Hash:
                      </span>
                      <span className="text-accent text-xs font-mono">
                        {transactionId.substring(0, 10) + "***"}
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
          </div>

          {/* Footer */}
          <div className="border-t border-border/50 p-6 flex gap-3">
            {currentStep === "confirm" && (
              <button
                onClick={handleBack}
                className="flex-1 px-4 py-3 rounded-lg border border-border/50 text-foreground hover:bg-card transition-all font-semibold cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              onClick={handleCreateStake}
              disabled={isProcessing}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isProcessing
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

export default StakingModal;
