import { Request, Response } from "express";
import { deployNewStakeContract } from "../services/contract-service.js";


export async function handleDeploy(req: Request, res: Response) {

    try {
        const api = await deployNewStakeContract();
        if (!api) {
            res.status(404).send({
                message: "Failed to deploy new contract"
            })
        }

        return res.status(200).send({
            message: "success",
            contractAddress: api?.deployedContractAddress
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Stake route failed:", error);
        return res.status(500).send({
            message,
        });
    }
}
