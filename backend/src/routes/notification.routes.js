import Router from "express";

import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  unreadNoticationsCount,
} from "../controllers/notification.controller.js";

import verifyUser from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/get-notifications", verifyUser, getMyNotifications);
router.post("/mark-as-read/:id", verifyUser, markAsRead);
router.post("/mark-all-as-read", verifyUser, markAllAsRead);
router.get("/unread-count", verifyUser, unreadNoticationsCount);


export default router;
