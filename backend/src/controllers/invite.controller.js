import crypto from "crypto";
import UserModel from "../models/User.model.js";
import OrganizationInvite from "../models/OrganizationInvite.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import Organization from "../models/Organization.model.js";
import { sendEmailToQueue } from "../queues/email.producer.js";
import { EMAIL_TYPES } from "../constants/email.constants.js";

const inviteRecruiter = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const orgId = req.params;

  if (!email || !role) {
    throw new ApiError(403, "Empty fields are not allowed");
  }

  const organization = await Organization.findById(orgId);
  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  if (organization.organizationType != "COMPANY") {
    throw new ApiError(405, "You are not allowed to create recruiter");
  }

  const inviteExist = await OrganizationInvite.findOne({
    email,
    organization: organization._id,
    status: "PENDING",
  });

  if (inviteExist) {
    throw new ApiError(409, {
      success: false,
      message: "Already Invitation send",
    });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const invite = await OrganizationInvite.create({
    email,
    role,

    organization: organization._id,

    invitedBy: req.user._id,

    token: hashedToken,
  });

  const inviteLink = `${process.env.FRONTEND_URL}/invite/${rawToken}`;

  // SEND EMAIL
  await sendEmailToQueue({
    to: email,
    type: EMAIL_TYPES.INVITE_RECRUITER,
    payload: {
      email: email,
      organizationName: organization.name,
      inviteLink: inviteLink,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Invite sent successfully",
    invite,
  });
});

const validateInvite = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Invite token is required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invite = await OrganizationInvite.findOne({
    token: hashedToken,
    status: "PENDING",
  }).populate("organization");

  if (!invite) {
    throw new ApiError(404, "Invalid invite");
  }

  if (invite.isExpired()) {
    throw new ApiError(400, "Invite expired");
  }

  return res.status(200).json({
    success: true,
    message: "Invite valid",
  });
});

const acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const { fullName, password } = req.body;

  if (!fullName || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invite = await OrganizationInvite.findOne({
    token: hashedToken,
    status: "PENDING",
  });

  if (!invite) {
    throw new ApiError(404, "Invalid invite");
  }

  if (invite.isExpired()) {
    throw new ApiError(400, "Invite expired");
  }

  const organization = await Organization.findById(invite.organization);

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  let user = await UserModel.findOne({
    email: invite.email,
  });

  if (user) {
    const alreadyMember = organization.members.find(
      (member) => member.user.toString() === user._id.toString(),
    );

    if (alreadyMember) {
      throw new ApiError(409, "User already member of organization");
    }
  }

  if (!user) {
    user = await UserModel.create({
      fullName,
      email: invite.email,
      password,
      role: "recruiter",
    });
  }

  organization.members.push({
    user: user._id,
    role: invite.role,
  });

  await organization.save();

  await user.save();

  invite.status = "ACCEPTED";

  invite.acceptedAt = new Date();

  await invite.save();

  return res.status(200).json({
    success: true,
    message: "Invite accepted successfully",

    user,

    organization,
  });
});

const cancelInvite = asyncHandler(async (req, res) => {
  const { inviteId } = req.params;

  const invite = await OrganizationInvite.findById(inviteId);

  if (!invite) {
    throw new ApiError(404, "Invite not found");
  }

  if (invite.status !== "PENDING") {
    throw new ApiError(400, "Only pending invite can be cancelled");
  }

  invite.status = "CANCELLED";

  await invite.save();

  return res.status(200).json({
    success: true,
    message: "Invite cancelled successfully",
  });
});

export { inviteRecruiter, validateInvite, acceptInvite, cancelInvite };
