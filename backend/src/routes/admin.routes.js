import { Router } from "express";
import verifyUser from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/isAdmin.middleware.js";
import {
  getStats,
  getCompanies,
  getCompanyById,
  verifyCompany,
  deleteCompany,
  getJobSeekers,
  deleteUser,
  deleteJob
} from "../controllers/admin.controller.js";

const router = Router();

// Apply auth and admin middleware to all routes
router.use(verifyUser, isAdmin);

// Stats
router.get("/stats", getStats);

// Companies
router.get("/companies", getCompanies);
router.get("/companies/:id", getCompanyById);
router.patch("/companies/:id/verify", verifyCompany);
router.delete("/companies/:id", deleteCompany);

// Job Seekers
router.get("/job-seekers", getJobSeekers);

// User Deletion (seeker or recruiter)
router.delete("/users/:id", deleteUser);

// Job Deletion
router.delete("/jobs/:id", deleteJob);

export default router;
