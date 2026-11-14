import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBillingSettings extends Document {
  key: string;
  duesRatePerSqm: number;
  parkingFee: number;
  dueDay: number;
  penaltyRatePercent: number;
  paymentInstructions?: string;
  updatedBy?: mongoose.Types.ObjectId;
}

const BillingSettingsSchema = new Schema<IBillingSettings>(
  {
    key: { type: String, default: 'default', unique: true },
    duesRatePerSqm: { type: Number, default: 85, min: 0 },
    parkingFee: { type: Number, default: 1500, min: 0 },
    dueDay: { type: Number, default: 15, min: 1, max: 28 },
    penaltyRatePercent: { type: Number, default: 2, min: 0, max: 100 },
    paymentInstructions: { type: String, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const BillingSettings: Model<IBillingSettings> =
  mongoose.models.BillingSettings ||
  mongoose.model<IBillingSettings>('BillingSettings', BillingSettingsSchema);

export async function getBillingSettings() {
  return BillingSettings.findOneAndUpdate(
    { key: 'default' },
    { $setOnInsert: { key: 'default' } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );
}

export default BillingSettings;
