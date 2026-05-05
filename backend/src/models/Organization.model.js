import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // Unique slug for SEO-friendly URLs -> Use in frontend routing
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    tagline: String,

    tags: [String],

    logo: {
      url: String,
      public_id: String,
    },

    coverImage: {
      url: String,
      public_id: String,
    },

    rating: {
      average: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },

    overview: {
      description: String,
      founded: Number,
      employeesCount: String,

      headquarters: {
        city: String,
        state: String,
        country: String,
      },

      revenue: String,
      offices: Number,
      website: String,
    },

    culture: {
      type: [String],
      default: [],
    },

    // isVerified: {
    //   type: Boolean,
    //   default: false,
    // },

    // status: {
    //   type: String,
    //   enum: ["pending", "verified", "rejected"],
    //   default: "pending",
    // },

    perks: {
      type: [String],
      default: [],
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["owner", "recruiter"],
          default: "recruiter",
        },
      },
    ],
  },
  { timestamps: true },
);

// AUTO GENERATE SLUG
organizationSchema.pre("save", function () {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-");
  }
  // next();
});

organizationSchema.methods.addFollower = function (userId) {
  if (!this.followers.includes(userId)) {
    this.followers.push(userId);
  }
};

export default mongoose.model("Organization", organizationSchema);
