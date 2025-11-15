import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { Project } from "../models/projects.models.js";
import { asyncHandler } from "../utils/async-handler.js";

const createProject = asyncHandler(async (req, res) => {
    const { projectName, description } = req.body;
    const project = await Project.create({
        projectName,
        description,
        createdBy: req.user._id,
        memberList: [
            {
            user: req.user._id,
            role: "project-admin"
            }
        ]
    });
    if(!project) {
        throw new ApiError(500, "Project not created");
    }
    const createdProject = await Project.findById(project._id);
    return res.status(201).json(new ApiResponse(201, {createdProject}, "Project created succesfully"));
});

export {createProject};