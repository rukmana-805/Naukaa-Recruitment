import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  plan: {
    type: String,
    enum: ["free", "paid"],
    required: true
  },

  startDate: {
    type: Date,
    default: Date.now
  },

  endDate: Date,

  status: {
    type: String,
    enum: ["active", "expired"],
    default: "active"
  },

  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment"
  }

}, { timestamps: true });

subscriptionSchema.index({ user: 1, status: 1 });

export default mongoose.model("Subscription", subscriptionSchema);