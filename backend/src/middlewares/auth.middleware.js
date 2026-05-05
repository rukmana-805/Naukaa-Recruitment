import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import UserModel from "../models/User.model.js";

const verifyUser = asyncHandler(async (req, res, next) => {

  let token;

  // Token extract (Authorization header)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Token check
  if (!token) {
    throw new ApiError(401, "Not authorized, no token");
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Get user from DB
  const user = await UserModel.findById(decoded.id).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // Attach user to request
  req.user = user;

  next();
});

export default verifyUser;