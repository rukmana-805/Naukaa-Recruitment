import express from "express";

import {
  applyToJob,
  getMyApplications,
  getJobApplications,
  getApplicationById,
  updateApplicationStatus,
  addNote,
  scheduleInterview,
  withdrawApplication,
  deleteApplication
} from "../controllers/application.controller.js";

import verifyUser from "../middlewares/auth.middleware.js";

const router = express.Router();


// USER ROUTES 
router.post("/job/:jobId/apply", verifyUser, applyToJob);
router.get("/my-applications", verifyUser, getMyApplications);
router.get("/:id", verifyUser, getApplicationById);
router.patch("/withdraw/:id", verifyUser, withdrawApplication);


// RECRUITER ROUTES
router.get("/job/:jobId", verifyUser, getJobApplications);
router.patch("/status/:id", verifyUser, updateApplicationStatus);
router.patch("/note/:id", verifyUser, addNote);
router.patch("/interview/:id", verifyUser, scheduleInterview);


// ADMIN / CLEANUP
router.delete("/:id", verifyUser, deleteApplication);


export default router;