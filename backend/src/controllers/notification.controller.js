import Notification from "../models/Notification.model.js";
import UserModel from "../models/User.model.js";

const getMyNotifications = async (req, res) => {
  const userId = req.user._id;

  const user = await UserModel.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(notifications);
};

const markAsRead = async (req, res) => {
  const { id } = req.params;

  await Notification.findByIdAndUpdate(id, {
    isRead: true
  });

  res.json({ success: true });
};

const markAllAsRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ success: true });
};

const unreadNoticationsCount = async (req, res) => {

  const count = await Notification.countDocuments({
    user: req.user._id,
    isRead: false
  });

  res.json({ count });
  
};

export {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  unreadNoticationsCount
};