import mongoose from "mongoose";

const organizationInviteSchema = new mongoose.Schema(
  {
    // INVITED EMAIL
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    
    // ORGANIZATION
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    
    // ROLE INSIDE ORGANIZATION
    role: {
      type: String,
      enum: ["admin", "recruiter"],
      default: "recruiter",
    },

    
    // WHO SENT THE INVITE
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // SECURE INVITE TOKEN
    token: {
      type: String,
      required: true,
    },

    // INVITE STATUS
    status: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "EXPIRED",
        "CANCELLED",
      ],
      default: "PENDING",
    },

    // Example: 24 hours
    expiresAt: {
      type: Date,
      required: true,
      default: () =>
        new Date(Date.now() + 24 * 60 * 60 * 1000),
    },

    
    acceptedAt: Date,

    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    
    // TRACKING
    lastSentAt: Date,

    resendCount: {
      type: Number,
      default: 0,
    },

    
    // SECURITY
    ipAddress: String,

    userAgent: String,
  },
  {
    timestamps: true,
  },
);


// AUTO EXPIRE INDEX
// MongoDB TTL Index
// Automatically removes expired invites
organizationInviteSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);


// CHECK IF INVITE EXPIRED
organizationInviteSchema.methods.isExpired =
  function () {
    return Date.now() > this.expiresAt.getTime();
  };


// CHECK IF INVITE VALID
organizationInviteSchema.methods.isValidInvite =
  function () {
    return (
      this.status === "PENDING" &&
      Date.now() < this.expiresAt.getTime()
    );
  };


// PREVENT DUPLICATE ACTIVE INVITES
// Same email + same org
organizationInviteSchema.index(
  {
    email: 1,
    organization: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "PENDING",
    },
  }
);

export default mongoose.model(
  "OrganizationInvite",
  organizationInviteSchema
);