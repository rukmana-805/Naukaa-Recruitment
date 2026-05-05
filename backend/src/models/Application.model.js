import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    // WHO APPLIED
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // WHICH JOB
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },

    // COMPANY (for faster queries)
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },

    // APPLICANT SNAPSHOT (freeze user data)
    applicantSnapshot: {
      fullName: String,
      email: String,
      phone: String
    },

    // JOB SNAPSHOT (freeze job data) - to avoid issues if job is edited/deleted after application
    jobSnapshot: {
      title: String,
      companyName: String,
      location: String,
      salaryRange: {
        min: Number,
        max: Number
      }
    },

    // RESUME USED AT APPLY TIME
    resume: {
      url: String,
      public_id: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },

    // ANSWERS TO QUESTIONS
    answers: [
      {
        question: String,
        answer: mongoose.Schema.Types.Mixed
      }
    ],

    // CURRENT STATUS
    status: {
      type: String,
      enum: [
        "applied",
        "reviewing",
        "shortlisted",
        "interview",
        "rejected",
        "hired"
      ],
      default: "applied"
    },

    // STATUS HISTORY (timeline) - to track all status changes with timestamps like: applied -> reviewing -> shortlisted -> interview -> hired/rejected
    statusHistory: [
      {
        status: String,
        changedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // RECRUITER NOTES
    notes: String,

    // REJECTION REASON
    rejectionReason: String,

    // INTERVIEW DETAILS
    interview: {
      scheduledAt: Date,
      mode: {
        type: String,
        enum: ["online", "offline"]
      },
      meetingLink: String
    },

    // SOURCE TRACKING - for marketing analytics
    source: {
      type: String,
      enum: ["platform", "referral", "external"],
      default: "platform"
    },

    // USER WITHDRAW APPLICATION
    isWithdrawn: {
      type: Boolean,
      default: false
    },

    // APPLIED TIME
    appliedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);


// MUST
applicationSchema.index({ job: 1 });
applicationSchema.index({ applicant: 1 });

// IMPORTANT
applicationSchema.index({ job: 1, status: 1 });

// (performance boost)
applicationSchema.index({ job: 1, createdAt: -1 });


// UNIQUE INDEX (one application per job per user)
applicationSchema.index(
  { job: 1, applicant: 1 },
  { unique: true }
);


// AUTO PUSH INITIAL STATUS HISTORY - when a new application is created, we want to automatically add an 
// entry to the statusHistory array with the initial status ("applied") and the current timestamp. This way, 
// we have a complete timeline of status changes starting from the moment the application was submitted.
applicationSchema.pre("save", function () {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status
    });
  }
});


export default mongoose.model("Application", applicationSchema);