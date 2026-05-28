import User from "../models/User.model.js";
import Organization from "../models/Organization.model.js";
import Job from "../models/Job.model.js";
import Application from "../models/Application.model.js";
import Payment from "../models/Payment.model.js";
import SubscriptionPlan from "../models/SubscriptionPlan.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import cloudinary from "../config/cloudinary.js";
import { getIO } from "../socket/socket.js";
import { sendNotificationToQueue } from "../queues/notification.producer.js";

// Helper for safe cloudinary delete
const safeDelete = async (public_id) => {
  try {
    if (public_id && typeof public_id === "string") {
      await cloudinary.uploader.destroy(public_id);
    }
  } catch (err) {
    console.log("Cloudinary delete ignored in admin:", err.message);
  }
};

// GET DASHBOARD STATS
export const getStats = asyncHandler(async (req, res) => {
  // Total Revenue (Sum of successful payments)
  const revenueAggregation = await Payment.aggregate([
    { $match: { status: "success" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const totalRevenue = revenueAggregation[0]?.total || 0;

  // Companies count
  const bigCompanies = await Organization.countDocuments({ organizationType: "COMPANY" });
  const individualCompanies = await Organization.countDocuments({ organizationType: "INDIVIDUAL" });

  // Job Seekers, Recruiters, and Owners count
  const totalJobSeekers = await User.countDocuments({ role: "user" });
  const totalRecruiters = await User.countDocuments({ role: "recruiter" });
  const totalOwners = await User.countDocuments({ role: "owner" });

  // Total Jobs
  const totalJobs = await Job.countDocuments();

  res.status(200).json(
    new ApiResponse(200, {
      totalRevenue,
      companiesCount: {
        big: bigCompanies,
        individual: individualCompanies,
        total: bigCompanies + individualCompanies,
      },
      usersCount: {
        jobSeekers: totalJobSeekers,
        recruiters: totalRecruiters,
        owners: totalOwners,
        total: totalJobSeekers + totalRecruiters + totalOwners,
      },
      totalJobs,
    }, "Admin statistics fetched successfully")
  );
});

// GET COMPANIES (WITH FILTERS)
export const getCompanies = asyncHandler(async (req, res) => {
  const { type, verificationStatus, search, plan } = req.query;

  const query = {};

  if (type) {
    query.organizationType = type;
  }

  if (verificationStatus) {
    query.verificationStatus = verificationStatus;
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (plan === "subscribed") {
    query["subscription.isActive"] = true;
  } else if (plan === "unsubscribed") {
    query.$or = [
      { "subscription.isActive": false },
      { "subscription.plan": "FREE" },
      { "subscription": { $exists: false } }
    ];
  }

  const companies = await Organization.find(query)
    .populate("owner", "fullName email phone")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, companies, "Companies fetched successfully")
  );
});

// GET SINGLE COMPANY BY ID (DETAILS)
export const getCompanyById = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id).populate("owner", "fullName email phone");

  if (!org) {
    throw new ApiError(404, "Organization not found");
  }

  // Fetch Recruiters associated with this org
  const recruiters = await User.find({
    _id: { $in: org.members.map(m => m.user) },
    role: "recruiter"
  }).select("fullName email phone lastLogin createdAt");

  // Fetch Job postings for this org
  const jobs = await Job.find({ company: org._id })
    .populate("postedBy", "fullName email")
    .sort({ createdAt: -1 });

  // Fetch payment history for this owner
  const payments = await Payment.find({ user: org.owner?._id, status: "success" })
    .populate("plan")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, {
      organization: org,
      recruiters,
      jobs,
      payments,
    }, "Organization details fetched successfully")
  );
});

// VERIFY COMPANY STATUS
export const verifyCompany = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const { id } = req.params;

  if (!["VERIFIED", "REJECTED"].includes(status)) {
    throw new ApiError(400, "Invalid verification status. Must be VERIFIED or REJECTED.");
  }

  const company = await Organization.findById(id);
  if (!company) {
    throw new ApiError(404, "Organization not found");
  }

  company.verificationStatus = status;
  if (status === "VERIFIED") {
    company.verifiedAt = new Date();
    company.rejectionReason = undefined;
  } else {
    company.rejectionReason = rejectionReason || "Rejected by administrator";
  }

  await company.save();

  // 1) REAL-TIME Socket Update to Owner
  try {
    const io = getIO();
    io.to(company.owner.toString()).emit("verification_status_update", {
      companyId: company._id,
      verificationStatus: status,
      rejectionReason: company.rejectionReason,
    });
    console.log(`Real-time verification status sent to owner ${company.owner}`);
  } catch (error) {
    console.error("Failed to emit verification status update to owner:", error.message);
  }

  // 2) Notification through standard queue
  await sendNotificationToQueue({
    userId: company.owner,
    title: status === "VERIFIED" ? "Company Profile Verified" : "Company Profile Rejected",
    message: status === "VERIFIED"
      ? `Congratulations! Your company "${company.name}" has been verified. You can now post jobs.`
      : `Your company "${company.name}" verification was rejected. Reason: ${company.rejectionReason}`,
    type: "SYSTEM",
    data: { companyId: company._id, status }
  });

  res.status(200).json(
    new ApiResponse(200, company, `Company verification status updated to ${status}`)
  );
});

