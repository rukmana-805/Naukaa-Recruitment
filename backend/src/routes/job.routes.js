import Router from 'express';
import { 
    createJob, updateJob, deleteJob, getFilteredJobs, getJobById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getOpenJobs,
    getRecommendedJobs
} from '../controllers/job.controller.js';

import verifyUser from "../middlewares/auth.middleware.js";

const router = Router();

router.post('/create-job', verifyUser, createJob);
router.get('/get-open-jobs', verifyUser, getOpenJobs);
router.get('/get-job/:id', getJobById);
router.patch('/update-job/:id', verifyUser, updateJob);
router.delete('/delete-job/:id', verifyUser, deleteJob);

// Filtered jobs (with pagination)
router.get('/get-filtered-jobs', getFilteredJobs);
router.get("/recommended-jobs", verifyUser, getRecommendedJobs);

// Question update routes
router.post('/create-question/:jobId', verifyUser, createQuestion);
router.patch('/update-question/:jobId/:questionId', verifyUser, updateQuestion);
router.delete('/delete-question/:jobId/:questionId', verifyUser, deleteQuestion);

export default router;