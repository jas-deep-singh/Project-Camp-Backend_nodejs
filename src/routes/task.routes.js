import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createSubTask, createTask, deleteSubTask, deleteTask, getTaskById, getTasks, updateSubTask, updateTask } from "../controllers/task.controllers.js";
import { AvailableUSerRoles, UserRolesEnum } from "../utils/constants.js";
import { validateProjectPermission } from "../middlewares/permission.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();
router.use(verifyJWT);

router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableUSerRoles), getTasks)
    .post(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), upload.array("attachments", 10), createTask)

router
    .route("/:projectId/:taskId")
    .get(validateProjectPermission(AvailableUSerRoles), getTaskById)
    .put(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), upload.array("attachments", 10), updateTask)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), deleteTask)

router
    .route("/:projectId/:taskId/subtasks")
    .post(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), createSubTask)

router
    .route("/:projectId/st/:subTaskId")
    .put(validateProjectPermission(AvailableUSerRoles), updateSubTask)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]), deleteSubTask)

export default router;