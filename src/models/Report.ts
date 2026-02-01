import mongoose, { Document, Schema } from "mongoose";

export interface IReport extends Document {
    reporter: mongoose.Types.ObjectId;
    targetType: 'news' | 'comment' | 'user';
    targetId: mongoose.Types.ObjectId;
    reason: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    resolvedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const reportSchema: Schema = new Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        targetType: {
            type: String,
            enum: ['news', 'comment', 'user'],
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'targetTypeCase', // Dynamic ref workaround or just ID
        },
        reason: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
            default: 'pending',
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    },
    { timestamps: true }
);

reportSchema.index({ status: 1 });

export default mongoose.model<IReport>("Report", reportSchema);
