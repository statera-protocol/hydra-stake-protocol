import { Router } from "express";
import { handleStake } from "../controllers/handle-stake.js";
import { requireApiAuthentication } from "../utils/api-auth-middleware.js";
import { handleDeploy } from "../controllers/handle-deploy-contract.js";

const stakeRoutes = Router();

stakeRoutes.post("/", requireApiAuthentication, handleStake)
stakeRoutes.post("/deploy", requireApiAuthentication, handleDeploy)
export default stakeRoutes;
