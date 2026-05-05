import cron from "node-cron";
import Subscription from "../models/Subscription.model.js";
import UserModel from "../models/User.model.js";

cron.schedule("0 0 * * *", async () => {
  console.log("Running expiry job");

  const expired = await Subscription.find({
    endDate: { $lt: new Date() },
    status: "active"
  });

  for (let sub of expired) {
    sub.status = "expired";
    await sub.save();

    await UserModel.findByIdAndUpdate(sub.user, {
      plan: "free",
      subscription: null
    });
  }
});