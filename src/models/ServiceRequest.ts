import mongoose, { Schema, Document, Model } from 'mongoose';

import { REQUEST_CATEGORIES, REQUEST_PRIORITIES, REQUEST_STATUSES } from '@/lib/constants';

export { REQUEST_CATEGORIES, REQUEST_PRIORITIES, REQUEST_STATUSES };
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface IRequestUpdate {
  at: Date;
  byName: string;
  byRole: string;
  note?: string;
  status?: RequestStatus;
}

export interface IServiceRequest extends Document {
  _id: mongoose.Types.ObjectId;
  ticketNumber: string;
  title: string;
  description: string;
  category: (typeof REQUEST_CATEGORIES)[number];
  priority: (typeof REQUEST_PRIORITIES)[number];
  status: RequestStatus;
  location?: string;
  buildingName?: string;
  unitNumber?: string;
  requesterId: mongoose.Types.ObjectId;
  assignee?: string;
  updates: IRequestUpdate[];
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, enum: REQUEST_CATEGORIES, default: 'other' },
    priority: { type: String, enum: REQUEST_PRIORITIES, default: 'normal' },
    status: { type: String, enum: REQUEST_STATUSES, default: 'open', index: true },
    location: { type: String, trim: true },
    buildingName: { type: String },
    unitNumber: { type: String },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignee: { type: String, trim: true },
    updates: [
      {
        _id: false,
        at: { type: Date, default: Date.now },
        byName: String,
        byRole: String,
        note: String,
        status: String,
      },
    ],
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const ServiceRequest: Model<IServiceRequest> =
  mongoose.models.ServiceRequest ||
  mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);

export default ServiceRequest;
