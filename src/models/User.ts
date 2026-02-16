import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'guard' | 'resident';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  unitNumber?: string;
  buildingName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ['admin', 'guard', 'resident'],
      required: [true, 'Role is required'],
      default: 'resident',
    },
    unitNumber: {
      type: String,
      trim: true,
    },
    buildingName: {
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
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for role-based queries
UserSchema.index({ role: 1, isActive: 1 });

// Index for resident lookups by building/unit
UserSchema.index({ buildingName: 1, unitNumber: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
