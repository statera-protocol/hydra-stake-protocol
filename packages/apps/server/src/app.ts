import express, {Request, Response} from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import stakeRoutes from "./routes/stake-routes.js";
import claimRoutes from "./routes/claim-routes.js";
import contractRoutes from "./routes/contractRoutes.js";
import { requireApiAuthentication } from "./utils/api-auth-middleware.js";

dotenv.config();
const app = express();
const API_VERSION = process.env.API_VERSION ?? "api/v1";

export default function createApp(){
    
    app.use(express.json());
    app.use(cors());
    app.use(`/${API_VERSION}/stake`, stakeRoutes);
    app.use(`/${API_VERSION}/claim`, claimRoutes);
    app.use(`/${API_VERSION}/contract`, contractRoutes)


    app.get(`/${API_VERSION}`, (req: Request, res: Response) => {
        res.status(200).send({
            message: `Welcome to ${API_VERSION} for hydrastake`
        })
    });
    return app;
}

