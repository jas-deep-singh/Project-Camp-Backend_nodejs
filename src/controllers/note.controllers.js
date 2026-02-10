import { ProjectNote } from "../models/note.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Project } from "../models/projects.models.js";
import mongoose from "mongoose";

const createProjectNote = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
        throw new ApiError(400, "Content is required");
    }
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
        throw new ApiError(404, "Project not found");
    }
    const userId = req.user._id;
    const projectNote = await ProjectNote.create({
        project: projectId,
        createdBy: userId,
        content
    });
    if (!projectNote) {
        throw new ApiError(500, "Error creating note");
    }
    return res.status(201).json(new ApiResponse(201, projectNote, "Note created successfully"));
});

const getProjectNotes = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
        throw new ApiError(404, "Project not found");
    }
    const notes = await ProjectNote.find({
        project: new mongoose.Types.ObjectId(projectId)
    });
    return res.status(200).json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
    const { projectId, noteId } = req.params;
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
        throw new ApiError(404, "Project not found");
    }
    const note = await ProjectNote.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(noteId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "creator",
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
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                creator: 1
            }
        }
    ]);
    if(!note || note.length===0) {
        throw new ApiError(404, "Note not found");
    }
    return res.status(200).json(new ApiResponse(200, note[0], "Note fetched successfully"));
});

const updateProjectNote = asyncHandler(async (req, res) => {
    const {projectId, noteId} = req.params;
    const {content} = req.body;
    if(!content || !content.trim()) {
        throw new ApiError(400, "Content is required");
    }
    const projectExists = await Project.exists({_id: projectId});
    if(!projectExists) {
        throw new ApiError(404, "Project not found");
    }
    const note = await ProjectNote.findOneAndUpdate(
        {_id: noteId, project: projectId},
        {content: content},
        {new: true}
    );
    if(!note) {
        throw new ApiError(404, "Note not found");
    }
    return res.status(200).json(new ApiResponse(200, note, "Note updated successfully"));
});

const deleteProjectNote = asyncHandler(async (req, res) => {
    const {projectId, noteId} = req.params;
    const projectExists = await Project.exists({_id: projectId});
    if(!projectExists) {
        throw new ApiError(404, "Project not found");
    }
    const note = await ProjectNote.findOneAndDelete({
        _id: noteId,
        project: projectId
    });
    if(!note) {
        throw new ApiError(404, "Note not found");
    }
    return res.status(200).json(new ApiResponse(200, null, "Note deleted successfully"));
});

export {
    createProjectNote,
    getProjectNotes,
    getNoteById,
    updateProjectNote,
    deleteProjectNote
};