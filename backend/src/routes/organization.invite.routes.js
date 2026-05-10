import Router from "express";

import verifyUser from "../middlewares/auth.middleware.js";
import isOwner from "../middlewares/isOwner.middleware.js";
import {
    inviteRecruiter,
    validateInvite,
    acceptInvite,
    cancelInvite
} from "../controllers/invite.controller.js";

const router = Router();

router.post("/invite-recruiter/:id", verifyUser, isOwner, inviteRecruiter);
router.get("/validate-invite/:token", validateInvite);
router.post("/accept-invite/:token", acceptInvite);
router.post("/cancel-invite", verifyUser, isOwner, cancelInvite);

export default router;