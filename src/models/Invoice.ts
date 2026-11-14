import mongoose, { Schema, Document, Model } from 'mongoose';

import { CHARGE_KINDS } from '@/lib/constants';

export { CHARGE_KINDS };
export type ChargeKind = (typeof CHARGE_KINDS)[number];
export type InvoiceStatus = 'open' | 'paid' | 'void';

export interface IInvoiceItem {
  kind: ChargeKind;
  description: string;
  amount: number;
}

export interface IInvoice extends Document {
  _id: mongoose.Types.ObjectId;
  number: string;
  unitId: mongoose.Types.ObjectId;
  buildingName: string;
  unitNumber: string;
  period: string; // YYYY-MM
  /** `${unitId}:${period}` on monthly statements; guarantees one per unit per month. */
  runKey?: string;
  items: IInvoiceItem[];
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  penaltyPeriods: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    number: { type: String, required: true, unique: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
    buildingName: { type: String, required: true },
    unitNumber: { type: String, required: true },
    period: { type: String, required: true, match: /^\d{4}-\d{2}$/, index: true },
    runKey: { type: String },
    items: [
      {
        _id: false,
        kind: { type: String, enum: CHARGE_KINDS, required: true },
        description: { type: String, required: true, trim: true },
        amount: { type: Number, required: true },
      },
    ],
    total: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['open', 'paid', 'void'], default: 'open', index: true },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    penaltyPeriods: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

InvoiceSchema.index(
  { runKey: 1 },
  { unique: true, partialFilterExpression: { runKey: { $type: 'string' } } }
);
InvoiceSchema.index({ status: 1, dueDate: 1 });

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;
