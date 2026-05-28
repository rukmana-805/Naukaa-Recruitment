import Organization from "../models/Organization.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import cloudinary from "../config/cloudinary.js";
import UserModel from "../models/User.model.js";
import fs from "fs";
import mongoose from "mongoose";
import Application from "../models/Application.model.js";
import { sendNotificationToQueue } from "../queues/notification.producer.js";

// SLUG GENERATOR
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
};

// SAFE CLOUDINARY DELETE
const safeDelete = async (public_id) => {
  try {
    if (public_id && typeof public_id === "string") {
      await cloudinary.uploader.destroy(public_id);
    }
  } catch (err) {
    console.log("Cloudinary delete ignored:", err.message);
  }
};

// CREATE ORGANIZATION
// export const createOrganization = asyncHandler(async (req, res) => {

//   if (req.user.role !== "recruiter") {
//     throw new ApiError(403, "Only recruiters allowed");
//   }

//   const { name } = req.body;

//   if (!name) throw new ApiError(400, "Name required");

//   // UNIQUE SLUG
//   let baseSlug = generateSlug(name);
//   let slug = baseSlug;
//   let counter = 1;

//   while (await Organization.findOne({ slug })) {
//     slug = `${baseSlug}-${counter++}`;
//   }

//   const org = await Organization.create({
//     ...req.body,
//     slug,
//     createdBy: req.user._id,
//     members: [{ user: req.user._id, role: "owner" }]
//   });

//   res.status(201).json(
//     new ApiResponse(201, org, "Organization created")
//   );
// });

export const createOrganization = asyncHandler(async (req, res) => {
  const { organizationType, name, email, phone } = req.body;

  const orgType = ["COMPANY", "INDIVIDUAL"];
  if (!organizationType || !orgType.includes(organizationType)) {
    throw new ApiError(401, "Fill correct Organization type");
  }

  const user = await UserModel.findById(req.user._id);

  const organization = await Organization.create({
    organizationType: organizationType,
    name,
    email,
    phone,
    owner: user._id,
  });

  // Notify Admins about new company registration
  try {
    const admins = await UserModel.find({ role: "admin" });
    for (const admin of admins) {
      await sendNotificationToQueue({
        userId: admin._id,
        title: "New Company Registered",
        message: `A new company "${name}" (${organizationType}) has registered and is pending verification.`,
        type: "SYSTEM",
        data: { companyId: organization._id }
      });
    }
  } catch (err) {
    console.error("Error creating admin new company notification:", err.message);
  }

  return res.status(201).json({
    success: true,
    message: "Your Organization has been created",
    organization,
  });
});

// Update Company details
export const updateIndividualCompanyDetails = asyncHandler(async (req, res) => {
  const { aadhaarNumber, panNumber, hiringFor } = req.body;

  const { id } = req.params;

  if (!aadhaarNumber || !panNumber || !hiringFor) {
    throw new ApiError(401, "All fields are required");
  }

  const options = [
    "Teacher",
    "Trainer",
    "Maid",
    "Cook",
    "Freelancer",
    "Assistant",
    "Other",
  ];
  if (!hiringFor || !options.includes(hiringFor)) {
    throw new ApiError(401, "Select a valid option");
  }

  // Verify aadhar here through otp
  const updatedOrg = await Organization.findByIdAndUpdate(
    id,
    {
      $set: {
        "individualDetails.aadhaarNumber": aadhaarNumber,
        "individualDetails.panNumber": panNumber,
        "individualDetails.hiringFor": hiringFor,
        profileCompletionStep: 2,
      },
    },
    {
      new: true,
    },
  );

  return res.status(200).json({
    success: true,
    updatedOrg,
    message: "Updated Successfully",
  });
});

