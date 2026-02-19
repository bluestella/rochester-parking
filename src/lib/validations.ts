import { z } from 'zod';

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
  ownerId: z.string().optional(),
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
});

export const updateParkingSlotSchema = z.object({
  slotCode: z.string().min(1).transform((val) => val.toUpperCase().trim()).optional(),
  buildingName: z.string().min(1).optional(),
  floor: z.string().min(1).optional(),
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
