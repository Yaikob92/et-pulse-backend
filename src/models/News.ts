import mongoose, { Document, Schema } from "mongoose";

export interface IMedia {
  type: 'image' | 'video' | 'document';
  url: string;
}

export interface ISource {
  platform: string;
  url?: string;
}

export interface IEngagement {
  views: number;
  forwards: number;
}

export interface INews extends Document {
  // Identity and Relational fields
  telegram_channel_id?: number;
  telegram_message_id?: number;
  channel_id?: mongoose.Types.ObjectId; // Reference to Channel

  // Content
  title?: string;
  content: string;
  raw_text?: string;

  category?: 'Politics' | 'Tech' | 'Sports' | 'Business' | 'World' | 'Entertainment' | 'Other';
  language?: string;

  // Nested structures
  engagement?: IEngagement;
  media?: IMedia[];
  source?: ISource;

  tags: string[];
  status: 'published' | 'draft' | 'deleted' | 'pending' | 'rejected';

  // Dates
  published_at?: Date;
  scraped_at?: Date;

  // Cached counters and relationships
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  comments?: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const newsSchema: Schema = new Schema(
  {
    // Identity and Relational fields
    telegram_channel_id: { type: Number },
    telegram_message_id: { type: Number },
    channel_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
    },

    // Content
    title: { type: String, trim: true },
    content: { type: String, required: true, trim: true },
    raw_text: { type: String },

    category: {
      type: String,
      enum: ['Politics', 'Tech', 'Sports', 'Business', 'World', 'Entertainment', 'Other'],
      default: 'Other',
    },
    language: { type: String, default: 'am' },

    // Nested structures
    engagement: {
      views: { type: Number, default: 0 },
      forwards: { type: Number, default: 0 },
    },
    media: [
      {
        type: {
          type: String,
          enum: ['image', 'video', 'document'],
          required: true,
        },
        url: { type: String, required: true },
      },
    ],
    source: {
      platform: { type: String, default: 'telegram' },
      url: { type: String },
    },

    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['published', 'draft', 'deleted', 'pending', 'rejected'],
      default: 'published',
    },

    // Dates
    published_at: { type: Date, default: Date.now },
    scraped_at: { type: Date, default: Date.now },

    // Cached counters and relationships
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 },
    comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    }],
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Indexes for performant querying
newsSchema.index({ status: 1, published_at: -1 });
newsSchema.index({ category: 1 });
newsSchema.index({ channel_id: 1, createdAt: -1 });
newsSchema.index({ telegram_message_id: 1, telegram_channel_id: 1 }, { unique: true, sparse: true });
newsSchema.index({ tags: 1 });
newsSchema.index({ content: "text", title: "text" }); // Full-text search

export default mongoose.model<INews>("News", newsSchema);
