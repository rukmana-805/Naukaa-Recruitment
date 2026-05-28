import Job from "../models/Job.model.js";
import Organization from "../models/Organization.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import UserModel from "../models/User.model.js";
import { sendNotificationToQueue } from "../queues/notification.producer.js";

const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    location,
    employmentType,
    salaryRange,
    experienceRequired,
    skillsRequired,
    responsibilities,
    questions,
    expiresAt,
  } = req.body;

  // recruiter or owner only
  if (!["recruiter", "owner"].includes(req.user.role)) {
    throw new ApiError(403, "Only recruiters or owners can post jobs");
  }

  const company = await Organization.findOne({
    $or: [
      { owner: req.user._id },
      { members: { $elemMatch: { user: req.user._id } } }
    ]
  });

  if (!company) {
    throw new ApiError(404, "You must create or join an organization before posting jobs");
  }

  // Verification Check
  if (company.verificationStatus !== "VERIFIED") {
    throw new ApiError(403, `Your company verification status is ${company.verificationStatus || 'PENDING'}. You cannot post jobs until it is verified by an admin.`);
  }

  // Plan check: free plan is limited to 1 job posting total
  const isPaid = company.subscription?.isActive && company.subscription.plan !== "FREE";
  if (!isPaid) {
    const totalJobsCount = await Job.countDocuments({ company: company._id });
    if (totalJobsCount >= 1) {
      throw new ApiError(403, "Free plan is limited to 1 job posting in total for the organization. Please upgrade your plan to post more jobs.");
    }
  }

  const job = await Job.create({
    title,
    description,
    location,
    employmentType,
    salaryRange,
    experienceRequired,
    skillsRequired,
    responsibilities,
    questions,
    company: company._id,
    postedBy: req.user._id,
    expiresAt,
  });

  // Admin Notification Milestones
  try {
    const totalJobsCount = await Job.countDocuments({ company: company._id });
    if (totalJobsCount === 5 || totalJobsCount === 10 || totalJobsCount === 20 || totalJobsCount === 50 || totalJobsCount % 50 === 0) {
      const admins = await UserModel.find({ role: "admin" });
      for (const admin of admins) {
        await sendNotificationToQueue({
          userId: admin._id,
          title: "High Volume Job Posting",
          message: `Company "${company.name}" has successfully posted ${totalJobsCount} jobs.`,
          type: "SYSTEM",
          data: { companyId: company._id, jobsCount: totalJobsCount }
        });
      }
    }
  } catch (err) {
    console.error("Error creating admin job post milestone notifications:", err.message);
  }

  res.status(201).json(new ApiResponse(201, job, "Job created successfully"));
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) throw new ApiError(404, "Job not found");

  const company = await Organization.findById(job.company);
  const isCompanyOwner = company && company.owner.toString() === req.user._id.toString();

  // poster or company owner can update
  if (job.postedBy.toString() !== req.user._id.toString() && !isCompanyOwner) {
    throw new ApiError(403, "Not authorized");
  }

  const allowedFields = [
    "title",
    "description",
    "location",
    "employmentType",
    "salaryRange",
    "experienceRequired",
    "skillsRequired",
    "responsibilities",
    "expiresAt",
    "questions",
  ];

  for (const key of Object.keys(req.body)) {
    if (!allowedFields.includes(key)) continue;

    // Nested objects → merge
    if (key === "salaryRange" || key === "experienceRequired") {
      job[key] = {
        ...(job[key] || {}),
        ...(req.body[key] || {}),
      };
    }

    // Simple arrays or subdocuments → replace
    else if (key === "skillsRequired" || key === "responsibilities" || key === "questions") {
      if (!Array.isArray(req.body[key])) {
        throw new ApiError(400, `${key} must be an array`);
      }
      job[key] = req.body[key];
    }

    // Simple fields → assign
    else {
      job[key] = req.body[key];
    }
  }

  await job.save();

  res.status(200).json(new ApiResponse(200, job, "Job updated successfully"));
});

const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  const company = await Organization.findById(job.company);
  const isCompanyOwner = company && company.owner.toString() === req.user._id.toString();

  if (job.postedBy.toString() !== req.user._id.toString() && !isCompanyOwner) {
    throw new ApiError(403, "Not authorized");
  }

  await job.deleteOne();

  res.status(200).json(new ApiResponse(200, {}, "Job deleted"));
});

const getOpenJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ status: "open" })
    .populate("company", "name logo")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, jobs, "Jobs fetched"));
});

const getMyJobs = asyncHandler(async (req, res) => {
  const company = await Organization.findOne({
    $or: [
      { owner: req.user._id },
      { members: { $elemMatch: { user: req.user._id } } }
    ]
  });

  if (!company) {
    return res.status(200).json(new ApiResponse(200, [], "No organization found"));
  }

  // Filter: recruiters only see their own postings, owners see all
  const query = { company: company._id };
  if (req.user.role === "recruiter") {
    query.postedBy = req.user._id;
  }

  const jobs = await Job.find(query)
    .populate("company", "name logo")
    .populate("postedBy", "fullName email")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, jobs, "Organization jobs fetched"));
});

const getJobById = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id)
      .populate("company", "name logo")
      .populate("postedBy", "fullName email");

    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    res.status(200).json(new ApiResponse(200, job, "Job fetched"));
});


