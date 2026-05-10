import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import Organization from "../models/Organization.model.js";

const isOwner = asyncHandler(async (req, res, next) => {
    const { user } = req;
    const { id } = req.params;
    
    if(user.role !== "owner"){
        throw new ApiError(401, "You are not an Owner");
    }

    // If an ID is provided, verify they own THIS specific organization
    if (id) {
        const org = await Organization.findById(id);
        if (org && org.owner.toString() !== user._id.toString()) {
            throw new ApiError(403, "You are not the owner of this organization");
        }
    }

    next();
});

export default isOwner;