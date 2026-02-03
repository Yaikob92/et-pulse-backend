import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import User from "../models/User.js";
import { deleteUserRelatedData } from "../services/userService.js";

export const inngest = new Inngest({ id: "et-news-backend" });

const syncUser = inngest.createFunction(
    { id: "sync-user" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        await connectDB();
        const { id, email_addresses, first_name, last_name, image_url, username } =
            event.data;

        const email = email_addresses[0]?.email_address;

        if (!email) {
            console.error("User created without email:", id);
            return;
        }

        const fallbackUsername = email.split('@')[0];

        const newUser = {
            clerkId: id,
            email: email,
            firstName: first_name || "",
            lastName: last_name || "",
            username: username || fallbackUsername,
            profilePicture: image_url || "",
            role: 'user',
            status: 'active'
        };

        try {
            await User.create(newUser);
            console.log(`User synced: ${id}`);
        } catch (error) {
            console.error(`Failed to sync user ${id}:`, error);
        }
    },
);

const deleteUserFromDB = inngest.createFunction(
    { id: "delete-user-from-db" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        await connectDB();
        const { id } = event.data;
        try {
            await deleteUserRelatedData(id);
            console.log(`User deleted via Inngest: ${id}`);
        } catch (error) {
            console.error(`Failed to delete user via Inngest ${id}:`, error);
        }
    },
);

export const functions = [syncUser, deleteUserFromDB];
