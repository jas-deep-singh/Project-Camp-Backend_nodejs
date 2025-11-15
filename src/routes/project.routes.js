import { Router } from "express";
import { createProject } from "../controllers/project.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { createProjectValidator } from "../validators/index.validator.js";

const router = Router();

router.route("/createProject").post(verifyJWT, createProjectValidator(), validate, createProject);

export default router;