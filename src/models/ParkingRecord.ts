import mongoose, { Schema, Document, Model } from 'mongoose';

export type ParkingStatus = 'parked' | 'exited';

export interface IParkingRecord extends Document {
  _id: mongoose.Types.ObjectId;
  plateNumber: string;
  entryTimestamp: Date;
  exitTimestamp?: Date;
  buildingName: string;
  unitNumber: string;
  parkingSlot: string;
  status: ParkingStatus;
  duration?: number; // in minutes
  vehicleId?: mongoose.Types.ObjectId;
  residentId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ParkingRecordSchema = new Schema<IParkingRecord>(
  {
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    entryTimestamp: {
      type: Date,
      required: [true, 'Entry timestamp is required'],
      default: Date.now,
    },
    exitTimestamp: {
      type: Date,
    },
    buildingName: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true,
    },
    unitNumber: {
      type: String,
      required: [true, 'Unit number is required'],
      trim: true,
    },
    parkingSlot: {
      type: String,
      required: [true, 'Parking slot is required'],
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['parked', 'exited'],
      default: 'parked',
      index: true,
    },
    duration: {
      type: Number,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate active parking for same plate
ParkingRecordSchema.index(
  { plateNumber: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'parked' },
  }
);

// Index for date range queries
ParkingRecordSchema.index({ entryTimestamp: -1 });

// Index for resident history lookups
ParkingRecordSchema.index({ residentId: 1, entryTimestamp: -1 });

// Index for building queries
ParkingRecordSchema.index({ buildingName: 1, status: 1 });

const ParkingRecord: Model<IParkingRecord> =
  mongoose.models.ParkingRecord ||
  mongoose.model<IParkingRecord>('ParkingRecord', ParkingRecordSchema);

export default ParkingRecord;
