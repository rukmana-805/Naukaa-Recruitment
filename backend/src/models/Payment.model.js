import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: "INR"
  },

  status: {
    type: String,
    enum: ["created", "success", "failed"],
    default: "created"
  },

  razorpay_order_id: String,
  razorpay_payment_id: String,
  razorpay_signature: String

}, { timestamps: true });

paymentSchema.index({ user: 1 });

// unique payment_id to avoid duplicates from webhook/verify
paymentSchema.index(
  { razorpay_payment_id: 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("Payment", paymentSchema);