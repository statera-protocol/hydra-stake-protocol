import * as dotenv from "dotenv";
import createApp from "./app.js";
import { connectToDB } from "./model/db.js";
import { connectToWallet } from "./services/wallet-service.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { establishContractConnection } from "./services/contract-service.js";
import { firstValueFrom } from "rxjs";
import { ledger } from "./contract-build/managed/night-staking/contract/index.js";
import { toHex } from "@midnight-ntwrk/compact-runtime";

dotenv.config();
const SERVER_PORT = process.env.SERVER_PORT ?? 8080;

setNetworkId("preview");

const app = createApp();

(async () => {
    try {
        const { isWalletConnected, connectedWallet } = await connectToWallet();

        if (!isWalletConnected && connectedWallet == undefined) {
            throw new Error("Failed to establish a wallet connection");
        }   

        const api = await establishContractConnection();
        console.log(`Joined contract at: ${api.deployedContractAddress}`)
        const [pubState, _] = await firstValueFrom(api.contractState)
        const ledgerState = ledger(pubState.data);
        console.log(`Joined contract state: `, {
            EPOCH_DUARATION: ledgerState.EPOCH_DURATION,
            START_TIME: ledgerState.START_TIME,
            satkes: ledgerState.stakes,
            currentEpoch: ledgerState.currentEpoch,
            adminSignature: toHex(ledgerState.adminSignature)
        });
        await connectToDB();
        app.listen(SERVER_PORT, (error) => {
            if (error) throw new Error(`Unable to start server`);
            console.log(`Server listening at: ${SERVER_PORT}`);
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occured";
        throw (errorMessage);
    }
})();