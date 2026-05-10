import { Router } from "express";

import verifyUser from "../middlewares/auth.middleware.js";
import isOwner from "../middlewares/isOwner.middleware.js";

import {
  createOrganization,
  getMyOrganizations,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  uploadLogo,
  uploadCoverImage,
  followOrganization,
  unfollowOrganization,
  updateIndividualCompanyCertificate,
  updateIndividualCompanyDetails,
  updateCompanyCertificate,
  updateCompanyDetails,
  removeMember,
  getRecommendedOrganizations,
  getMemberActivity
} from "../controllers/organization.controller.js";

import upload from "../middlewares/upload.middleware.js";

const router = Router();

// Public Route
router.get("/all", getAllOrganizations);
router.get("/recommended", verifyUser, getRecommendedOrganizations);

// Protected Route
router.post("/create-organization", verifyUser, isOwner, createOrganization);
router.get("/my-organizations", verifyUser, getMyOrganizations);
router.get("/organization/:id", getOrganizationById);
router.patch("/update-organization/:id", verifyUser, isOwner, updateOrganization);
router.delete("/delete-organization/:id", verifyUser, isOwner, deleteOrganization);
router.post("/upload-logo/:id", verifyUser, isOwner, upload.single("logo"), uploadLogo);
router.post(
  "/upload-cover/:id",
  verifyUser,
  isOwner,
  upload.single("coverImage"),
  uploadCoverImage,
);
router.post("/follow/:id", verifyUser, followOrganization);
router.post("/unfollow/:id", verifyUser, unfollowOrganization);

// New
router.patch("/individual-company/:id", verifyUser, isOwner, updateIndividualCompanyDetails);
router.patch("/big-company/:id", verifyUser, isOwner, updateCompanyDetails);
router.patch(
  "/individual-company/:id/documents",
  upload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
  ]),

  verifyUser,
  isOwner,
  updateIndividualCompanyCertificate,
);
router.patch(
  "/big-company/:id/documents",
  upload.fields([
    { name: "gst", maxCount: 1 },
    { name: "cin", maxCount: 1 },
  ]),

  verifyUser,
  isOwner,
  updateCompanyCertificate,
);

router.delete("/:id/member/:memberId", verifyUser, isOwner, removeMember);
router.get("/:id/member/:memberId/activity", verifyUser, isOwner, getMemberActivity);

export default router;
