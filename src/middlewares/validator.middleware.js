import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

export const validate = (req, _, next) => {
    const errors = validationResult(req);
    if(errors.isEmpty()) { 
        return next();
    }
    const extractedErrors = [];
    errors.array().map((error) => extractedErrors.push({[error.path]: error.msg}));
    throw new ApiError(422, "Invalid Data", extractedErrors);
}