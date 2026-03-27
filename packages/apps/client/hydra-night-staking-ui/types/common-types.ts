import { CompiledHydraNightStakingProtocol, CompiledHydraNightStakingWitness } from "@/contract-build";
import {ImpureCircuitId} from "@midnight-ntwrk/compact-js";

const nightStakingPrivateStateId = "nightStakingPrivateState";
export type NightStakingContractType = CompiledHydraNightStakingProtocol.Contract<CompiledHydraNightStakingWitness.NightStakingPrivatState, CompiledHydraNightStakingProtocol.Witnesses<CompiledHydraNightStakingWitness.NightStakingPrivatState>>;
export type NightStakingPrivateStateId = typeof nightStakingPrivateStateId;
export type CircuitKeys = ImpureCircuitId<NightStakingContractType>;