import asyncHandler from "../utils/asyncHandler.js";
import Payment from "../models/payment.model.js";
import Subscription from "../models/Subscrption.model.js";
import UserModel from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import { verifyRazorpaySignature } from "../utils/verifySignature.js";
import razorpay from "../config/razorpay.js";
import { cleanupStaleCreatedPayments } from "../utils/paymentCleanup.js";
import crypto from "crypto";
import { sendEmailToQueue } from "../queues/email.producer.js";
import { sendNotificationToQueue } from "../queues/notification.producer.js";
import { EMAIL_TYPES } from "../constants/email.constants.js";

const createOrder = asyncHandler(async (req, res) => {
  // future: planId se price nikaalna
  const amount = 999; // INR

  // idempotency-ish: same user ke recent "created" ko reuse kar sakte ho (optional)
  // const existing = await Payment.findOne({ user: req.user._id, status: "created" }).sort({ createdAt: -1 });

  // 1) Razorpay order create
  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency: "INR",
    receipt: `rcpt_${Date.now()}`, // helpful for tracing
  });

  if (!order?.id) {
    throw new ApiError(500, "Failed to create order");
  }

  await cleanupStaleCreatedPayments(req.user._id);

  // 2) DB me payment record (created)
  const payment = await Payment.create({
    user: req.user._id,
    amount,
    status: "created",
    razorpay_order_id: order.id,
  });

  // 3) frontend ko minimal data
  return res.status(200).json({
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
    paymentId: payment._id,
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    paymentId,
  } = req.body;

  // 0) cleanup stale created payments (same user)
  await cleanupStaleCreatedPayments(req.user._id);

  // 1) signature verify
  const isValid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    throw new ApiError(400, "Payment verification failed");
  }

  // 2) fetch payment doc
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  // 3) idempotency (already processed?)
  if (payment.status === "success") {
    return res.status(200).json({
      success: true,
      message: "Already processed",
    });
  }

  // 4) cross-check order_id
  if (payment.razorpay_order_id !== razorpay_order_id) {
    throw new ApiError(400, "Order mismatch");
  }

  // 5) ensure this payment_id not used elsewhere (unique index bhi hai)
  const existing = await Payment.findOne({
    razorpay_payment_id,
  });

  if (existing && existing._id.toString() !== payment._id.toString()) {
    throw new ApiError(400, "Duplicate payment detected");
  }

  // 6) update payment
  payment.status = "success";
  payment.razorpay_payment_id = razorpay_payment_id;
  payment.razorpay_signature = razorpay_signature;
  await payment.save();

  // 7) ensure single active subscription (atomic-ish flow)
  await Subscription.updateMany(
    { user: req.user._id, status: "active" },
    { status: "expired" },
  );

  const start = new Date();
  const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subscription = await Subscription.create({
    user: req.user._id,
    plan: "paid",
    startDate: start,
    endDate: end,
    status: "active",
    payment: payment._id,
  });

  // 8) update user
  await UserModel.findByIdAndUpdate(req.user._id, {
    plan: "paid",
    subscription: subscription._id,
  });

  return res.status(200).json({
    success: true,
    message: "Payment verified & subscription activated",
  });
});

const razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const signature = req.headers["x-razorpay-signature"];

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  const event = JSON.parse(req.body);

  // PAYMENT SUCCESS
  if (event.event === "payment.captured") {
    const data = event.payload.payment.entity;

    const payment = await Payment.findOne({
      razorpay_order_id: data.order_id,
    });

    if (!payment) return res.json({ ok: true });

    const userId = payment.user;

    // Idempotency (already processed)
    if (payment.status === "success") {
      return res.json({ ok: true });
    }

    // Duplicate payment check
    if (payment.razorpay_payment_id === data.id) {
      return res.json({ ok: true });
    }

    // Update payment
    payment.status = "success";
    payment.razorpay_payment_id = data.id;
    await payment.save();

    // Expire old subscriptions
    await Subscription.updateMany(
      { user: payment.user, status: "active" },
      { status: "expired" },
    );

    // Create new subscription
    const subscription = await Subscription.create({
      user: payment.user,
      plan: "paid",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86400000),
      status: "active",
      payment: payment._id,
    });

    await UserModel.findByIdAndUpdate(payment.user, {
      plan: "paid",
      subscription: subscription._id,
    });

    try {
      // console.log("Enqueuing notification and email for payment success...");

      // Notification
      await sendNotificationToQueue({
        userId,
        title: "Plan Activated",
        message: "Your plan has been upgraded successfully",
        type: "PAYMENT",
        data: {
          subscriptionId: subscription._id,
          paymentId: payment._id,
        },
      });

      // console.log("Notification enqueued");

      // Email
      const user = await UserModel.findById(payment.user);

      if (user?.email) {
        console.log("Enqueuing email to queue");

        await sendEmailToQueue({
          to: user.email, 
          type: EMAIL_TYPES.PAYMENT_SUCCESS,
          payload: {
            name: user.fullName,
            plan: "Pro Plan",
            amount: payment.amount,
          },
        });

        // console.log("Email enqueued");
      } else {
        console.error("User email not found");
      }
    } catch (error) {
      console.error("Failed to enqueue notification/email:", error);
    }
  }

  // PAYMENT FAILED
  if (event.event === "payment.failed") {
    const data = event.payload.payment.entity;

    const payment = await Payment.findOneAndUpdate(
      { razorpay_order_id: data.order_id },
      { status: "failed" },
      { new: true },
    );

    if (!payment) return res.json({ ok: true });

    const user = await UserModel.findById(payment.user);

    try {
      // Notification
      await sendNotificationToQueue({
        userId: payment.user,
        title: "Plan Still Not Activated",
        message:
          "There is an issue with your payment. Please retry or contact support",
        type: "PAYMENT",
        data: {
          paymentId: payment._id,
        },
      });

      // Email
      if (user?.email) {
        await sendEmailToQueue({
          email: user.email,
          type: "PAYMENT_FAILED",
        });
      }
    } catch (error) {
      console.error("Failed to enqueue failure notification/email:", error);
    }
  }

  return res.status(200).json({ received: true });
};

const markPaymentFailed = asyncHandler(async (req, res) => {
  const { razorpay_order_id } = req.body;

  const payment = await Payment.findOneAndUpdate(
    { razorpay_order_id },
    { status: "failed" },
    { new: true },
  );

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  res.json({
    success: true,
    message: "Payment marked as failed",
  });
});

const retryPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.body;

  const payment = await Payment.findById(paymentId);

  if (!payment || payment.status !== "failed") {
    throw new ApiError(400, "Invalid retry");
  }

  const order = await razorpay.orders.create({
    amount: payment.amount * 100,
    currency: "INR",
  });

  payment.razorpay_order_id = order.id;
  payment.status = "created";
  await payment.save();

  res.json({ order });
});

const getMySubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    user: req.user._id,
    status: "active",
  }).populate("payment");

  res.status(200).json(subscription);
});

const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    user: req.user._id,
    status: "active",
  });

  if (!subscription) {
    throw new ApiError(404, "No active subscription");
  }

  subscription.status = "expired";
  await subscription.save();

  await UserModel.findByIdAndUpdate(req.user._id, {
    plan: "free",
    subscription: null, // IMPORTANT
  });

  res.json({ message: "Subscription cancelled" });
});

export {
  createOrder,
  verifyPayment,
  getMySubscription,
  cancelSubscription,
  razorpayWebhook,
  retryPayment,
  markPaymentFailed,
};
