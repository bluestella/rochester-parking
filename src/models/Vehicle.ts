import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVehicle extends Document {
  _id: mongoose.Types.ObjectId;
  plateNumber: string;
  ownerId?: mongoose.Types.ObjectId;
  buildingName: string;
  unitNumber: string;
  make?: string;
  vehicleModel?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    make: {
      type: String,
      trim: true,
    },
    vehicleModel: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for owner lookups
VehicleSchema.index({ ownerId: 1, isActive: 1 });

// Index for building/unit lookups
VehicleSchema.index({ buildingName: 1, unitNumber: 1 });

const Vehicle: Model<IVehicle> =
  mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', VehicleSchema);

export default Vehicle;
