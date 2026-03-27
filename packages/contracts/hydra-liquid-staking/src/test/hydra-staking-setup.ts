import {
  CircuitContext,
  CircuitResults,
  constructorContext,
  QueryContext,
} from "@midnight-ntwrk/compact-runtime";
import {
  CoinInfo,
  Contract,
  ledger,
  Ledger,
  Witnesses,
} from "../managed/hydra-stake-protocol/contract/index.cjs";
import {
  HydraStakePrivateState,
  createHydraStakePrivateState,
  witnesses,
} from "../witnesses";
import {
  encodeContractAddress,
  encodeTokenType,
  nativeToken,
  sampleContractAddress,
  tokenType,
} from "@midnight-ntwrk/ledger";
import { pad, randomBytes } from "./utils";

export type HydraStakeContract = Contract<
  HydraStakePrivateState,
  Witnesses<HydraStakePrivateState>
>;

export class HydraStakeSimulator {
  readonly contract: HydraStakeContract;
  turnContext: CircuitContext<HydraStakePrivateState>;
  updateUserPrivateState: (newPrivateState: HydraStakePrivateState) => void;
  readonly SCALE_FACTOR: number;
  readonly contractAddress: string;
  readonly delegationContractAddress =
    "0200df7d34b0d9843ac09e18d412640a8214836c9dec943e708fde38ee2c3113975f";

  constructor(privateState: HydraStakePrivateState) {
    this.contract = new Contract(witnesses);
    const {
      currentContractState,
      currentPrivateState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(privateState, "0".repeat(64)),
      randomBytes(32),
      encodeTokenType(nativeToken()),
      pad("hydra:htDUST", 32),
      encodeContractAddress(this.delegationContractAddress), // Dummy testnet third party delegation wallet address
      BigInt(1_000_000)
    );
    this.contractAddress = sampleContractAddress();
    this.updateUserPrivateState = (
      newPrivateState: HydraStakePrivateState
    ) => {};
    this.turnContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(
        currentContractState.data,
        this.contractAddress
      ),
    };

    this.SCALE_FACTOR = 1_000_000;
  }

  //Mock deploy of statera contract
  static deployFTLendingUnshieldedContract(): HydraStakeSimulator {
    return new HydraStakeSimulator(
      createHydraStakePrivateState(randomBytes(32))
    );
  }

  public buildTurnContext(
    currentPrivateState: HydraStakePrivateState
  ): CircuitContext<HydraStakePrivateState> {
    return {
      ...this.turnContext,
      currentPrivateState,
    };
  }

  getLedgerState(): Ledger {
    return ledger(this.turnContext.transactionContext.state);
  }

  getPrivateState(): HydraStakePrivateState {
    return this.turnContext.currentPrivateState;
  }

  private updateStateAndGetLedgerState<T>(
    circuitResult: CircuitResults<HydraStakePrivateState, T>
  ): Ledger {
    this.turnContext = circuitResult.context;
    this.updateUserPrivateState(circuitResult.context.currentPrivateState);
    return this.getLedgerState();
  }

  coin(amount: number): CoinInfo {
    return {
      color: encodeTokenType(nativeToken()),
      nonce: randomBytes(32),
      value: BigInt(amount),
    };
  }

  stCoin(amount: number): CoinInfo {
    return {
      color: encodeTokenType(
        tokenType(pad("hydra:htDUST", 32), this.contractAddress)
      ),
      nonce: randomBytes(32),
      value: BigInt(amount),
    };
  }

  stake(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.stake(
        this.turnContext,
        this.coin(amount * this.SCALE_FACTOR)
      )
    );
  }

  receiveDelegateReward(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.recieveDelegateReward(
        this.turnContext,
        this.coin(amount * this.SCALE_FACTOR)
      )
    );
  }

  redeem(amount: number): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.redeem(
        this.turnContext,
        this.stCoin(amount * this.SCALE_FACTOR)
      )
    );
  }

  delegate(): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.delegate(this.turnContext)
    );
  }

  setCoinColor(): Ledger {
    return this.updateStateAndGetLedgerState(
      this.contract.impureCircuits.setTokenColor(this.turnContext)
    );
  }
}
