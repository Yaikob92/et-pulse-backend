import User from "../models/User.js";
import { Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import cloudinary from "../config/cloudinary.js";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const uploadProfilePicture = async (
  req: MulterRequest,
  res: Response
): Promise<void> => {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: "No file uploaded" });
    return;
  }

  // Validate file size (5 MB hard limit — belt-and-suspenders after multer limit)
  if (req.file.size > 5 * 1024 * 1024) {
    res.status(400).json({ message: "File exceeds maximum allowed size of 5 MB" });
    return;
  }

  try {
    // Convert buffer to base64 data URI
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "et-pulse/avatars",
      resource_type: "image",
      // Resize to a sensible avatar size to save storage/bandwidth
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { profilePicture: result.secure_url },
      { new: true }
    ).select("-clerkId");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Profile picture updated successfully",
      user,
    });
  } catch (error: any) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { firstName, lastName } = req.body;

    // Basic input sanitisation
    const update: Record<string, string> = {};
    if (firstName !== undefined) update.firstName = String(firstName).trim();
    if (lastName !== undefined) update.lastName = String(lastName).trim();

    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      update,
      { new: true, runValidators: true }
    ).select("-clerkId");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error: any) {
    console.error("updateUserProfile error:", error);
    res.status(500).json({ error: "Failed to update profile", message: error.message });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findOne({ clerkId: userId }).select("-clerkId").lean();
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error: any) {
    console.error("getCurrentUser error:", error);
    res.status(500).json({ message: "Failed to get user", error: error.message });
  }
};

export const syncUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: userId }).select("-clerkId").lean();
    if (existingUser) {
      res.status(200).json({ user: existingUser, message: "User already exists" });
      return;
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      res.status(400).json({ message: "User has no email address" });
      return;
    }

    // Build a unique username
    let username = clerkUser.username || email.split("@")[0];
    // Sanitise username
    username = username.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();

    const existingUsername = await User.exists({ username });
    if (existingUsername) {
      username = `${username}_${Date.now().toString(36)}`;
    }

    const user = await User.create({
      clerkId: userId,
      email,
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      username,
      profilePicture: clerkUser.imageUrl || "",
    });

    // Don't return clerkId to the client
    const { clerkId: _omit, ...safeUser } = (user as any).toObject();

    res.status(201).json({ user: safeUser, message: "User created successfully" });
  } catch (error: any) {
    console.error("syncUser error:", error);
    if (error.code === 11000) {
      res.status(409).json({ message: "User already exists (race condition)" });
      return;
    }
    res.status(500).json({ message: "Failed to sync user", error: error.message });
  }
};
