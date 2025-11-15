import mongoose, { Schema } from "mongoose";
import { User } from "./users.models.js"

const projectSchema = new Schema({
    projectName: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    memberList: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: User
            },
            role: {
                type: String,
                required: true,
                enum: ['project-admin', 'member']
            }
        }
    ],
    // tasks: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: Task
    //     }
    // ],
    // notes: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: Note
    //     }
    // ]
},
{
    timestamps: true
}
);

export const Project = mongoose.model("Project", projectSchema);