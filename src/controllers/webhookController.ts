import { Webhook } from "svix";
import { Request, Response } from "express";
import { inngest } from "../config/inngest.js";
import dotenv from "dotenv";

dotenv.config();

export const handleWebhook = async (req: Request, res: Response) => {
    const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!SIGNING_SECRET) {
        throw new Error("Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env");
    }

    // Create new Svix instance with secret
    const wh = new Webhook(SIGNING_SECRET);

    // Get headers and body
    const headers = req.headers;
    // Use rawBody if available (set by middleware), otherwise fallback to stringified body (unreliable)
    const payload = (req as any).rawBody || JSON.stringify(req.body);

    // Get Svix headers for verification
    const svix_id = headers["svix-id"] as string;
    const svix_timestamp = headers["svix-timestamp"] as string;
    const svix_signature = headers["svix-signature"] as string;

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({
            success: false,
            message: "Error: Missing svix headers",
        });
    }

    let evt: any;

    // Attempt to verify the incoming webhook
    try {
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err: any) {
        console.log("Error: Could not verify webhook:", err.message);
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    // Handle the event
    const eventType = evt.type;
    console.log(`📥 Webhook received: ${eventType}`);
    console.log(`📋 Event data:`, JSON.stringify(evt.data, null, 2));

    try {
        await inngest.send({
            name: `clerk/${eventType}`,
            data: evt.data,
        });

        console.log(`✅ Event sent to Inngest: clerk/${eventType}`);
        return res.status(200).json({
            success: true,
            message: "Webhook received and event sent to Inngest",
        });
    } catch (error) {
        console.error("❌ Error sending event to Inngest:", error);
        return res.status(500).json({ success: false, message: "Error processing webhook" });
    }

    return res.status(200).json({
        success: true,
        message: "Webhook received",
    });
};
