import {
  combineLatest,
  concat,
  firstValueFrom,
  from,
  map,
  Observable,
  pipe,
  tap,
} from "rxjs";
import {
  DeployedHydraStakeOnchainContract,
  DeploymentParams,
  DerivedHydraStakeContractState,
  HydraStakeContract,
  HydraStakeContractProviders,
  hydraStakePrivateStateId,
} from "./common-types.js";
import {
  ContractAddress,
  encodeCoinPublicKey,
  encodeContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  FinalizedCallTxData,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import {
  Contract,
  ledger,
  witnesses,
  type ShieldedCoinInfo,
  createHydraStakePrivateState,
  HydraStakePrivateState,
} from "@repo/hydra-stake-protocol";
import { type Logger } from "pino";
import * as utils from "./utils.js";
import {
  nativeToken,
  encodeRawTokenType,
  rawTokenType,
} from "@midnight-ntwrk/ledger-v7";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";

const HydraStakeContractInstance: HydraStakeContract = new Contract(witnesses);

export interface DeployedHydraAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state: Observable<DerivedHydraStakeContractState>;
  removeAdmin: (
    cPk: string,
  ) => Promise<FinalizedCallTxData<HydraStakeContract, "removeNewAdmin">>;
  addNewAdmin: (
    cPk: string,
  ) => Promise<FinalizedCallTxData<HydraStakeContract, "addNewAdmin">>;
  delegate: () => Promise<FinalizedCallTxData<HydraStakeContract, "delegate">>;
  redeem: (
    amount: number,
  ) => Promise<FinalizedCallTxData<HydraStakeContract, "redeem">>;
  setMintTokenColor: () => Promise<
    FinalizedCallTxData<HydraStakeContract, "setTokenColor">
  >;
  stake: (
    amount: number,
  ) => Promise<FinalizedCallTxData<HydraStakeContract, "stake">>;
}

export class HydraAPI implements DeployedHydraAPI {
  deployedContractAddress: string;
  state: Observable<DerivedHydraStakeContractState>;

