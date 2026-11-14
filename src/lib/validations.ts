import { z } from 'zod';
import {
  ANNOUNCEMENT_CATEGORIES,
  CHARGE_KINDS,
  OCCUPANCY,
  PAYMENT_METHODS,
  REQUEST_CATEGORIES,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  UNIT_TYPES,
} from './constants';

// User schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'guard', 'resident']),
  unitNumber: z.string().optional(),
  buildingName: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['admin', 'guard', 'resident']).optional(),
  unitNumber: z.string().optional(),
  buildingName: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Vehicle schemas
export const plateNumberSchema = z
  .string()
  .min(4, 'Plate number must be at least 4 characters')
  .max(10, 'Plate number must be at most 10 characters')
  .transform((val) => val.toUpperCase().trim());

export const createVehicleSchema = z.object({
  plateNumber: plateNumberSchema,
  ownerId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid owner').optional(),
  make: z.string().optional(),
  vehicleModel: z.string().optional(),
  color: z.string().optional(),
});

export const updateVehicleSchema = z.object({
  plateNumber: plateNumberSchema.optional(),
  ownerId: z.string().optional(),
  make: z.string().optional(),
  vehicleModel: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Parking record schemas
export const createParkingRecordSchema = z.object({
  plateNumber: plateNumberSchema,
  buildingName: z.string().min(1, 'Building name is required'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  parkingSlot: z.string().min(1, 'Parking slot is required'),
  entryTimestamp: z.string().datetime().optional(),
  etd: z.string().datetime().optional(),
  vehicleId: z.string().optional(),
  residentId: z.string().optional(),
});

export const updateParkingRecordSchema = z.object({
  plateNumber: plateNumberSchema.optional(),
  buildingName: z.string().min(1).optional(),
  unitNumber: z.string().min(1).optional(),
  parkingSlot: z.string().min(1).optional(),
  entryTimestamp: z.string().datetime().optional(),
  etd: z.string().datetime().optional(),
});

export const exitParkingRecordSchema = z.object({
  exitTimestamp: z.string().datetime().optional(),
});

// Parking slot schemas
export const createParkingSlotSchema = z.object({
  slotCode: z.string().min(1, 'Slot code is required').transform((val) => val.toUpperCase().trim()),
  buildingName: z.string().optional(),
  floor: z.string().min(1, 'Floor is required'),
  type: z.enum(['visitor', 'assigned', 'pwd', 'motorcycle']).default('visitor'),
  assignedUnitId: z.string().regex(/^[a-f\d]{24}$/i).nullish().or(z.literal('')),
  monthlyFee: z.coerce.number().min(0).nullish().or(z.literal('')),
});

export const updateParkingSlotSchema = z.object({
  slotCode: z.string().min(1).transform((val) => val.toUpperCase().trim()).optional(),
  buildingName: z.string().min(1).optional(),
  floor: z.string().min(1).optional(),
  type: z.enum(['visitor', 'assigned', 'pwd', 'motorcycle']).optional(),
  assignedUnitId: z.string().regex(/^[a-f\d]{24}$/i).nullish().or(z.literal('')),
  monthlyFee: z.coerce.number().min(0).nullish().or(z.literal('')),
});

// Building schemas
export const createBuildingSchema = z.object({
  name: z.string().min(2, 'Building name must be at least 2 characters'),
  code: z.string().min(1, 'Building code is required').max(5, 'Building code must be at most 5 characters').transform((val) => val.toUpperCase().trim()),
  address: z.string().optional(),
  floors: z.coerce.number().int().positive().default(1),
});

export const updateBuildingSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(1).max(5).transform((val) => val.toUpperCase().trim()).optional(),
  address: z.string().optional(),
  floors: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

// Equipment schemas
export const createEquipmentSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment ID is required'),
  make: z.string().min(1, 'Make is required'),
  equipmentModel: z.string().min(1, 'Model is required'),
  preventativeMaintenanceSchedule: z.string().datetime().optional(),
  partsInventory: z.string().optional(),
  operatorDetails: z.string().optional(),
});

export const updateEquipmentSchema = z.object({
  equipmentId: z.string().min(1).optional(),
  make: z.string().min(1).optional(),
  equipmentModel: z.string().min(1).optional(),
  preventativeMaintenanceSchedule: z.string().datetime().optional(),
  partsInventory: z.string().optional(),
  operatorDetails: z.string().optional(),
});

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const parkingRecordQuerySchema = paginationSchema.extend({
  status: z.enum(['parked', 'exited']).optional(),
  buildingName: z.string().optional(),
  plateNumber: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type CreateParkingRecordInput = z.infer<typeof createParkingRecordSchema>;
export type UpdateParkingRecordInput = z.infer<typeof updateParkingRecordSchema>;
export type ExitParkingRecordInput = z.infer<typeof exitParkingRecordSchema>;
export type CreateParkingSlotInput = z.infer<typeof createParkingSlotSchema>;
export type UpdateParkingSlotInput = z.infer<typeof updateParkingSlotSchema>;
export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ParkingRecordQueryInput = z.infer<typeof parkingRecordQuerySchema>;

// ---------------------------------------------------------------------------
// Condominium management: units, billing, facilities, community
// ---------------------------------------------------------------------------

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');
const optionalText = z.string().trim().max(2000).optional();
const money = z.coerce.number().min(0).max(100_000_000);
export const periodSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM');

export const unitSchema = z.object({
  buildingName: z.string().trim().min(1, 'Building is required'),
  unitNumber: z.string().trim().min(1, 'Unit number is required').max(12),
  floor: optionalText,
  type: z.enum(UNIT_TYPES).default('1br'),
  areaSqm: z.coerce.number().positive('Floor area must be more than 0').max(5000),
  occupancy: z.enum(OCCUPANCY).default('owner_occupied'),
  ownerId: objectId.nullish().or(z.literal('')),
  tenantName: optionalText,
  notes: optionalText,
});

export const billingSettingsSchema = z.object({
  duesRatePerSqm: money,
  parkingFee: money,
  dueDay: z.coerce.number().int().min(1).max(28),
  penaltyRatePercent: z.coerce.number().min(0).max(100),
  paymentInstructions: optionalText,
});

export const invoiceItemSchema = z.object({
  kind: z.enum(CHARGE_KINDS),
  description: z.string().trim().min(1, 'Describe the charge').max(200),
  amount: z.coerce.number().positive('Amount must be more than 0').max(100_000_000),
});

export const createInvoiceSchema = z.object({
  unitId: objectId,
  period: periodSchema,
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(invoiceItemSchema).min(1, 'Add at least one charge'),
});

export const paymentSchema = z.object({
  invoiceId: objectId,
  amount: z.coerce.number().positive('Amount must be more than 0'),
  method: z.enum(PAYMENT_METHODS),
  reference: optionalText,
  paidAt: z.string().optional(),
  note: optionalText,
});

export const amenitySchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required').max(80),
    description: optionalText,
    location: optionalText,
    capacity: z.coerce.number().int().positive().optional(),
    openHour: z.coerce.number().int().min(0).max(23),
    closeHour: z.coerce.number().int().min(1).max(24),
    feePerHour: money,
    exclusive: z.boolean().default(true),
    requiresApproval: z.boolean().default(true),
    isActive: z.boolean().optional(),
  })
  .refine((a) => a.closeHour > a.openHour, 'Closing hour must be after opening hour');

export const bookingSchema = z.object({
  amenityId: objectId,
  start: z.string().min(1, 'Start time is required'),
  end: z.string().min(1, 'End time is required'),
  guests: z.coerce.number().int().min(1).max(500).default(1),
  purpose: optionalText,
});

export const serviceRequestSchema = z.object({
  title: z.string().trim().min(4, 'Give the request a short title').max(120),
  description: z.string().trim().min(10, 'Describe the problem in a sentence or two').max(2000),
  category: z.enum(REQUEST_CATEGORIES),
  priority: z.enum(REQUEST_PRIORITIES).default('normal'),
  location: optionalText,
});

export const serviceRequestUpdateSchema = z.object({
  status: z.enum(REQUEST_STATUSES).optional(),
  priority: z.enum(REQUEST_PRIORITIES).optional(),
  assignee: z.string().trim().max(120).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(140),
  body: z.string().trim().min(3, 'Write the announcement').max(4000),
  category: z.enum(ANNOUNCEMENT_CATEGORIES).default('notice'),
  buildingName: optionalText,
  pinned: z.boolean().default(false),
  expiresAt: z.string().optional(),
});

export const visitorSchema = z.object({
  visitorName: z.string().trim().min(2, 'Visitor name is required').max(120),
  plateNumber: z.string().trim().max(10).optional(),
  purpose: optionalText,
  expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
  buildingName: optionalText,
  unitNumber: optionalText,
  walkIn: z.boolean().optional(),
});

/** Form values arrive as '' for "none"; store null instead, and only assigned slots keep a unit. */
export function normalizeSlotInput<
  T extends { type?: string; assignedUnitId?: string | null; monthlyFee?: number | string | null },
>(data: T) {
  const assignedUnitId =
    data.type && data.type !== 'assigned' ? null : data.assignedUnitId || null;
  const monthlyFee =
    data.monthlyFee === '' || data.monthlyFee === null || data.monthlyFee === undefined
      ? null
      : Number(data.monthlyFee);
  const out: Record<string, unknown> = { ...data, assignedUnitId, monthlyFee };
  if (data.assignedUnitId === undefined && !data.type) delete out.assignedUnitId;
  if (data.monthlyFee === undefined) delete out.monthlyFee;
  return out;
}
