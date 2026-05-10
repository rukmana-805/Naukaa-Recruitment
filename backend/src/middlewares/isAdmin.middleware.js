import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const isAdmin = asyncHandler((req, res, next) => {

    const { user } = req;
    
    if(user.role !== "admin"){
        throw new ApiError(401, "Only Admin can access");
    }

    next();
});

export default isAdmin;