// DELETE COMPANY (CASCADING DELETIONS)
export const deleteCompany = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);

  if (!org) {
    throw new ApiError(404, "Organization not found");
  }

  // Safe Cloudinary deletes for branding assets
  await safeDelete(org.logo?.public_id);
  await safeDelete(org.coverImage?.public_id);

  // Safe Cloudinary deletes for documents
  for (const doc of org.verificationDocuments || []) {
    await safeDelete(doc.public_id);
  }

  // Find all recruiters in this organization
  const recruiterIds = org.members
    .filter(m => m.role === "recruiter")
    .map(m => m.user);

  // Cascade delete recruiter users (this triggers pre-deleteOne hooks for recruiters too, deleting their posted jobs)
  for (const recId of recruiterIds) {
    await User.findByIdAndDelete(recId);
  }

  // Find all jobs for the company
  const jobs = await Job.find({ company: org._id });
  const jobIds = jobs.map(j => j._id);

  // Delete applications for those jobs
  await Application.deleteMany({ job: { $in: jobIds } });

  // Delete the jobs
  await Job.deleteMany({ company: org._id });

  // Delete the organization
  await org.deleteOne();

  res.status(200).json(
    new ApiResponse(200, {}, "Company and all associated jobs, applications, and recruiters deleted successfully")
  );
});

// GET JOB SEEKERS (WITH SEARCH)
export const getJobSeekers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const query = { role: "user" };

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  const seekers = await User.find(query).sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, seekers, "Job seekers fetched successfully")
  );
});

// DELETE USER (JOB SEEKER OR RECRUITER)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // If deleting recruiter, clean them up from organization members list
  if (user.role === "recruiter") {
    await Organization.updateMany(
      { "members.user": user._id },
      { $pull: { members: { user: user._id } } }
    );
  }

  // findOneAndDelete triggers cascade deletes inside User.model.js hook
  await User.findByIdAndDelete(user._id);

  res.status(200).json(
    new ApiResponse(200, {}, "User and all associated postings/applications deleted successfully")
  );
});

// DELETE JOB (ADMIN ACTIONS)
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  // deleteOne triggers application cascade delete hook
  await job.deleteOne();

  res.status(200).json(
    new ApiResponse(200, {}, "Job and associated applications deleted successfully")
  );
});

// GET ALL SUBSCRIPTION PLANS (ADMIN)
export const getPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find().sort({ price: 1 });
  res.status(200).json(new ApiResponse(200, plans, "Plans fetched successfully"));
});

// CREATE SUBSCRIPTION PLAN (ADMIN)
export const createPlan = asyncHandler(async (req, res) => {
  const { name, price, durationDays, description, features, isActive, applicableFor } = req.body;

  if (!name || price === undefined) {
    throw new ApiError(400, "Name and price are required");
  }

  if (applicableFor && !["COMPANY", "INDIVIDUAL", "BOTH"].includes(applicableFor)) {
    throw new ApiError(400, "applicableFor must be one of: COMPANY, INDIVIDUAL, BOTH");
  }

  const plan = await SubscriptionPlan.create({
    name,
    price,
    durationDays,
    description,
    features: Array.isArray(features) ? features : features ? features.split(",").map(f => f.trim()).filter(Boolean) : [],
    isActive,
    applicableFor: applicableFor || "BOTH"
  });

  res.status(201).json(new ApiResponse(201, plan, "Plan created successfully"));
});

// UPDATE SUBSCRIPTION PLAN (ADMIN)
export const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, price, durationDays, description, features, isActive, applicableFor } = req.body;

  const plan = await SubscriptionPlan.findById(id);
  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  if (applicableFor && !["COMPANY", "INDIVIDUAL", "BOTH"].includes(applicableFor)) {
    throw new ApiError(400, "applicableFor must be one of: COMPANY, INDIVIDUAL, BOTH");
  }

  if (name !== undefined) plan.name = name;
  if (price !== undefined) plan.price = price;
  if (durationDays !== undefined) plan.durationDays = durationDays;
  if (description !== undefined) plan.description = description;
  if (features !== undefined) {
    plan.features = Array.isArray(features) ? features : features.split(",").map(f => f.trim()).filter(Boolean);
  }
  if (isActive !== undefined) plan.isActive = isActive;
  if (applicableFor !== undefined) plan.applicableFor = applicableFor;

  await plan.save();

  res.status(200).json(new ApiResponse(200, plan, "Plan updated successfully"));
});

// DELETE SUBSCRIPTION PLAN (ADMIN)
export const deletePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await SubscriptionPlan.findByIdAndDelete(id);

  if (!plan) {
    throw new ApiError(404, "Plan not found");
  }

  res.status(200).json(new ApiResponse(200, {}, "Plan deleted successfully"));
});

// GET ALL PAYMENTS WITH COMPANIES (ADMIN)
export const getPayments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};

  if (status && status !== "all") {
    query.status = status;
  }

  const payments = await Payment.find(query)
    .populate("user", "fullName email")
    .populate("plan")
    .sort({ createdAt: -1 });

  const paymentsWithCompany = await Promise.all(
    payments.map(async (payment) => {
      const company = await Organization.findOne({ owner: payment.user?._id }).select("name organizationType");
      return {
        ...payment.toObject(),
        company: company || null
      };
    })
  );

  res.status(200).json(new ApiResponse(200, paymentsWithCompany, "Payments fetched successfully"));
});
