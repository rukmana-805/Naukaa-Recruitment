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
  deleteJob,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getPayments
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

// Subscription Plans CRUD
router.get("/plans", getPlans);
router.post("/plans", createPlan);
router.patch("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

// Payment History
router.get("/payments", getPayments);

export default router;
