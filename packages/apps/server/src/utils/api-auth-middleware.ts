import * as dotenv from "dotenv";
import {Request, NextFunction, Response} from "express";

dotenv.config({});

const MIDDLWARE_AUTH_SECRET = process.env.MIDDLWARE_AUTH_SECRET ?? null;

export const requireApiAuthentication = (req: Request, res: Response, next: NextFunction) => {
    if(MIDDLWARE_AUTH_SECRET == undefined || MIDDLWARE_AUTH_SECRET == null) throw new Error("Unable to find api authentication secret");

    const requestHeaderAuth = req.headers["x-header-authorization"]?.toString().toLowerCase().trim() ?? "";
    const authorization = req.headers.authorization;
    const bearerToken = authorization?.startsWith(`Bearer `) ? authorization?.slice((`Bearer `).length) : "";

    const authToken = (requestHeaderAuth || bearerToken) ?? "";

    if(authToken == undefined || authToken == ""){
        res.status(401).send({
            message: "Unauthorized"
        })
    }

    next();
}