export const updateIndividualCompanyCertificate = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    const organization = await Organization.findById(id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    const aadhaarFile = req.files?.aadhaar?.[0];
    const panFile = req.files?.pan?.[0];

    if (!aadhaarFile || !panFile) {
      return res.status(400).json({
        success: false,
        message: "Both Aadhaar and PAN are required",
      });
    }

    // UPLOAD ON CLOUDINARY
    const aadhaarUpload = await cloudinary.uploader.upload(aadhaarFile.path, {
      folder: "naukaa/documents/aadhaar",
    });

    const panUpload = await cloudinary.uploader.upload(panFile.path, {
      folder: "naukaa/documents/pan",
    });

    // UPDATE DB
    organization.verificationDocuments = [
      {
        name: "AADHAAR",
        url: aadhaarUpload.secure_url,
        public_id: aadhaarUpload.public_id,
      },

      {
        name: "PAN",
        url: panUpload.secure_url,
        public_id: panUpload.public_id,
      },
    ];

    organization.profileCompletionStep = 3;
    organization.isProfileCompleted = true;

    // owner is also member of organization
    if (!organization.members.find(m => m.user.toString() === req.user._id.toString())) {
      organization.members.push({
        user: req.user._id,
        role: "owner",
      });
    }

    await organization.save();

    return res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      documents: organization.verificationDocuments,
    });
  },
);

// For Company Details
export const updateCompanyDetails = asyncHandler(async (req, res) => {
  const { website, address, companyDetails } = req.body;

  const { id } = req.params;

  if (!website || !address || !companyDetails) {
    throw new ApiError(401, "All fields are required");
  }

  const {
    employeesCount,
    revenue,
    offices,
    headquarters,
    gstNumber,
    cinNumber,
    companySize,
  } = companyDetails;

  const organization = await Organization.findByIdAndUpdate(
    id,
    {
      $set: {
        website,
        address,
        "companyDetails.employeesCount": employeesCount,
        "companyDetails.revenue": revenue,
        "companyDetails.offices": offices,
        "companyDetails.headquarters": headquarters,
        "companyDetails.gstNumber": gstNumber,
        "companyDetails.cinNumber": cinNumber,
        "companyDetails.companySize": companySize,
        profileCompletionStep: 2,
      },
    },
    { new: true },
  );

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  res.status(200).json({
    success: true,
    message: "Organization Updated Successfully",
    organization,
  });
});

// For Company Certificates
export const updateCompanyCertificate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const organization = await Organization.findById(id);

  if (!organization) {
    return res.status(404).json({
      success: false,
      message: "Organization not found",
    });
  }

  const gstFile = req.files?.gst?.[0];
  const cinFile = req.files?.cin?.[0];

  if (!gstFile || !cinFile) {
    return res.status(400).json({
      success: false,
      message: "Both GST and CIN Certificates are required",
    });
  }

  // UPLOAD ON CLOUDINARY
  const gstUpload = await cloudinary.uploader.upload(gstFile.path, {
    folder: "naukaa/documents/gst",
  });

  const cinUpload = await cloudinary.uploader.upload(cinFile.path, {
    folder: "naukaa/documents/cin",
  });

  // UPDATE DB
  organization.verificationDocuments = [
    {
      name: "GST_CERTIFICATE",
      url: gstUpload.secure_url,
      public_id: gstUpload.public_id,
    },

    {
      name: "CIN_CERTIFICATE",
      url: cinUpload.secure_url,
      public_id: cinUpload.public_id,
    },
  ];

  organization.profileCompletionStep = 3;
  organization.isProfileCompleted = true;

  // owner is also member of organization
  organization.members.push({
    user: req.user._id,
    role: "owner",
  });

  await organization.save();

  return res.status(200).json({
    success: true,
    message: "Documents uploaded successfully",
    documents: organization.verificationDocuments,
  });
});

