import Application from "../models/Application.model.js";
import Job from "../models/Job.model.js";
import UserModel from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendEmailToQueue } from "../queues/email.producer.js";
import { sendNotificationToQueue } from "../queues/notification.producer.js";
import { EMAIL_TYPES } from "../constants/email.constants.js";

const applyToJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { answers } = req.body;

  // check job
  const job = await Job.findById(jobId).populate("company");

  if (!job) throw new ApiError(404, "Job not found");

  // prevent duplicate apply
  const alreadyApplied = await Application.findOne({
    job: jobId,
    applicant: req.user._id,
  });

  if (alreadyApplied) {
    throw new ApiError(400, "Already applied");
  }

  // get user
  const user = await UserModel.findById(req.user._id);

  if (!user) throw new ApiError(404, "User not found");

  // EASY APPLY CHECK
  const isEasyApply = job.questions.length === 0;

  // resume check
  if (!user.resume?.url) {
    throw new ApiError(400, "Resume required");
  }

  // if questions exist but answers missing
  if (!isEasyApply && (!answers || answers.length === 0)) {
    throw new ApiError(400, "Please answer required questions");
  }

  // CREATE APPLICATION
  const application = await Application.create({
    applicant: user._id,
    job: job._id,
    company: job.company._id,

    // SNAPSHOTS
    applicantSnapshot: {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    },

    jobSnapshot: {
      title: job.title,
      companyName: job.company.name,
      location: job.location,
      salaryRange: job.salaryRange,
    },

    // RESUME
    resume: user.resume,

    // ANSWERS (empty if easy apply)
    answers: isEasyApply ? [] : answers,

    source: "platform",
  });

  // Push email to queue - RabbitMQ
  // await sendEmailToQueue({
  //   email: req.user.email,
  // });

  // increment applications count in job
  await Job.findByIdAndUpdate(jobId, {
    $inc: {
      applicationsCount: 1,
    },
  });

  res
    .status(201)
    .json(new ApiResponse(201, application, "Applied successfully"));
});

const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({
    applicant: req.user._id,
    isWithdrawn: false,
  }).sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, applications, "Fetched successfully"));
});

const getJobApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);

  if (!job) throw new ApiError(404, "Job not found");

  if (job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  const applications = await Application.find({ job: jobId }).sort({
    createdAt: -1,
  });

  res
    .status(200)
    .json(new ApiResponse(200, applications, "Applications fetched"));
});

const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) throw new ApiError(404, "Not found");

  // only applicant OR recruiter
  if (application.applicant.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  res.status(200).json(new ApiResponse(200, application, "Fetched"));
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, interviewDetails } = req.body;

  const allowedStatus = [
    "applied",
    // "reviewing",
    "shortlisted",
    "interview",
    "rejected",
    "hired",
  ];

  if (!allowedStatus.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const application = await Application.findById(req.params.id).populate("job");

  if (!application) throw new ApiError(404, "Application not found");

  console.log(application.job.postedBy);

  const job = await Job.findById(application.job);

  if (job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  const oldStatus = application.status;

  if (oldStatus === status) {
    return res.json({ message: "No change" });
  }

  // update status
  application.status = status;

  // push history
  application.statusHistory.push({ status });

  // interview case
  if (status === "interview") {
    application.interview = interviewDetails;
  }

  await application.save();

  // Notification (except applied)
  await sendNotificationToQueue({
    userId: application.applicant,
    title: `Application ${status}`,
    message: `Your application is now ${status}`,
    type: "JOB_UPDATE",
    data: {
      jobId: application.job,
      applicationId: application._id,
      status: `${status}`,
    },
  });

  // Email only for important
  if (["shortlisted", "interview", "rejected", "hired"].includes(status)) {
    await sendEmailToQueue({
      to: application.applicantSnapshot.email,
      type: EMAIL_TYPES.APPLICATION_STATUS, // event driver
      payload: {
        name: application.applicantSnapshot.fullName,
        status,
        jobTitle: application.jobSnapshot.title,
        company: application.jobSnapshot.companyName,
        interviewDetails,
      },
    });
  }

  res.status(200).json(new ApiResponse(200, application, "Status updated"));
});

// This is for auto move to reviewing status when recruiter open the application
const applicationReviewUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await Application.findById(id);

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  if (application.job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (application.status === "applied") {
    application.status = "reviewing";

    application.statusHistory.push({ status: "reviewing" });

    await application.save();

    // Notification only
    await sendNotificationToQueue({
      userId: application.applicant,
      title: "Application Under Review",
      message: "Your application is being reviewed",
      type: "JOB_UPDATE",
      data: {
        jobId: application.job,
        applicationId: application._id,
        status: "reviewing",
      },
    });
  } else {
    throw new ApiError(400, "Cannot move to reviewing");
  }

  res
    .status(200)
    .json(new ApiResponse(200, application, "Status updated to reviewed"));
});

const addNote = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const application = await Application.findById(req.params.id).populate("job");

  if (!application) throw new ApiError(404, "Application not found");

  if (application.job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  application.notes = notes;

  await application.save();

  res.status(200).json(new ApiResponse(200, application, "Note added"));
});

const scheduleInterview = asyncHandler(async (req, res) => {
  const { scheduledAt, mode, meetingLink } = req.body;

  const application = await Application.findById(req.params.id).populate("job");

  if (!application) throw new ApiError(404, "Not found");

  if (application.job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  application.interview = {
    scheduledAt,
    mode,
    meetingLink,
  };

  // auto update status
  application.status = "interview";
  application.statusHistory.push({ status: "interview" });

  await application.save();

  res
    .status(200)
    .json(new ApiResponse(200, application, "Interview scheduled"));
});

const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) throw new ApiError(404, "Not found");

  if (application.applicant.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (application.status === "hired") {
    throw new ApiError(400, "Cannot withdraw after hiring");
  }

  application.isWithdrawn = true;

  await application.save();

  res.status(200).json(new ApiResponse(200, {}, "Application withdrawn"));
});

const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) throw new ApiError(404, "Not found");

  await application.deleteOne();

  res.status(200).json(new ApiResponse(200, {}, "Deleted"));
});

export {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationById,
  withdrawApplication,
  deleteApplication,
  scheduleInterview,
  addNote,
  applicationReviewUpdate,
};
