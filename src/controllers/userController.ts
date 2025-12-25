import User from "../models/User.js";
import { Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import News from "../models/News.js";

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(user);
}
  ;

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);

  const user = await User.findOneAndUpdate({ clerkId: userId }, req.body, {
    new: true,
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(200).json({ user });
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
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
      email: email,
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      username: email.split("@")[0] + "_" + Date.now(),
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
}
  ;

export const followNews = async (req: Request, res: Response): Promise<void> => {
  const { userId } = getAuth(req);
  const { newsId } = req.params;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const currentUser = await User.findOne({ clerkId: userId });
  const targetChannel = await News.findById(newsId);

  if (!currentUser || !targetChannel) {
    res.status(404).json({ message: "User or News not found" });
    return;
  }

  const isFollowing = currentUser.following.some(
    (id) => id.toString() == newsId
  );

  if (isFollowing) {
    // unfollow
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { following: newsId },
    });
    //follow
  } else {
    await User.findByIdAndUpdate(currentUser._id, {
      $addToSet: { following: newsId },
    });
  }
  res.status(200).json({
    message: isFollowing
      ? "News channel unfollowed successfully"
      : "News channel followed successfully",
  });
}
  ;
