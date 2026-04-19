import mongoose, { Document, Schema } from "mongoose";

export interface INews extends Document {
  // Identity
  telegramId?: string;
  sourceUrl?: string;
  message_id?: number;
  channel_id?: number;

  // Channel info (flat)
  channelName?: string;
  channelUsername?: string;
  channelProfilePic?: string;

  // Content
  rawText?: string;
  content: string;
  title?: string;
  slug?: string;
  summary?: string;

  // Media
  mediaUrl?: string;
  videoUrl?: string;
  coverImage?: string;

  // CMS
  author?: mongoose.Types.ObjectId;
  category?: 'Politics' | 'Tech' | 'Sports' | 'Business' | 'World' | 'Entertainment' | 'Other';
  tags: string[];
  label?: string;

  status: 'draft' | 'pending' | 'published' | 'rejected';

  // Analytics / Engagement
  views: number;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  forwards: number;

  // Source metadata
  source: 'telegram' | 'cms';
  language?: string;
  hasMedia?: boolean;
  hasLinks?: boolean;
  mediaType?: 'image' | 'video' | null;

  // Dates
  scheduledFor?: Date;
  publishedAt?: Date;

  comments?: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const newsSchema: Schema = new Schema(
  {
    // Identity
    telegramId: {
      type: String,
      unique: true,
      sparse: true,
    },
    sourceUrl: { type: String },
    message_id: { type: Number },
    channel_id: { type: Number },

    // Channel info (flat — no nesting)
    channelName: { type: String, trim: true },
    channelUsername: { type: String, trim: true },
    channelProfilePic: { type: String },

    // Content (flat)
    rawText: { type: String },
    content: { type: String, trim: true },
    title: { type: String, trim: true },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    summary: { type: String, trim: true },

    // Media (flat)
    mediaUrl: { type: String },
    videoUrl: { type: String },
    coverImage: { type: String },

    // CMS
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    category: {
      type: String,
      enum: ['Politics', 'Tech', 'Sports', 'Business', 'World', 'Entertainment', 'Other'],
      default: 'Other',
    },
    tags: [{ type: String, trim: true }],
    label: { type: String },

    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'rejected'],
      default: 'published',
    },

    // Analytics / Engagement (cached counters)
    views: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 },
    forwards: { type: Number, default: 0 },

    // Source metadata
    source: {
      type: String,
      enum: ['telegram', 'cms'],
      default: 'telegram',
    },
    language: { type: String, default: 'am' },
    hasMedia: { type: Boolean, default: false },
    hasLinks: { type: Boolean, default: false },
    mediaType: { type: String, enum: ['image', 'video', null], default: null },

    // Dates
    scheduledFor: { type: Date },
    publishedAt: { type: Date, default: Date.now },
    date: { type: String }, // Legacy: ISO string from scraper, kept for backward compat

    // Relations
    comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    }],
  },
  {
    timestamps: true,
    strict: true, // Enforce schema — no more leaking arbitrary nested fields
  }
);

// Indexes for performant querying
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1 });
newsSchema.index({ author: 1 });
newsSchema.index({ channelUsername: 1, createdAt: -1 });
newsSchema.index({ message_id: 1, channel_id: 1 }, { unique: true, sparse: true });
newsSchema.index({ tags: 1 });
newsSchema.index({ content: "text", title: "text" }); // Full-text search

export default mongoose.model<INews>("News", newsSchema);
