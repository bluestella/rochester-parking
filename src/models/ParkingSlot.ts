import mongoose, { Schema, Document, Model } from 'mongoose';

import { SLOT_TYPES } from '@/lib/constants';

export { SLOT_TYPES };
export type SlotType = (typeof SLOT_TYPES)[number];

export interface IParkingSlot extends Document {
  _id: mongoose.Types.ObjectId;
  slotCode: string;
  buildingName: string;
  floor: string;
  isOccupied: boolean;
  currentVehicle?: string;
  type: SlotType;
  assignedUnitId?: mongoose.Types.ObjectId;
  /** Overrides the default monthly parking fee from billing settings. */
  monthlyFee?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ParkingSlotSchema = new Schema<IParkingSlot>(
  {
    slotCode: {
      type: String,
      required: [true, 'Slot code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    buildingName: {
      type: String,
      trim: true,
    },
    floor: {
      type: String,
      required: [true, 'Floor is required'],
      trim: true,
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    currentVehicle: {
      type: String,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: SLOT_TYPES,
      default: 'visitor',
    },
    assignedUnitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      index: true,
    },
    monthlyFee: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for available slots lookup
ParkingSlotSchema.index({ buildingName: 1, isOccupied: 1 });

const ParkingSlot: Model<IParkingSlot> =
  mongoose.models.ParkingSlot ||
  mongoose.model<IParkingSlot>('ParkingSlot', ParkingSlotSchema);

export default ParkingSlot;
