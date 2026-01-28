import mongoose from "mongoose";
import { ProjectMember } from "../models/projectmember.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js"

export const validateProjectPermission = (roles = []) => {
    asyncHandler(async(req, _, next) => {
        const {projectId} = req.params;
        if(!projectId) {
            throw new ApiError(400, "Project id is missing");
        }
        const project = await ProjectMember.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(req.user._id)
        });
        if(!project) {
            throw new ApiError(404, "Project not found");
        }
        const givenRole = project?.role;
        req.user.role = givenRole;
        if(!roles.includes(givenRole)) {
            throw new ApiError(403, "You do not have permission to perform this action");
        }
        next();
    });
}