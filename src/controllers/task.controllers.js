import { User } from "../models/users.models.js";
import { Project } from "../models/projects.models.js";
import { Task } from "../models/task.models.js";
import { Subtask } from "../models/subtask.models.js";
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
            url: `${process.env.SERVER_URL}/images/${file.filename}`,
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
        updateObject.$push = {
            attachments: {$each: attachments}
        };
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
        task.attachments.forEach(att => console.log(att.url));
        await Promise.all(
            task.attachments.map(async (attachment) => {
                const urlParts = attachment.url.split("/images/");
                const filename = urlParts[1];
                const filePath = path.join(process.cwd(), "public", "images", filename);
                if(fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath);
                }
            })
        )
    }
    await Task.findByIdAndDelete(taskId);
    return res.status(200).json(new ApiResponse(200, null, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
    const {taskId} = req.params;
    const {title} = req.body;
    if(!(title.trim())) {
        throw new ApiError(401, "Title is required");
    }
    const userId = req.user._id;
    const taskExists = await Task.exists({_id:taskId});
    if(!taskExists) {
        throw new ApiError(404, "Task not found");
    }
    const subTask = await Subtask.create({
        title,
        task: taskId,
        createdBy: userId
    });
    if(!subTask) {
        throw new ApiError(405, "Error creating subtask");
    }
    return res.status(201).json(new ApiResponse(201, subTask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
    const {title, isCompleted} = req.body;
    const {subTaskId} = req.params;
    const updateObject = {};
    if(title) {
        updateObject.title = title;
    }
    if(typeof isCompleted==="boolean") {
        updateObject.isCompleted = isCompleted;
    }
    if(Object.keys(updateObject).length===0) {
        throw new ApiError(400, "Nothing to update");
    }
    const subTask = await Subtask.findByIdAndUpdate(
        subTaskId,
        updateObject,
        {new: true}
    );
    if(!subTask) {
        throw new ApiError(404, "Subtask not found");
    }
    return res.status(200).json(new ApiResponse(200, subTask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
    const {subTaskId} = req.params;
    const subTask = await Subtask.findByIdAndDelete(subTaskId);
    if(!subTask) {
        throw new ApiError(404, "Subtask not found");
    }
    return res.status(200).json(new ApiResponse(200, null, "Subtask deleted successfully"));
});

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