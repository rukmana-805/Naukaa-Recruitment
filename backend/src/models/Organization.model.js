import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

const organizationSchema = new mongoose.Schema(
  {
    // ORGANIZATION TYPE
    organizationType: {
      type: String,
      enum: ["COMPANY", "INDIVIDUAL"],
      required: true,
    },

    // BASIC INFO
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    tagline: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
    },

    tags: {
      type: [String],
      default: [],
    },

    industry: {
      type: String,
      trim: true,
    },

    // MEDIA
    logo: {
      url: String,
      public_id: String,
    },

    coverImage: {
      url: String,
      public_id: String,
    },

    // CONTACT INFO
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    website: {
      type: String,
      trim: true,
    },

    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
    },

    // ADDRESS
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },

    // COMPANY DETAILS
    // (ONLY FOR COMPANY)
    companyDetails: {
      founded: Number,

      employeesCount: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      },

      revenue: String,

      offices: Number,

      headquarters: {
        city: String,
        state: String,
        country: String,
      },

      gstNumber: String,

      cinNumber: String,

      companySize: String,
    },

    // INDIVIDUAL DETAILS
    // (ONLY FOR INDIVIDUAL)
    individualDetails: {
      // fullName: String,

      aadhaarNumber: String,

      panNumber: String,

      hiringFor: {
        type: String,
        enum: [
          "Teacher",
          "Trainer",
          "Maid",
          "Cook",
          "Freelancer",
          "Assistant",
          "Other",
        ],
      },
    },

    // CULTURE & BENEFITS
    culture: {
      type: [String],
      default: [],
    },

    perks: {
      type: [String],
      default: [],
    },

    // VERIFICATION
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },

    verificationDocuments: [
      {
        name: String,

        url: String,

        public_id: String,

        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    verifiedAt: Date,

    rejectionReason: String,

    // ANALYTICS
    rating: {
      average: {
        type: Number,
        default: 0,
      },

      totalReviews: {
        type: Number,
        default: 0,
      },
    },

    views: {
      type: Number,
      default: 0,
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // OWNER
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // TEAM MEMBERS
    // ONLY FOR COMPANY
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        role: {
          type: String,
          enum: ["owner", "admin", "recruiter"],
          default: "recruiter",
        },

        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // SUBSCRIPTION
    subscription: {
      plan: {
        type: String,
        default: "FREE",
      },

      startDate: Date,

      endDate: Date,

      isActive: {
        type: Boolean,
        default: false,
      },
    },

    // STATUS
    isBlocked: {
      type: Boolean,
      default: false,
    },

    profileCompletionStep: {
      type: Number,
      default: 1,
    },

    isProfileCompleted: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// AUTO GENERATE SLUG
organizationSchema.pre("save", function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }
});

// ADD FOLLOWER METHOD
organizationSchema.methods.addFollower = function (userId) {
  if (!this.followers.includes(userId)) {
    this.followers.push(userId);
  }
};

// REMOVE FOLLOWER METHOD
organizationSchema.methods.removeFollower = function (userId) {
  this.followers = this.followers.filter(
    (id) => id.toString() !== userId.toString(),
  );
};

// Cascading Handle Helper for Organization
const handleOrgCascadeDelete = async (org) => {
  if (!org) return;

  // 1. Delete assets from Cloudinary
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

  // 2. Find and delete recruiters of this organization
  const recruiterIds = org.members
    .filter(m => m.role === "recruiter")
    .map(m => m.user);
  for (const recId of recruiterIds) {
    await mongoose.model("User").findByIdAndDelete(recId);
  }

  // 3. Find and delete jobs and their applications
  const jobs = await mongoose.model("Job").find({ company: org._id });
  const jobIds = jobs.map(j => j._id);
  await mongoose.model("Application").deleteMany({ job: { $in: jobIds } });
  await mongoose.model("Job").deleteMany({ company: org._id });
};

organizationSchema.pre("deleteOne", { document: true, query: false }, async function () {
  await handleOrgCascadeDelete(this);
});

organizationSchema.pre("findOneAndDelete", async function () {
  const org = await this.model.findOne(this.getFilter());
  await handleOrgCascadeDelete(org);
});

export default mongoose.model("Organization", organizationSchema);
