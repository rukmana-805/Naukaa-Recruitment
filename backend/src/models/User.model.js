import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
      enum: ["user", "recruiter", "admin"],
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

// Castading Handle

// Recruiter delete → jobs delete
// this.getFilter() -> gives id of the user who is being deleted and this function says that when a
// user is being deleted, find all the jobs where postedBy is that user's id and delete those jobs as well.
userSchema.pre("findOneAndDelete", async function () {
  const user = await this.model.findOne(this.getFilter());

  if (!user) return;

  // delete jobs if recruiter
  if (user.role === "recruiter") {
    await mongoose.model("Job").deleteMany({
      postedBy: user._id,
    });
  }

  // delete applications
  await mongoose.model("Application").deleteMany({
    applicant: user._id,
  });
});

export default mongoose.model("User", userSchema);
