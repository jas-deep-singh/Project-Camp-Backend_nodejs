import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Project } from "../models/projects.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { User } from "../models/users.models.js";
import mongoose, { isValidObjectId } from "mongoose";
import { UserRolesEnum } from "../utils/constants.js";

const getUserProjects = asyncHandler(async(req, res) => {
    const userId = req.user?._id;
    const projects = await ProjectMember.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "projects",
                pipeline: [
                    {
                        $lookup: {
                            from: "projectmembers",
                            localField: "_id",
                            foreignField: "project",
                            as: "projectmembers"
                        }
                    },
                    {
                        addFields: {
                            members: {
                                $size: "$projectmembers"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$project"
        },
        {
            $project: {
                project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: 1,
                    createdAt: 1,
                    createdBy: 1
                },
                role: 1,
                _id: 0
            }
        }
    ]);
    return res.status(200).json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async(req, res) => {
    const {projectId} = req.params;
    if(!isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }
    const project  = await Project.findById(projectId);
    if(!project) {
        throw new ApiError(404, "Project not found");
    }
    return res.status(200).json(new ApiResponse(200, project, "Project fetched successfully"));
});

const createProject = asyncHandler(async(req, res) => {
    const {name, description} = req.body;
    if(!name) {
        throw new ApiError(400, "Name is required");
    }
    const userId = req.user?._id;
    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(userId)
    });
    if(!project) {
        throw new ApiError(500, "Error creating project");
    }

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(userId),
        project: new mongoose.Types.ObjectId(project._id),
        role: UserRolesEnum.ADMIN
    });
    return res.status(201).json(new ApiResponse(201, project, "Project created successfully"));
});

const updateProject = asyncHandler(async(req, res) => {
    const {name, description} = req.body;
    if(!name) {
        throw new ApiError(400, "Name is required");
    }
    const {projectId} = req.params;
    if(!isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }
    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description
        },
        {new: true}
    );
    if(!project) {
        throw new ApiError(404, "Project not found");
    }
    return res.status(200).json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async(req, res) => {
    const {projectId} = req.params;
    if(!isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }
    const project = await Project.findByIdAndDelete(projectId);
    if(!project) {
        throw new ApiError(404, "Project not found");
    }
    await ProjectMember.deleteMany({project: projectId});
    return res.status(200).json(new ApiResponse(200, null, "Project deleted successfully"));
});

const addMembersToProject = asyncHandler(async(req, res) => {
    const {email, role} = req.body;
    const {projectId} = req.params;
    if(!isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid project id");
    }
    const user = await User.findOne({email});
    if(!user) {
        throw new ApiError(404, "User not found");
    }
    await ProjectMember.findOneAndUpdate(
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId)
        },
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
            role: role
        },
        {
            new: true,
            upsert: true
        }
    );
    return res.status(201).json(new ApiResponse(201, {}, "Member added successfully"));
});

const getProjectMembers = asyncHandler(async(req, res) => {});

const updateMemberRole = asyncHandler(async(req, res) => {});

const removeMember = asyncHandler(async(req, res) => {});

export {
    getUserProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    addMembersToProject,
    getProjectMembers,
    updateMemberRole,
    removeMember
};