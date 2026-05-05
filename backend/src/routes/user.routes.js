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
    uploadResume
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

export default router;