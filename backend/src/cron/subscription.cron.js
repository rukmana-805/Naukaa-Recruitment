import cron from "node-cron";
import Subscription from "../models/Subscrption.model.js";
import UserModel from "../models/User.model.js";
import Organization from "../models/Organization.model.js";

cron.schedule("0 0 * * *", async () => {
  console.log("Running expiry job");

  const expired = await Subscription.find({
    endDate: { $lt: new Date() },
    status: "active"
  });

  for (let sub of expired) {
    sub.status = "expired";
    await sub.save();

    const user = await UserModel.findByIdAndUpdate(sub.user, {
      plan: "free",
      subscription: null
    });

    if (user && user.role === "owner") {
      await Organization.findOneAndUpdate(
        { owner: user._id },
        {
          $set: {
            "subscription.plan": "FREE",
            "subscription.isActive": false,
          }
        }
      );
    }
  }
});