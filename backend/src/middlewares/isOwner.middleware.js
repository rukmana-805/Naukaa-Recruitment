import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const isOwner = asyncHandler((req, res, next) => {

    const { user } = req;
    
    if(user.role !== "owner"){
        throw new ApiError(401, "Your are not Owner");
    }

    next();
});

export default isOwner;