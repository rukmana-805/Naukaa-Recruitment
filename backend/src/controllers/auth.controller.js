import UserModel from "../models/User.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new ApiError(401, "No refresh token");
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  const user = await UserModel.findById(decoded.id);

  if (!user || user.refreshToken !== token) {
    throw new ApiError(403, "Invalid refresh token");
  }

  const newAccessToken = generateAccessToken(user._id);

  res
    .status(200)
    .json(
      new ApiResponse(200, { accessToken: newAccessToken }, "Token refreshed"),
    );
});

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  // Basic Validation
  if (!fullName || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  // Check existing user
  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  // Create user
  const user = await UserModel.create({
    fullName,
    email,
    password,
  });

  // Generate Tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  // Cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: false, // production me true (HTTPS)
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  // Send refresh token in cookie
  //res.cookie("refreshToken", refreshToken, cookieOptions);

  // Remove sensitive data
  const createdUser = await UserModel.findById(user._id).select(
    "-password -refreshToken",
  );

  // Response
  res
    .cookie("refreshToken", refreshToken, cookieOptions)
    .status(201)
    .json(
      new ApiResponse(
        201,
        {
          user: createdUser,
          accessToken,
        },
        "User registered successfully",
      ),
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  // Send cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // true in production (https)
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        accessToken,
      },
      "Login successful",
    ),
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.refreshToken = null;
  await user.save();

  res.clearCookie("refreshToken");

  res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
};
