import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBuilding extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  address?: string;
  floors: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
}

const BuildingSchema = new Schema<IBuilding>(
  {
    name: {
      type: String,
      required: [true, 'Building name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Building code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 5,
    },
    address: {
      type: String,
      trim: true,
    },
    floors: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for active buildings lookup
BuildingSchema.index({ isActive: 1, name: 1 });

const Building: Model<IBuilding> =
  mongoose.models.Building ||
  mongoose.model<IBuilding>('Building', BuildingSchema);

export default Building;
