import express from "express";
import {
  createOrder,
  verifyPayment,
  getMySubscription,
  cancelSubscription,
  retryPayment,
  markPaymentFailed
} from "../controllers/payment.controller.js";

import verifyUser from "../middlewares/auth.middleware.js";

const router = express.Router();

// PAYMENT
router.post("/create-order", verifyUser, createOrder);
router.post("/verify", verifyUser, verifyPayment);

// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   razorpayWebhook
// );

router.post("/retry", verifyUser, retryPayment);
router.post("/fail", verifyUser, markPaymentFailed);

// SUBSCRIPTION
router.get("/subscription/me", verifyUser, getMySubscription);
router.post("/subscription/cancel", verifyUser, cancelSubscription);

export default router;