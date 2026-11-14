import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAmenity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  openHour: number;
  closeHour: number;
  feePerHour: number;
  /** One booking at a time (function hall) vs shared use (gym). */
  exclusive: boolean;
  requiresApproval: boolean;
  isActive: boolean;
}

const AmenitySchema = new Schema<IAmenity>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    location: { type: String, trim: true },
    capacity: { type: Number, min: 1 },
    openHour: { type: Number, default: 6, min: 0, max: 23 },
    closeHour: { type: Number, default: 22, min: 1, max: 24 },
    feePerHour: { type: Number, default: 0, min: 0 },
    exclusive: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Amenity: Model<IAmenity> =
  mongoose.models.Amenity || mongoose.model<IAmenity>('Amenity', AmenitySchema);

export default Amenity;