  /**
   * @param allReadyDeployedContractState
   * @param logger becomes accessible s if they were decleared as static properties as part of the class
   */
  private constructor(
    providers: HydraStakeContractProviders,
    public readonly allReadyDeployedContract: DeployedHydraStakeOnchainContract,
    private logger?: Logger,
  ) {
    this.deployedContractAddress =
      allReadyDeployedContract.deployTxData.public.contractAddress;

    // Set the state property
    this.state = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, {
            type: "all",
          })
          .pipe(
            map((contractState) => ledger(contractState.data)),
            tap((ledgerState) =>
              logger?.trace({
                ledgerStaeChanged: {
                  ledgerState: {
                    ...ledgerState,
                  },
                },
              }),
            ),
          ),
        concat(
          from(providers.privateStateProvider.get(hydraStakePrivateStateId)),
        ),
      ],
      (ledgerState, privateState) => {
        return {
          totalMint: ledgerState.total_stAsset_Minted,
          protocolTVL: ledgerState.protocolTVL,
          mintTokenColor: utils.uint8arraytostring(
            ledgerState.stAssetCoinColor,
          ),
          delegationContractAddress: utils.uint8arraytostring(
            ledgerState.delegationContractAddress,
          ),
          superAdmin: toHex(ledgerState.superAdmin),
          admins: utils.createDerivedAdminArray(ledgerState.admins),
          stakePoolStatus: ledgerState.stakePoolStatus,
          stakings: utils.createArrayFromLedgerMapping(ledgerState.stakings),
          validAssetCoinType: utils.uint8arraytostring(
            ledgerState.validAssetCoinType,
          ),
          scaleFactor: ledgerState.SCALE_FACTOR,
          depositAmount: privateState
            ? privateState?.stakeMetadata.deposit_amount
            : 0n,
          stAssetMinted: privateState
            ? privateState?.stakeMetadata.stAssets_minted
            : 0n,
          redeemable: privateState
            ? privateState?.stakeMetadata.redeemable
            : 0n,
        };
      },
    );
  }

  static async deployHydraStakeContract(
    providers: HydraStakeContractProviders,
    deploymentParams: DeploymentParams,
    logger?: Logger,
  ): Promise<HydraAPI> {
    logger?.info("deploy contract");
    const deployedContract = await deployContract<HydraStakeContract>(
      providers,
      {
        contract: HydraStakeContractInstance,
        initialPrivateState: await HydraAPI.getPrivateState(providers),
        privateStateId: hydraStakePrivateStateId,
        args: [
          utils.randomNonceBytes(32, logger),
          encodeRawTokenType(nativeToken().raw),
          utils.pad(deploymentParams.mintDomain, 32),
          encodeContractAddress(deploymentParams.deleglationContractAddress),
          deploymentParams.scaleFactor,
        ],
      },
    );

    logger?.trace("Deployment successful", {
      contractDeployed: {
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    return new HydraAPI(providers, deployedContract, logger);
  }

  static async joinHydraStakeContract(
    providers: HydraStakeContractProviders,
    contractAddress: string,
    logger?: Logger,
  ): Promise<HydraAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });
    const existingContract = await findDeployedContract<HydraStakeContract>(
      providers,
      {
        contract: HydraStakeContractInstance,
        contractAddress: contractAddress,
        privateStateId: hydraStakePrivateStateId,
        initialPrivateState: await HydraAPI.getPrivateState(providers),
      },
    );

    logger?.trace("Found Contract...", {
      contractJoined: {
        finalizedDeployTxData: existingContract.deployTxData.public,
      },
    });
    return new HydraAPI(providers, existingContract, logger);
  }

  coin(amount: number): ShieldedCoinInfo {
    return {
      color: encodeRawTokenType(nativeToken().tag),
      nonce: utils.randomNonceBytes(32),
      value: BigInt(amount),
    };
  }

  stCoin(amount: number): ShieldedCoinInfo {
    return {
      color: encodeRawTokenType(
        rawTokenType(
          utils.pad("hydra:htDUST", 32),
          this.deployedContractAddress,
        ),
      ),
      nonce: utils.randomNonceBytes(32),
      value: BigInt(amount),
    };
  }

  async setMintTokenColor(): Promise<
    FinalizedCallTxData<HydraStakeContract, "setTokenColor">
  > {
    const txData = await this.allReadyDeployedContract.callTx.setTokenColor();

    this.logger?.trace({
      transactionAdded: {
        circuit: "setTokenColor",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async stake(
    amount: number,
  ): Promise<FinalizedCallTxData<HydraStakeContract, "stake">> {
    const scaleFactor = await firstValueFrom(
      this.state.pipe(map((state) => Number(state.scaleFactor))),
    );
    const txData = await this.allReadyDeployedContract.callTx.stake(
      this.coin(scaleFactor * amount),
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "stake",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async redeem(
    amount: number,
  ): Promise<FinalizedCallTxData<HydraStakeContract, "redeem">> {
    const scaleFactor = await firstValueFrom(
      this.state.pipe(map((state) => Number(state.scaleFactor))),
    );
    const txData = await this.allReadyDeployedContract.callTx.redeem(
      this.stCoin(scaleFactor * amount),
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "redeem",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async delegate(): Promise<
    FinalizedCallTxData<HydraStakeContract, "delegate">
  > {
    console.log("Retrieved scale factor");
    const txData = await this.allReadyDeployedContract.callTx.delegate();

    this.logger?.trace({
      transactionAdded: {
        circuit: "delegate",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async addNewAdmin(
    cPk: string,
  ): Promise<FinalizedCallTxData<HydraStakeContract, "addNewAdmin">> {
    const txData = await this.allReadyDeployedContract.callTx.addNewAdmin(
      utils.hexStringToUint8Array(cPk),
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "addNewAdmin",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async removeAdmin(
    cPk: string,
  ): Promise<FinalizedCallTxData<HydraStakeContract, "removeNewAdmin">> {
    const txData = await this.allReadyDeployedContract.callTx.removeNewAdmin(
      utils.hexStringToUint8Array(cPk),
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "removeNewAdmin",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  // Used to get the private state from the wallets privateState Provider
  private static async getPrivateState(
    providers: HydraStakeContractProviders,
  ): Promise<HydraStakePrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(
      hydraStakePrivateStateId,
    );
    return (
      existingPrivateState ??
      createHydraStakePrivateState(utils.randomNonceBytes(32))
    );
  }
}

export * as utils from "./utils.js";

export * from "./common-types.js";
