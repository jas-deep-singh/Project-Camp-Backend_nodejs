import { User } from "../models/users.models.js";
import { Project } from "../models/projects.models.js";
import { Task } from "../models/task.models.js";
import { Substask } from "../models/subtask.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }
    const tasks = await Task.find({
        project: new mongoose.Types.ObjectId(projectId)
    }).populate("assignedTo", "avatar username fullName");
    return res.status(200).json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status } = req.body;
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }
    const files = req.files || [];
    const attachments = files.map((file) => {
        return {
            url: `${process.env.SERVER_URL}/images/${file.originalname}`,
            mimetype: file.mimetype,
            size: file.size
        }
    });
    const task = await Task.create({
        title,
        description,
        project: new mongoose.Types.ObjectId(projectId),
        assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
        status,
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
        attachments
    });
    return res.status(201).json(new ApiResponse(201, task, "Task created successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const task = await Task.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(taskId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "subtasks",
                localField: "_id",
                foreignField: "task",
                as: "subtasks",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "createdBy",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            createdBy: {
                                $arrayElemAt: ["$createdBy", 0]
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                assignedTo: {
                    $arrayElemAt: ["$assignedTo", 0]
                }
            }
        }
    ]);
    if (!task || task.length === 0) {
        throw new ApiError(404, "Task not found");
    }
    return res.status(200).json(new ApiResponse(200, task[0], "Tasks fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title, description, status } = req.body;
    const files = req.files || [];
    const updateObject = {};
    if (files.length>0) {
        const attachments = files.map((file) => {
            return {
                url: `${process.env.SERVER_URL}/images/${file.originalname}`,
                mimetype: file.mimetype,
                size: file.size
            }
        });
        updateObject.attachments = attachments;
    }
    if(title) {
        updateObject.title = title;
    }
    if(description) {
        updateObject.description = description;
    }
    if(status) {
        updateObject.status = status
    }
    const task = await Task.findByIdAndUpdate(
        taskId,
        updateObject,
        {new: true}
    );
    if(!task) {
        throw new ApiError(404, "Task not found");
    }
    return res.status(200).json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
    const {taskId} = req.params;
    const task = await Task.findById(taskId);
    if(!task) {
        throw new ApiError(404, "Task not found");
    }
    if(task.attachments && task.attachments.length>0) {
        await Promise.all(
            task.attachments.map(async (attachment) => {
                const filename = path.basename(attachment.url);
                const filePath = path.join(
                    process.cwd(),
                    "public/images",
                    filename
                );
                if(fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath);
                }
            })
        )
    }
    await Task.findByIdAndDelete(taskId);
    return res.status(200).json(new ApiResponse(200, null, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {});

const updateSubTask = asyncHandler(async (req, res) => {});

const deleteSubTask = asyncHandler(async (req, res) => {});

export {
    getTasks,
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask
};