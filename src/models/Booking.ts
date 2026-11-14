import mongoose, { Schema, Document, Model } from 'mongoose';

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  amenityId: mongoose.Types.ObjectId;
  residentId: mongoose.Types.ObjectId;
  buildingName?: string;
  unitNumber?: string;
  start: Date;
  end: Date;
  guests: number;
  purpose?: string;
  fee: number;
  status: BookingStatus;
  decidedBy?: mongoose.Types.ObjectId;
  decisionNote?: string;
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    amenityId: { type: Schema.Types.ObjectId, ref: 'Amenity', required: true },
    residentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buildingName: { type: String },
    unitNumber: { type: String },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    guests: { type: Number, default: 1, min: 1 },
    purpose: { type: String, trim: true },
    fee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decisionNote: { type: String, trim: true },
  },
  { timestamps: true }
);

BookingSchema.index({ amenityId: 1, start: 1, end: 1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
