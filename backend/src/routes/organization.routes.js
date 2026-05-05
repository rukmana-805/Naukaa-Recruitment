import { Router } from "express";

import verifyUser from "../middlewares/auth.middleware.js";

import { 
    createOrganization,
    getMyOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization,
    uploadLogo,
    uploadCoverImage,
    followOrganization,
    unfollowOrganization
} from "../controllers/organization.controller.js";

import upload from "../middlewares/upload.middleware.js";

const router = Router();

// Protected Route
router.post("/create-organization", verifyUser, createOrganization);
router.get("/my-organizations", verifyUser, getMyOrganizations);
router.get("/organization/:id", getOrganizationById);
router.patch("/update-organization/:id", verifyUser, updateOrganization);
router.delete("/delete-organization/:id", verifyUser, deleteOrganization);
router.post("/upload-logo/:id", verifyUser, upload.single("logo"), uploadLogo);
router.post("/upload-cover/:id", verifyUser, upload.single("coverImage"), uploadCoverImage);
router.post("/follow/:id", verifyUser, followOrganization);
router.post("/unfollow/:id", verifyUser, unfollowOrganization);

export default router;