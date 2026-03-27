import { Request, Response } from "express";
import { contractApi } from "../services/contract-service.js";

type StakeRequestBody = {
    amount: bigint | string | number;
    encAddress: Uint8Array;
    lock_until_epoch: bigint | string | number;
};

export async function handleStake(req: Request, res: Response) {
    const stake: StakeRequestBody = req.body;

    if (contractApi == undefined) {
        res.status(404).send({
            message: "Contract Not Found",
        })
    }

    if (stake.amount == undefined || stake.encAddress == undefined || stake.lock_until_epoch == undefined) {
        res.status(503).send({
            message: "Invalid parameters",
        })
    }

    try {
        const txData = await contractApi?.callTx(
            "stake",
            BigInt(stake.amount),
            BigInt(stake.lock_until_epoch),
            stake.encAddress
        )

        if (txData?.public.status == "FailEntirely") {
            res.status(404).send({
                message: "Bad request",
            })
        }

        res.status(200).send({
            message: "success"
        });
    } catch (error) {
        res.status(500).send({
            message: "Internal Server Error",
        })
    }
}
