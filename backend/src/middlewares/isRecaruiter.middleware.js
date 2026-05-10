import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const isRecruiter = asyncHandler((req, res, next) => {

    const { user } = req;
    
    if(user.role !== "recruiter"){
        throw new ApiError(401, "Your are not Recruiter");
    }

    next();
});

export default isRecruiter;