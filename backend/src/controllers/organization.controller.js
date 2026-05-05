import Organization from "../models/Organization.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import mongoose from "mongoose";


// SLUG GENERATOR
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
};


// SAFE CLOUDINARY DELETE
const safeDelete = async (public_id) => {
  try {
    if (public_id && typeof public_id === "string") {
      await cloudinary.uploader.destroy(public_id);
    }
  } catch (err) {
    console.log("Cloudinary delete ignored:", err.message);
  }
};


// CREATE ORGANIZATION
export const createOrganization = asyncHandler(async (req, res) => {

  if (req.user.role !== "recruiter") {
    throw new ApiError(403, "Only recruiters allowed");
  }

  const { name } = req.body;

  if (!name) throw new ApiError(400, "Name required");

  // UNIQUE SLUG
  let baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (await Organization.findOne({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const org = await Organization.create({
    ...req.body,
    slug,
    createdBy: req.user._id,
    members: [{ user: req.user._id, role: "owner" }]
  });

  res.status(201).json(
    new ApiResponse(201, org, "Organization created")
  );
});


// GET MY ORGANIZATIONS
export const getMyOrganizations = asyncHandler(async (req, res) => {

  const orgs = await Organization.find({
    createdBy: req.user._id
  }).sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, orgs, "Fetched")
  );
});


// GET SINGLE ORGANIZATION + VIEW COUNT
export const getOrganizationById = asyncHandler(async (req, res) => {

  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Organization not found");

  // ATOMIC VIEW INCREMENT
  await Organization.findByIdAndUpdate(
    org._id,
    { $inc: { views: 1 } }
  );

  res.status(200).json(
    new ApiResponse(200, org, "Fetched")
  );
});


// UPDATE ORGANIZATION
export const updateOrganization = asyncHandler(async (req, res) => {

  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Not found");

  if (org.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  const allowedFields = [
    "name", "tagline", "tags", "overview",
    "culture", "perks"
  ];

  // SAFE UPDATE - Update only allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      org[key] = req.body[key];
    }
  });

  // UPDATE SLUG IF NAME CHANGED
  if (req.body.name) {
    let baseSlug = generateSlug(req.body.name);
    let slug = baseSlug;
    let counter = 1;

    while (await Organization.findOne({ slug, _id: { $ne: org._id } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    org.slug = slug;
  }

  await org.save();

  res.status(200).json(
    new ApiResponse(200, org, "Updated")
  );
});


// DELETE ORGANIZATION
export const deleteOrganization = asyncHandler(async (req, res) => {

  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Not found");

  if (org.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  // SAFE IMAGE DELETE
  await safeDelete(org.logo?.public_id);
  await safeDelete(org.coverImage?.public_id);

  await org.deleteOne(); // cascade handled in model

  res.status(200).json(
    new ApiResponse(200, {}, "Organization deleted")
  );
});


// UPLOAD LOGO
export const uploadLogo = asyncHandler(async (req, res) => {

  if (!req.file) throw new ApiError(400, "No file uploaded");

  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Not found");

  if (org.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  await safeDelete(org.logo?.public_id);

  const uploaded = await cloudinary.uploader.upload(req.file.path, {
    folder: "naukaa/org/logo"
  });

  org.logo = {
    url: uploaded.secure_url,
    public_id: uploaded.public_id
  };

  await org.save();

  fs.unlinkSync(req.file.path);

  res.status(200).json(
    new ApiResponse(200, org.logo, "Logo updated")
  );
});


// UPLOAD COVER IMAGE
export const uploadCoverImage = asyncHandler(async (req, res) => {

  if (!req.file) throw new ApiError(400, "No file uploaded");

  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Not found");

  if (org.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  await safeDelete(org.coverImage?.public_id);

  const uploaded = await cloudinary.uploader.upload(req.file.path, {
    folder: "naukaa/org/cover"
  });

  org.coverImage = {
    url: uploaded.secure_url,
    public_id: uploaded.public_id
  };

  await org.save();

  fs.unlinkSync(req.file.path);

  res.status(200).json(
    new ApiResponse(200, org.coverImage, "Cover updated")
  );
});


// FOLLOW ORGANIZATION
export const followOrganization = asyncHandler(async (req, res) => {

  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Organization not found");

  if (!org.followers.includes(req.user._id)) {
    org.followers.push(req.user._id);
    await org.save();
  }else{
    throw new ApiError(400, "Already following");
  }

  res.status(200).json(
    new ApiResponse(200, {}, "Followed")
  );
});


// UNFOLLOW ORGANIZATION
export const unfollowOrganization = asyncHandler(async (req, res) => {

  const org = await Organization.findById(req.params.id);

  if (!org) throw new ApiError(404, "Organization not found");

  // return a new array of followers excluding the current user
  org.followers = org.followers.filter(
    id => id.toString() !== req.user._id.toString()
  );

  await org.save();

  res.status(200).json(
    new ApiResponse(200, {}, "Unfollowed")
  );
});