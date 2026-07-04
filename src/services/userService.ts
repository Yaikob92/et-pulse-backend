import User from "../models/User.js";
import Comment from "../models/Comment.js";
import News from "../models/News.js";
import Interaction from "../models/Interaction.js";
import Bookmarks from "../models/BookMarks.js";
import Report from "../models/Report.js";
import cloudinary from "../config/cloudinary.js";

export const deleteUserRelatedData = async (clerkId: string) => {
    console.log(`🔍 Looking for user with Clerk ID: ${clerkId}`);
    const user = await User.findOne({ clerkId });
    if (!user) {
        console.warn(`⚠️  User not found in database with Clerk ID: ${clerkId}`);
        throw new Error(`User not found with Clerk ID: ${clerkId}`);
    }

    const userId = user._id;
    console.log(`📝 Found user in database - MongoDB ID: ${userId}, Email: ${user.email}`);

    // Delete profile picture from Cloudinary if it exists
    if (user.profilePicture) {
        console.log(`🖼️  Deleting profile picture from Cloudinary...`);
        try {
            const parts = user.profilePicture.split('/');
            const filename = parts[parts.length - 1];
            const publicId = filename.split('.')[0];

            const regex = /\/v\d+\/([^/]+)\./;
            const urlParts = user.profilePicture.split('/');
            const versionIndex = urlParts.findIndex(part => part.startsWith('v') && !isNaN(Number(part.substring(1))));
            if (versionIndex !== -1) {
                const publicIdWithExtension = urlParts.slice(versionIndex + 1).join('/');
                const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
                await cloudinary.uploader.destroy(publicId);
                console.log(`✅ Profile picture deleted from Cloudinary`);
            }
        } catch (err) {
            console.error("❌ Failed to delete profile picture from Cloudinary:", err);
        }
    }

    // 1. Remove user from 'likes' array in Comments
    console.log(`💬 Removing user from comment likes...`);
    await Comment.updateMany(
        { likes: userId },
        { $pull: { likes: userId } }
    );

    console.log(`💬 Deleting user comments...`);
    const userComments = await Comment.find({ user: userId });
    for (const comment of userComments) {
        await News.findByIdAndUpdate(comment.news, { $inc: { commentsCount: -1 } });
    }
    await Comment.deleteMany({ user: userId });
    console.log(`✅ Deleted ${userComments.length} comments`);

    // 3. Delete Bookmarks
    console.log(`🔖 Deleting user bookmarks...`);
    const userBookmarks = await Bookmarks.find({ user: userId });
    for (const bookmark of userBookmarks) {
        await News.findByIdAndUpdate(bookmark.news, { $inc: { bookmarksCount: -1 } });
    }
    await Bookmarks.deleteMany({ user: userId });
    console.log(`✅ Deleted ${userBookmarks.length} bookmarks`);

    // 4. Delete Interactions (Likes/Reposts)
    console.log(`👍 Deleting user interactions...`);
    const userInteractions = await Interaction.find({ user: userId });
    for (const interaction of userInteractions) {
        if (interaction.type === 'like') {
            await News.findByIdAndUpdate(interaction.news, { $inc: { likesCount: -1 } });
        }
        // Handle other types if necessary
    }
    await Interaction.deleteMany({ user: userId });
    console.log(`✅ Deleted ${userInteractions.length} interactions`);

    // 5. Delete Reports made by the user
    console.log(`🚩 Deleting user reports...`);
    const deletedReports = await Report.deleteMany({ reporter: userId });
    console.log(`✅ Deleted ${deletedReports.deletedCount} reports`);

    // 6. Delete the User
    console.log(`👤 Deleting user from database...`);
    await User.findByIdAndDelete(userId);
    console.log(`✅ User deleted from database successfully`);

    return { message: "User and related data deleted successfully" };
};
