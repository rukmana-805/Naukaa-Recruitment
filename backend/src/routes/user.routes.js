import { Router } from "express";
import verifyUser from "../middlewares/auth.middleware.js";

import {
    getUserProfile,
    updatePersonalDetails,
    updateEducation,
    updateExperience,
    updateSkills,
    updateCareerPreferences,
    updatePreferredLocations,
    updateLanguages,
    updateProfileSummary,
    updateProfessionalStatus,
    updateWorkExperience,
    uploadResume,
    changePassword,
    saveJob,
    unsaveJob,
    getSavedJobs,
    forgetPassword,
    resetPassword
} from "../controllers/user.controller.js";

import upload from "../middlewares/upload.middleware.js";

const router = Router();

// Protected Route
router.get("/profile", verifyUser, getUserProfile);
router.put("/personal-details", verifyUser, updatePersonalDetails);
router.put("/education", verifyUser, updateEducation);
router.put("/experience", verifyUser, updateExperience);
router.put("/work-experience", verifyUser, updateWorkExperience);
router.put("/skills", verifyUser, updateSkills);
router.put("/career-preferences", verifyUser, updateCareerPreferences);
router.put("/preferred-locations", verifyUser, updatePreferredLocations);
router.put("/languages", verifyUser, updateLanguages);
router.put("/profile-summary", verifyUser, updateProfileSummary);
router.put("/professional-status", verifyUser, updateProfessionalStatus);
router.post("/upload-resume", verifyUser, upload.single("resume"), uploadResume);
router.put("/change-password", verifyUser, changePassword);
router.put("/save-job/:jobId", verifyUser, saveJob);
router.delete("/unsave-job/:jobId", verifyUser, unsaveJob);
router.get("/saved-jobs", verifyUser, getSavedJobs);
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:token", resetPassword);

export default router;