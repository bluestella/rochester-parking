import mongoose, { Schema, Document, Model } from 'mongoose';

import { UNIT_TYPES, OCCUPANCY } from '@/lib/constants';

export { UNIT_TYPES, OCCUPANCY };
export type UnitType = (typeof UNIT_TYPES)[number];
export type Occupancy = (typeof OCCUPANCY)[number];

export interface IUnit extends Document {
  _id: mongoose.Types.ObjectId;
  buildingName: string;
  unitNumber: string;
  floor?: string;
  type: UnitType;
  areaSqm: number;
  occupancy: Occupancy;
  ownerId?: mongoose.Types.ObjectId;
  tenantName?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new Schema<IUnit>(
  {
    buildingName: { type: String, required: true, trim: true },
    unitNumber: { type: String, required: true, trim: true, uppercase: true },
    floor: { type: String, trim: true },
    type: { type: String, enum: UNIT_TYPES, default: '1br' },
    areaSqm: { type: Number, required: true, min: 0 },
    occupancy: { type: String, enum: OCCUPANCY, default: 'owner_occupied' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    tenantName: { type: String, trim: true },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UnitSchema.index({ buildingName: 1, unitNumber: 1 }, { unique: true });

const Unit: Model<IUnit> = mongoose.models.Unit || mongoose.model<IUnit>('Unit', UnitSchema);

export default Unit;
