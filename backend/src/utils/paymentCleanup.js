import Payment from "../models/payment.model.js";

// mark stale "created" payments as failed (older than X mins)
export const cleanupStaleCreatedPayments = async (userId, minutes = 15) => {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);

  await Payment.updateMany(
    {
      user: userId,
      status: "created",
      createdAt: { $lt: cutoff }
    },
    { status: "failed" }
  );
};