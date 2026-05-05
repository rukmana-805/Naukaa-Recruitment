import cron from "node-cron";
import Job from "../models/Job.model.js";

// Run every one hour and if some job closed today then its status changes to closed.
cron.schedule("0 * * * *", async () => {
  console.log("Running job expiry check...");

  await Job.updateMany(
    {
      expiresAt: { $lte: new Date() },
      status: "open"
    },
    {
      status: "closed"
    }
  );
});