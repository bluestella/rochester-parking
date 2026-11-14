import mongoose, { Schema, Document, Model } from 'mongoose';

export type VisitorStatus = 'expected' | 'arrived' | 'departed' | 'cancelled' | 'denied';

export interface IVisitorPass extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  visitorName: string;
  plateNumber?: string;
  purpose?: string;
  buildingName: string;
  unitNumber: string;
  hostId?: mongoose.Types.ObjectId;
  expectedDate: Date;
  status: VisitorStatus;
  arrivedAt?: Date;
  departedAt?: Date;
  handledBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const VisitorPassSchema = new Schema<IVisitorPass>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    visitorName: { type: String, required: true, trim: true },
    plateNumber: { type: String, trim: true, uppercase: true },
    purpose: { type: String, trim: true },
    buildingName: { type: String, required: true },
    unitNumber: { type: String, required: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    expectedDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['expected', 'arrived', 'departed', 'cancelled', 'denied'],
      default: 'expected',
    },
    arrivedAt: { type: Date },
    departedAt: { type: Date },
    handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const VisitorPass: Model<IVisitorPass> =
  mongoose.models.VisitorPass ||
  mongoose.model<IVisitorPass>('VisitorPass', VisitorPassSchema);

export default VisitorPass;
