import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateProjectPermission } from "../middlewares/permission.middlewares.js";
import { AvailableUSerRoles, UserRolesEnum } from "../utils/constants.js";
import { createProjectNote, deleteProjectNote, getNoteById, getProjectNotes, updateProjectNote } from "../controllers/note.controllers.js";

const router = Router();
router.use(verifyJWT);

router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableUSerRoles), getProjectNotes)
    .post(validateProjectPermission([UserRolesEnum.ADMIN]), createProjectNote);

router
    .route("/:projectId/n/:noteId")
    .get(validateProjectPermission(AvailableUSerRoles), getNoteById)
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateProjectNote)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProjectNote);

export default router;