import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: mongoose.Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    index: true,
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    trim: true,
    index: true,
  },
  resourceId: {
    type: Schema.Types.ObjectId,
  },
  details: {
    type: Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for querying logs by user and date
AuditLogSchema.index({ userId: 1, timestamp: -1 });

// Compound index for querying logs by resource
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
