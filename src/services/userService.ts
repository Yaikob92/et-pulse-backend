import User from "../models/User.js";
import Comment from "../models/Comment.js";
import News from "../models/News.js";
import Interaction from "../models/Interaction.js";
import Bookmarks from "../models/BookMarks.js";
import Report from "../models/Report.js";
import cloudinary from "../config/cloudinary.js";

export const deleteUserRelatedData = async (clerkId: string) => {
    const user = await User.findOne({ clerkId });
    if (!user) {
        throw new Error("User not found");
    }

    const userId = user._id;

    // Delete profile picture from Cloudinary if it exists
    if (user.profilePicture) {
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
            }
        } catch (err) {
            console.error("Failed to delete profile picture from Cloudinary:", err);
        }
    }

    // 1. Remove user from 'likes' array in Comments
    await Comment.updateMany(
        { likes: userId },
        { $pull: { likes: userId } }
    );

    const userComments = await Comment.find({ user: userId });
    for (const comment of userComments) {
        await News.findByIdAndUpdate(comment.news, { $inc: { commentsCount: -1 } });
    }
    await Comment.deleteMany({ user: userId });

    // 3. Delete Bookmarks
    const userBookmarks = await Bookmarks.find({ user: userId });
    for (const bookmark of userBookmarks) {
        await News.findByIdAndUpdate(bookmark.news, { $inc: { bookmarks: -1 } });
    }
    await Bookmarks.deleteMany({ user: userId });

    // 4. Delete Interactions (Likes/Reposts)
    const userInteractions = await Interaction.find({ user: userId });
    for (const interaction of userInteractions) {
        if (interaction.type === 'like') {
            await News.findByIdAndUpdate(interaction.news, { $inc: { likes: -1 } });
        }
        // Handle other types if necessary
    }
    await Interaction.deleteMany({ user: userId });

    // 5. Delete Reports made by the user
    await Report.deleteMany({ reporter: userId });

    // 6. Delete the User
    await User.findByIdAndDelete(userId);

    return { message: "User and related data deleted successfully" };
};
