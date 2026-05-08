import UserModel from "../models/User.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import crypto from "crypto";
import { sendEmailToQueue } from "../queues/email.producer.js";
import { EMAIL_TYPES } from "../constants/email.constants.js";

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // DELETE OLD RESUME
  if (user.resume && typeof user.resume === "object" && user.resume.public_id) {
    await cloudinary.uploader.destroy(user.resume.public_id, {
      resource_type: "raw",
    });
  }

  // Upload new resume
  const uploadedFile = await cloudinary.uploader.upload(req.file.path, {
    resource_type: "raw",
    folder: "naukaa/resumes",
  });

  // Save new resume
  user.resume = {
    url: uploadedFile.secure_url,
    public_id: uploadedFile.public_id,
  };

  await user.save();

  // Delete local file
  fs.unlinkSync(req.file.path);

  res
    .status(200)
    .json(
      new ApiResponse(200, user.resume.url, "Resume uploaded successfully"),
    );
});

const updatePersonalDetails = asyncHandler(async (req, res) => {
  const { dob, gender, hometown, address } = req.body;

  // Check user
  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Update fields
  user.personalDetails = {
    dob,
    gender,
    hometown,
    address: {
      permanentAddress: address?.permanentAddress,
      city: address?.city,
      state: address?.state,
      pincode: address?.pincode,
    },
  };

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, user, "Personal details updated successfully"));
});

const updateEducation = asyncHandler(async (req, res) => {
  const { education } = req.body;

  // Validate
  if (!education || !Array.isArray(education)) {
    throw new ApiError(400, "Education must be an array");
  }

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Replace education array
  user.education = education;

  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, user.education, "Education updated successfully"),
    );
});

const updateExperience = asyncHandler(async (req, res) => {
  const { workExperience } = req.body;

  if (!workExperience || !Array.isArray(workExperience)) {
    throw new ApiError(400, "Work experience must be an array");
  }

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.workExperience = workExperience;

  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.workExperience,
        "Experience updated successfully",
      ),
    );
});

const updateWorkExperience = asyncHandler(async (req, res) => {
  const { workExperience } = req.body;

  if (!workExperience || !Array.isArray(workExperience)) {
    throw new ApiError(400, "Work experience must be an array");
  }

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.workExperience = workExperience;

  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.workExperience,
        "Experience updated successfully",
      ),
    );
});

const updateSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;

  if (!skills || !Array.isArray(skills)) {
    throw new ApiError(400, "Skills must be an array");
  }

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.skills = skills;

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, user.skills, "Skills updated successfully"));
});

const updateCareerPreferences = asyncHandler(async (req, res) => {
  const {
    desiredJobRole,
    preferredIndustry,
    department,
    expectedSalary,
    employmentType,
    preferredShift,
    workMode,
  } = req.body;

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.careerPreferences = {
    desiredJobRole,
    preferredIndustry,
    department,
    expectedSalary,
    employmentType,
    preferredShift,
    workMode,
  };

  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.careerPreferences,
        "Career preferences updated",
      ),
    );
});

const updatePreferredLocations = asyncHandler(async (req, res) => {
  const { preferredLocations } = req.body;

  if (!preferredLocations || !Array.isArray(preferredLocations)) {
    throw new ApiError(400, "Preferred locations must be an array");
  }

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.preferredLocations = preferredLocations;

  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.preferredLocations,
        "Preferred locations updated",
      ),
    );
});

const updateLanguages = asyncHandler(async (req, res) => {
  const { languages } = req.body;

  if (!languages || !Array.isArray(languages)) {
    throw new ApiError(400, "Languages must be an array");
  }

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.languages = languages;

  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, user.languages, "Languages updated successfully"),
    );
});

const updateProfileSummary = asyncHandler(async (req, res) => {
  const { profileSummary } = req.body;

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.profileSummary = profileSummary;

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, user.profileSummary, "Profile summary updated"));
});

const updateProfessionalStatus = asyncHandler(async (req, res) => {
  const { professionalStatus, experienceDetails } = req.body;

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.professionalStatus = professionalStatus;

  if (professionalStatus === "experienced") {
    user.experienceDetails = experienceDetails;
  }

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, user, "Professional status updated"));
});

const getUserProfile = asyncHandler(async (req, res) => {});

const changePassword = asyncHandler(async (req, res) => {
  const { password, newPassword } = req.body;

  if (!password || !newPassword) {
    throw new ApiError(400, "Password and new password are required");
  }

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid current password");
  }

  user.password = newPassword;

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOne({
    email: email,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // generate token
  const resetToken = user.getResetPasswordToken();

  await user.save({
    validateBeforeSave: false,
  });

  // create url to send in email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `Reset your password using this link: ${resetUrl}`;

  // now send email to user
  // console.log("Email send here");
  await sendEmailToQueue({
    to: user.email,
    type: EMAIL_TYPES.FORGOT_PASSWORD, // event driver
    payload: {
      name: user.fullName,
      token: resetUrl,
    },
  });

  res.status(200).json({
    success: true,
    message: "Reset link sent to email",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const { password } = req.body;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // find user
  const user = await UserModel.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or expired");
  }

  // update password
  user.password = password;

  // clear fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});

const unsaveJob = asyncHandler(async (req, res) => {
  const jobId = req.params.jobId;

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.savedJobs = user.savedJobs.filter(
    (id) => id.toString() !== jobId.toString(),
  );

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, user.savedJobs, "Job removed from saved jobs"));
});

const getSavedJobs = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user._id).populate({
    path: "savedJobs",
    populate: { path: "company", select: "name logoUrl" },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, user.savedJobs, "Saved jobs fetched successfully"),
    );
});

const saveJob = asyncHandler(async (req, res) => {
  const jobId = req.params.jobId;

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.savedJobs.includes(jobId)) {
    throw new ApiError(400, "Job already saved");
  }

  user.savedJobs.push(jobId);

  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, user.savedJobs, "Job saved successfully"));
});

export {
  updatePersonalDetails,
  updateEducation,
  updateExperience,
  updateWorkExperience,
  updateSkills,
  updateCareerPreferences,
  updatePreferredLocations,
  updateLanguages,
  updateProfileSummary,
  updateProfessionalStatus,
  getUserProfile,
  uploadResume,
  changePassword,
  saveJob,
  unsaveJob,
  getSavedJobs,
  forgetPassword,
  resetPassword,
};