// GET MY ORGANIZATIONS
export const getMyOrganizations = asyncHandler(async (req, res) => {
  const orgs = await Organization.find({
    $or: [
      { owner: req.user._id },
      { "members.user": req.user._id }
    ]
  })
  .populate('owner', 'fullName email')
  .populate('members.user', 'fullName email')
  .sort({ createdAt: -1 });

  const Job = mongoose.model("Job");
  const orgsWithJobCounts = await Promise.all(
    orgs.map(async (org) => {
      const orgObj = org.toObject();
      if (orgObj.organizationType === "COMPANY" && orgObj.members) {
        orgObj.members = await Promise.all(
          orgObj.members.map(async (member) => {
            if (member.user && member.role === "recruiter") {
              const count = await Job.countDocuments({
                company: orgObj._id,
                postedBy: member.user._id
              });
              return { ...member, jobsCount: count };
            }
            return member;
          })
        );
      }
      return orgObj;
    })
  );

  res.status(200).json(new ApiResponse(200, orgsWithJobCounts, "Fetched"));
});

// GET ALL ORGANIZATIONS (PUBLIC)
export const getAllOrganizations = asyncHandler(async (req, res) => {
  const { industry, organizationType, search } = req.query;

  const query = {
    isProfileCompleted: true,
    isBlocked: false,
    isActive: true,
  };

  if (industry) {
    query.industry = industry;
  }

  if (organizationType) {
    query.organizationType = organizationType;
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const organizations = await Organization.find(query)
    .select("name tagline description tags industry organizationType logo coverImage website followers views companyDetails address")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, organizations, "Fetched all organizations"));
});

// GET RECOMMENDED ORGANIZATIONS
export const getRecommendedOrganizations = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  const skills = user.skills || [];

  const organizations = await Organization.find({
    isProfileCompleted: true,
    isBlocked: false,
    isActive: true,
    $or: [
      { industry: { $in: skills } },
      { tags: { $in: skills } }
    ]
  })
    .select("name tagline description tags industry organizationType logo coverImage website followers views companyDetails address")
    .limit(10);

  res.status(200).json(new ApiResponse(200, organizations, "Recommended organizations fetched"));
});

// GET SINGLE ORGANIZATION + VIEW COUNT
export const getOrganizationById = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Organization not found");

  // ATOMIC VIEW INCREMENT
  await Organization.findByIdAndUpdate(org._id, { $inc: { views: 1 } });

  res.status(200).json(new ApiResponse(200, org, "Fetched"));
});

// UPDATE ORGANIZATION
export const updateOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Not found");

  if (org.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  const allowedFields = [
    "name",
    "tagline",
    "description",
    "tags",
    "industry",
    "email",
    "phone",
    "website",
    "socialLinks",
    "address",
    "companyDetails",
    "individualDetails",
    "culture",
    "perks",
  ];

  // SAFE UPDATE - Update only allowed fields
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      org[key] = req.body[key];
    }
  });

  // UPDATE SLUG IF NAME CHANGED
  if (req.body.name) {
    let baseSlug = generateSlug(req.body.name);
    let slug = baseSlug;
    let counter = 1;

    while (await Organization.findOne({ slug, _id: { $ne: org._id } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    org.slug = slug;
  }

  await org.save();

  res.status(200).json(new ApiResponse(200, org, "Updated"));
});

// DELETE ORGANIZATION
export const deleteOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Not found");

  if (org.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  // SAFE IMAGE DELETE
  await safeDelete(org.logo?.public_id);
  await safeDelete(org.coverImage?.public_id);

  await org.deleteOne(); // cascade handled in model

  res.status(200).json(new ApiResponse(200, {}, "Organization deleted"));
});

// UPLOAD LOGO
export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Not found");

  if (org.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  await safeDelete(org.logo?.public_id);

  const uploaded = await cloudinary.uploader.upload(req.file.path, {
    folder: "naukaa/org/logo",
  });

  org.logo = {
    url: uploaded.secure_url,
    public_id: uploaded.public_id,
  };

  await org.save();

  fs.unlinkSync(req.file.path);

  res.status(200).json(new ApiResponse(200, org.logo, "Logo updated"));
});