// Job Searching
const getFilteredJobs = asyncHandler(async (req, res) => {

  // STEP 1: Extract query params
  const {
    keyword,
    location,
    skills,
    employmentType,
    minSalary,
    maxSalary,
    experience,
    companyId,
    page = 1,
    limit = 10
  } = req.query;

  // STEP 2: Base query
  let query = {
    expiresAt: { $gt: new Date() } // expired jobs remove
  };

  if (companyId) {
    query.company = companyId;
  }

  // STEP 3: TEXT SEARCH (FAST)
  if (keyword) {
    query.$text = { $search: keyword };
  }

  // STEP 4: LOCATION FILTER
  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  // STEP 5: EMPLOYMENT TYPE
  if (employmentType) {
    query.employmentType = employmentType;
  }

  // STEP 6: SKILLS FILTER
  if (skills) {
    const skillsArray = skills.split(",");
    query.skillsRequired = { $in: skillsArray };
  }

  // STEP 7: SALARY FILTER
  if (minSalary || maxSalary) {

    query["salaryRange.min"] = {
      $gte: Number(minSalary || 0)
    };

    query["salaryRange.max"] = {
      $lte: Number(maxSalary || 100000000)
    };

  }

  
  // STEP 8: EXPERIENCE FILTER
  if (experience) {

    query["experienceRequired.min"] = {
      $lte: Number(experience)
    };

    query["experienceRequired.max"] = {
      $gte: Number(experience)
    };

  }

  
  // STEP 9: PAGINATION
  // first 0 skip then 10 skip then 20 skip and so on
  const skip = (page - 1) * limit;
  
  // STEP 10: FETCH + HYBRID RANKING
  let jobsQuery;

  if (keyword) {
    // WITH TEXT SEARCH (score included)
    const sortCriteria = companyId
      ? { score: { $meta: "textScore" }, createdAt: -1 }
      : { score: { $meta: "textScore" }, applicationCount: -1, createdAt: -1 };

    jobsQuery = Job.find(query, {
      score: { $meta: "textScore" }
    }).sort(sortCriteria);
  } else {
    // WITHOUT KEYWORD (fallback ranking)
    const sortCriteria = companyId
      ? { createdAt: -1 }
      : { applicationCount: -1, createdAt: -1 };

    jobsQuery = Job.find(query).sort(sortCriteria);
  }

  const jobs = await jobsQuery
    .skip(skip)
    .limit(Number(limit))
    .populate("company");

  
  // STEP 11: TOTAL COUNT
  const total = await Job.countDocuments(query);

  
  // STEP 12: RESPONSE
  res.status(200).json(
    new ApiResponse(200, {
      jobs,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    }, "Jobs fetched successfully")
  );

});


// Recommendation Algorithm (Bonus - can be improved a lot with ML)
const getRecommendedJobs = asyncHandler(async (req, res) => {

  const user = await UserModel.findById(req.user._id);

  if (!user) throw new ApiError(404, "User not found");

  
  // Build search string
  const searchParts = [];

  if (user.careerPreferences?.desiredJobRole) {
    searchParts.push(user.careerPreferences.desiredJobRole);
  }

  if (user.skills?.length) {
    searchParts.push(...user.skills);
  }

  const searchText = searchParts.join(" ");

  
  // Base query
  let query = {
    expiresAt: { $gt: new Date() }
  };

  if (searchText) {
    query.$text = { $search: searchText };
  }

  
  // Experience filter
  const experience =
    user.experienceDetails?.totalExperience || 0;

  query["experienceRequired.min"] = { $lte: experience };
  query["experienceRequired.max"] = { $gte: experience };

  
  // Location filter
  if (user.preferredLocations?.length) {
    query.location = { $in: user.preferredLocations };
  }

  
  // FETCH + HYBRID RANKING
  let jobsQuery;

  if (searchText) {
    jobsQuery = Job.find(
      query,
      { score: { $meta: "textScore" } }
    ).sort({
      score: { $meta: "textScore" }, // relevance
      applicationCount: -1,          // popularity
      createdAt: -1                  // recency
    });
  } else {
    jobsQuery = Job.find(query).sort({
      applicationCount: -1,
      createdAt: -1
    });
  }

  const jobs = await jobsQuery
    .limit(20)
    .populate("company");

  res.status(200).json(
    new ApiResponse(200, jobs, "Recommended jobs fetched")
  );

});


// Questions Controllers
const createQuestion = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { question, type, required, options } = req.body;

  if (
    question.trim() === "" ||
    type.trim() === "" ||
    typeof required === "undefined"
  ) {
    throw new ApiError(400, "Empty fields are not allowed");
  }

  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to create questions");
  }

  job.questions.push({
    question,
    type,
    required,
    options,
  });

  await job.save();

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        job.questions[job.questions.length - 1],
        "Question created successfully",
      ),
    );
});

const updateQuestion = asyncHandler(async (req, res) => {

  const { jobId, questionId } = req.params;
  const { question, type, required, options } = req.body;

  const allowedTypes = ["text", "number", "select", "boolean"];

  if (type && !allowedTypes.includes(type)) {
    throw new ApiError(400, "Invalid question type");
  }

  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  // find subdocument
  const q = job.questions.id(questionId);

  if (!q) {
    throw new ApiError(404, "Question not found");
  }

  // SAFE UPDATE (only provided fields)
  if (question !== undefined) q.question = question;
  if (type !== undefined) q.type = type;
  if (required !== undefined) q.required = required;
  if (options !== undefined) q.options = options;

  await job.save();

  res
    .status(200)
    .json(new ApiResponse(200, q, "Question updated successfully"));
});

const deleteQuestion = asyncHandler(async (req, res) => {

  const { jobId, questionId } = req.params; 

  const job = await Job.findById(jobId);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  if (job.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  // find subdocument
  const q = job.questions.id(questionId);

  if (!q) {
    throw new ApiError(404, "Question not found");
  }

  // remove subdocument
  job.questions.pull(questionId);

  await job.save();

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Question deleted successfully"));
});

export {
  createJob,
  updateJob,
  deleteJob,
  getOpenJobs,
  getFilteredJobs,
  getJobById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getRecommendedJobs,
  getMyJobs
};
