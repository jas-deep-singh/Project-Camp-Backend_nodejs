import { healthCheck } from "../controllers/healthcheck.controllers.js";
import { Router } from "express";

const router = new Router();
router.route("/").get(healthCheck);
export default router;