// UPLOAD COVER IMAGE
export const uploadCoverImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Not found");

  if (org.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  await safeDelete(org.coverImage?.public_id);

  const uploaded = await cloudinary.uploader.upload(req.file.path, {
    folder: "naukaa/org/cover",
  });

  org.coverImage = {
    url: uploaded.secure_url,
    public_id: uploaded.public_id,
  };

  await org.save();

  fs.unlinkSync(req.file.path);

  res.status(200).json(new ApiResponse(200, org.coverImage, "Cover updated"));
});

// FOLLOW ORGANIZATION
export const followOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Organization not found");

  if (!org.followers.includes(req.user._id)) {
    org.followers.push(req.user._id);
    await org.save();
  } else {
    throw new ApiError(400, "Already following");
  }

  res.status(200).json(new ApiResponse(200, {}, "Followed"));
});

// UNFOLLOW ORGANIZATION
export const unfollowOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Organization not found");

  org.followers = org.followers.filter(
    (follower) => follower.toString() !== req.user._id.toString()
  );

  await org.save();

  res.status(200).json(new ApiResponse(200, {}, "Unfollowed"));
});

// REMOVE TEAM MEMBER
export const removeMember = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;

  const org = await Organization.findById(id);
  if (!org) throw new ApiError(404, "Organization not found");

  if (org.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owners can remove members");
  }

  // Remove member from array
  org.members = org.members.filter(
    (member) => member.user.toString() !== memberId
  );

  await org.save();

  res.status(200).json(new ApiResponse(200, {}, "Member removed successfully"));
});

// DELETE TEAM MEMBER (RECRUITER) AND THEIR USER ACCOUNT
export const deleteRecruiter = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;

  const org = await Organization.findById(id);
  if (!org) throw new ApiError(404, "Organization not found");

  if (org.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owners can delete recruiters");
  }

  const member = org.members.find(m => m.user.toString() === memberId);
  if (!member) {
    throw new ApiError(404, "Member not found in organization");
  }

  // Find recruiter user
  const user = await UserModel.findById(memberId);
  if (user && user.role !== "recruiter") {
    throw new ApiError(400, "Only recruiters can be deleted. Cannot delete owners or admins.");
  }

  // Remove member from organization array
  org.members = org.members.filter(
    (m) => m.user.toString() !== memberId
  );
  await org.save();

  // Completely delete the recruiter user account (triggers findOneAndDelete in User.model.js cascading to delete their jobs)
  if (user) {
    await UserModel.findByIdAndDelete(memberId);
  }

  res.status(200).json(new ApiResponse(200, {}, "Recruiter deleted successfully"));
});

// GET MEMBER ACTIVITY (JOBS POSTED)
export const getMemberActivity = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;

  const org = await Organization.findById(id);
  if (!org) throw new ApiError(404, "Organization not found");

  if (org.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owners can view member activity");
  }

  const jobs = await mongoose.model("Job").find({
    company: id,
    postedBy: memberId
  }).sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, jobs, "Member activity fetched"));
});

// GET ORGANIZATION STATS (PIPELINE)
export const getOrganizationStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const org = await Organization.findById(id);
  if (!org) throw new ApiError(404, "Organization not found");

  const isMember = org.members.some(m => m.user.toString() === req.user._id.toString());
  const isOwner = org.owner.toString() === req.user._id.toString();

  if (!isMember && !isOwner) {
    throw new ApiError(403, "Not authorized to view stats");
  }

  const stats = await mongoose.model("Application").aggregate([
    { $match: { company: new mongoose.Types.ObjectId(id) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const jobsCount = await mongoose.model("Job").countDocuments({ company: id });
  const followersCount = await Organization.findById(id).select("followers");

  const pipeline = {
    applied: 0,
    reviewing: 0,
    shortlisted: 0,
    interview: 0,
    rejected: 0,
    hired: 0,
    total: 0
  };

  stats.forEach(s => {
    if (pipeline.hasOwnProperty(s._id)) {
      pipeline[s._id] = s.count;
      pipeline.total += s.count;
    }
  });

  res.status(200).json(new ApiResponse(200, {
    pipeline,
    jobsCount,
    followers: followersCount?.followers?.length || 0
  }, "Stats fetched"));
});
