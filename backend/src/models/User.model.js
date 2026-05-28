import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    phone: String,

    role: {
      type: String,
      enum: ["user", "recruiter", "admin", "owner"],
      default: "user",
    },

    // PROFILE
    personalDetails: {
      dob: Date,
      gender: {
        type: String,
        enum: ["male", "female", "other"],
      },
      hometown: String,
      address: {
        permanentAddress: String,
        city: String,
        state: String,
        pincode: String,
      },
    },

    professionalStatus: {
      type: String,
      enum: ["fresher", "experienced"],
    },

    experienceDetails: {
      totalExperience: Number,
      currentCompany: String,
      currentRole: String, // added later
      currentSalary: Number,
      expectedSalary: Number,
      noticePeriod: String,
    },

    workExperience: [
      {
        companyName: String,
        role: String,
        startDate: Date,
        endDate: Date,
        description: String,
      },
    ],

    education: [
      {
        degree: String,
        institute: String,
        fieldOfStudy: String,
        percentageOrCGPA: String,
        startYear: Number,
        endYear: Number,
      },
    ],

    skills: [String],

    careerPreferences: {
      desiredJobRole: String,
      preferredIndustry: String,
      department: String,
      expectedSalary: Number,
      employmentType: {
        type: String,
        enum: ["full-time", "part-time", "internship", "contract"],
      },
      preferredShift: {
        type: String,
        enum: ["day", "night", "flexible"],
      },
      workMode: {
        type: String,
        enum: ["remote", "hybrid", "onsite"],
      },
    },

    preferredLocations: [String],

    languages: [
      {
        name: String,
        read: Boolean,
        write: Boolean,
        speak: Boolean,
      },
    ],

    profileSummary: String,

    resume: {
      url: String,
      public_id: String,
    },

    profilePic: {
      url: String,
      public_id: String,
    },

    // SYSTEM
    refreshToken: String,
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    lastLogin: Date,

    // FEATURES
    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],

    // For payment integration
    plan: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },

    // for forgot password
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
  },
  { timestamps: true },
);

// PASSWORD HASH
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function() {

  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
  .createHash("sha256")
  .update(resetToken)
  .digest("hex");

  // 15 minutes expiry time
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
}

// Cascading Handle Helper
const handleUserCascadeDelete = async (user) => {
  if (!user) return;

  // 1. Delete user's Cloudinary assets
  try {
    if (user.profilePic?.public_id) {
      await cloudinary.uploader.destroy(user.profilePic.public_id);
    }
    if (user.resume?.public_id) {
      await cloudinary.uploader.destroy(user.resume.public_id);
    }
  } catch (err) {
    console.error("Cloudinary user file destruction failed:", err.message);
  }

  // 2. Delete all notifications for the user
  await mongoose.model("Notification").deleteMany({ user: user._id });

  // 3. Cascade delete based on user role
  if (user.role === "recruiter") {
    // Remove from organization members list
    await mongoose.model("Organization").updateMany(
      { "members.user": user._id },
      { $pull: { members: { user: user._id } } }
    );

    const jobs = await mongoose.model("Job").find({ postedBy: user._id });
    const jobIds = jobs.map(j => j._id);

    // Delete applications for those jobs
    await mongoose.model("Application").deleteMany({ job: { $in: jobIds } });

    // Delete the jobs
    await mongoose.model("Job").deleteMany({ postedBy: user._id });
  }

  if (user.role === "owner") {
    const orgs = await mongoose.model("Organization").find({ owner: user._id });
    for (const org of orgs) {
      try {
        if (org.logo?.public_id) {
          await cloudinary.uploader.destroy(org.logo.public_id);
        }
        if (org.coverImage?.public_id) {
          await cloudinary.uploader.destroy(org.coverImage.public_id);
        }
        for (const doc of org.verificationDocuments || []) {
          if (doc.public_id) {
            await cloudinary.uploader.destroy(doc.public_id);
          }
        }
      } catch (err) {
        console.error("Cloudinary org file destruction failed:", err.message);
      }

      // Delete recruiters of the company
      const recruiterIds = org.members
        .filter(m => m.role === "recruiter")
        .map(m => m.user);
      for (const recId of recruiterIds) {
        await mongoose.model("User").findByIdAndDelete(recId);
      }

      // Delete jobs and applications of the company
      const jobs = await mongoose.model("Job").find({ company: org._id });
      const jobIds = jobs.map(j => j._id);
      await mongoose.model("Application").deleteMany({ job: { $in: jobIds } });
      await mongoose.model("Job").deleteMany({ company: org._id });

      // Delete the organization
      await org.deleteOne();
    }
  }

  // delete applications submitted by this job seeker
  await mongoose.model("Application").deleteMany({
    applicant: user._id,
  });
};

userSchema.pre("deleteOne", { document: true, query: false }, async function () {
  await handleUserCascadeDelete(this);
});

userSchema.pre("findOneAndDelete", async function () {
  const user = await this.model.findOne(this.getFilter());
  await handleUserCascadeDelete(user);
});

export default mongoose.model("User", userSchema);
