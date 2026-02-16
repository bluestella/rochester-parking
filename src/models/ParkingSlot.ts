import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParkingSlot extends Document {
  _id: mongoose.Types.ObjectId;
  slotCode: string;
  buildingName: string;
  floor: string;
  isOccupied: boolean;
  currentVehicle?: string;
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
      required: [true, 'Building name is required'],
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
