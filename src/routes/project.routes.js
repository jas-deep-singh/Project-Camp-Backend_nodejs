import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { addMembersToProject, createProject, deleteProject, getProjectById, getProjectMembers, getUserProjects, removeMember, updateMemberRole, updateProject } from "../controllers/project.controllers.js";
import { createProjectValidator, addMemberToProjectValidator } from "../validators/index.validator.js";
import { validateProjectPermission } from "../middlewares/permission.middlewares.js";
import { AvailableUSerRoles, UserRolesEnum } from "../utils/constants.js";

const router = Router();
router.use(verifyJWT);

router 
    .route("/")
    .get(getUserProjects)
    .post(createProjectValidator(), validate, createProject)

router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableUSerRoles), getProjectById)
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), createProjectValidator(), validate, updateProject)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProject)

router
    .route("/:projectId/members")
    .get(getProjectMembers)
    .post(validateProjectPermission([UserRolesEnum.ADMIN]), addMemberToProjectValidator(), validate, addMembersToProject)

router
    .route("/:projectId/members/:userId")
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateMemberRole)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), removeMember)

export default router; 