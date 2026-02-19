import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEquipment extends Document {
  _id: mongoose.Types.ObjectId;
  equipmentId: string;
  make: string;
  equipmentModel: string;
  preventativeMaintenanceSchedule?: Date;
  partsInventory?: string;
  operatorDetails?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    equipmentId: {
      type: String,
      required: [true, 'Equipment ID is required'],
      unique: true,
      trim: true,
    },
    make: {
      type: String,
      required: [true, 'Make is required'],
      trim: true,
    },
    equipmentModel: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    preventativeMaintenanceSchedule: {
      type: Date,
    },
    partsInventory: {
      type: String,
      trim: true,
    },
    operatorDetails: {
      type: String,
      trim: true,
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

const Equipment: Model<IEquipment> =
  mongoose.models.Equipment || mongoose.model<IEquipment>('Equipment', EquipmentSchema);

export default Equipment;
