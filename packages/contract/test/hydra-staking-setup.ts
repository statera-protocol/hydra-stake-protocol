import {
  type CircuitContext,
  CircuitResults,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext,
  dummyContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import {
  ShieldedCoinInfo,
  Contract,
  ledger,
  type Ledger,
} from "../src/managed/hydra-stake-protocol/contract/index.js";
import {
  type HydraStakePrivateState,
  createHydraStakePrivateState,
  witnesses,
} from "../src/witnesses";
import {
  encodeContractAddress,
  unshieldedToken,
  encodeRawTokenType,
  nativeToken,
  rawTokenType
} from "@midnight-ntwrk/ledger-v7";
import { pad, randomBytes } from "./utils";

export class HydraStakeSimulator {
  readonly contract: Contract<HydraStakePrivateState>;
  turnContext: CircuitContext<HydraStakePrivateState>;
  updateUserPrivateState: (newPrivateState: HydraStakePrivateState) => void;
  readonly SCALE_FACTOR: number;
  readonly contractAddress: string;
  readonly delegationContractAddress =
    sampleContractAddress()

  constructor(privateState: HydraStakePrivateState) {
    this.contract = new Contract(witnesses);
    const {
      currentContractState,
      currentPrivateState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext(privateState, "0".repeat(64)),
      randomBytes(32),
      encodeRawTokenType(nativeToken().raw),
      pad("hydra:htDUST", 32),
      encodeContractAddress(this.delegationContractAddress), // Dummy testnet third party delegation wallet address
      BigInt(1_000_000)
    );
    this.contractAddress = dummyContractAddress();
    this.updateUserPrivateState = (
      newPrivateState: HydraStakePrivateState
    ) => {};
    this.turnContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
    )

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
    return ledger(this.turnContext.currentQueryContext.state);
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

  coin(amount: number): ShieldedCoinInfo {
    return {
      color: encodeRawTokenType(nativeToken().raw),
      nonce: randomBytes(32),
      value: BigInt(amount),
    };
  }

  stCoin(amount: number): ShieldedCoinInfo {
    return {
      color: encodeRawTokenType(
        rawTokenType(pad("hydra:htDUST", 32), this.contractAddress)
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
