import mongoose, { Schema, Document, Model } from 'mongoose';

import { ANNOUNCEMENT_CATEGORIES } from '@/lib/constants';

export { ANNOUNCEMENT_CATEGORIES };

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  body: string;
  category: (typeof ANNOUNCEMENT_CATEGORIES)[number];
  buildingName?: string;
  pinned: boolean;
  publishedAt: Date;
  expiresAt?: Date;
  createdBy: mongoose.Types.ObjectId;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: String, enum: ANNOUNCEMENT_CATEGORIES, default: 'notice' },
    buildingName: { type: String, trim: true },
    pinned: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

export default Announcement;
