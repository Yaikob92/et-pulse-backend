import mongoose, { Document, Schema } from "mongoose";

export interface IAdminLog extends Document {
    admin: mongoose.Types.ObjectId;
    action: string;
    targetType?: string;
    targetId?: mongoose.Types.ObjectId;
    details?: any; // JSON string or Mixed
    ipAddress?: string;
    createdAt: Date;
}

const adminLogSchema: Schema = new Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        targetType: {
            type: String,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        details: {
            type: Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
        }
    },
    { timestamps: { createdAt: true, updatedAt: false } } // Only createdAt needed for logs
);

adminLogSchema.index({ admin: 1 });
adminLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAdminLog>("AdminLog", adminLogSchema);
