import mongoose, { Document, Schema } from "mongoose";

export interface INews extends Document {
  // Telegram Specific (Optional for CMS)
  telegramId?: string;
  channelUsername?: string;
  channelProfilePic?: string;
  mediaUrl?: string;

  // CMS Specific
  title?: string; // Optional because Telegram posts might not have titles
  slug?: string;
  summary?: string;
  content: string; // Used for both
  coverImage?: string;

  author?: mongoose.Types.ObjectId;
  category?: 'Politics' | 'Tech' | 'Sports' | 'Business' | 'World' | 'Entertainment' | 'Other';
  tags: string[];

  status: 'draft' | 'pending' | 'published' | 'rejected';

  // Analytics Cache
  views: number;
  likes: number; // Cache for Interaction counts
  bookmarks: number;
  commentsCount: number; // Cache

  scheduledFor?: Date;
  publishedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const newsSchema: Schema = new Schema(
  {
    // Telegram Fields
    telegramId: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined to be non-unique
    },
    channelUsername: {
      type: String,
      trim: true,
    },
    channelProfilePic: {
      type: String,
    },
    mediaUrl: {
      type: String,
    },

    // CMS Fields
    title: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    category: {
      type: String,
      enum: ['Politics', 'Tech', 'Sports', 'Business', 'World', 'Entertainment', 'Other'],
      default: 'Other',
    },
    tags: [
      {
        type: String,
        trim: true,
      }
    ],
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'rejected'],
      default: 'published', // Default to published for Telegram compatibility
    },

    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    bookmarks: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0
    },

    scheduledFor: {
      type: Date,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },

    // Virtual or ref for comments (kept from original, though array specific might not be scalable for millions, virtual is better)
    // Keeping original array for backward compatibility if it was used, BUT original file had:
    // comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }]
    // For scalability, it is better NOT to store array of IDs on the parent.
    // I will comment it out or deprecate it, preferring virtual population.
    // But to match current logic:
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

// Index for performant querying
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1 });
newsSchema.index({ author: 1 });

export default mongoose.model<INews>("News", newsSchema);
