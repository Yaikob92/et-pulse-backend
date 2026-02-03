import User from "../models/User.js";
import { Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import News from "../models/News.js";
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

  try {
    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "et-pulse/avatars",
      resource_type: "image",
    });

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { profilePicture: result.secure_url },
      { new: true }
    );

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
  const { userId } = getAuth(req);
  const { firstName, lastName } = req.body;

  const user = await User.findOneAndUpdate(
    { clerkId: userId },
    { firstName, lastName },
    {
      new: true,
    }
  );
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(200).json({ user });
};

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.status(200).json({ user });
};

export const syncUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // check if user already exists in db
  const existingUser = await User.findOne({ clerkId: userId });
  if (existingUser) {
    res
      .status(200)
      .json({ user: existingUser, message: "User already exists" });
    return;
  }
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      res.status(400).json({ message: "User has no email address" });
      return;
    }

    const userData = {
      clerkId: userId,
      email: clerkUser.emailAddresses[0].emailAddress,
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      username: clerkUser.emailAddresses[0].emailAddress.split("@")[0],
      profilePicture: clerkUser.imageUrl || "",
    };

    const user = await User.create(userData);

    res.status(201).json({ user, message: "User created Successfully" });
  } catch (error: any) {
    console.error("Error syncing user:", error);
    res
      .status(500)
      .json({ message: "Failed to sync user", error: error.message });
  }
};
