import express from "express";
import {
  createOrder,
  verifyPayment,
  getMySubscription,
  cancelSubscription,
  retryPayment,
  markPaymentFailed,
  getActivePlans,
  getOwnerPaymentHistory
} from "../controllers/payment.controller.js";

import verifyUser from "../middlewares/auth.middleware.js";
import isOwner from "../middlewares/isOwner.middleware.js";

const router = express.Router();

// PAYMENT
router.post("/create-order", verifyUser, isOwner, createOrder);
router.post("/verify", verifyUser, isOwner, verifyPayment);

// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   razorpayWebhook
// );

router.post("/retry", verifyUser, isOwner, retryPayment);
router.post("/fail", verifyUser, isOwner, markPaymentFailed);

// SUBSCRIPTION
router.get("/plans", getActivePlans);
router.get("/subscription/me", verifyUser, isOwner, getMySubscription);
router.post("/subscription/cancel", verifyUser, isOwner, cancelSubscription);
router.get("/history", verifyUser, getOwnerPaymentHistory);

export default router;