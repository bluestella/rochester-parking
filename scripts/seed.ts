import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load .env.local file
import { config } from 'dotenv';
config({ path: '.env.local' });

// Import models
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'guard', 'resident'], required: true },
    unitNumber: { type: String },
    buildingName: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const ParkingSlotSchema = new mongoose.Schema(
  {
    slotCode: { type: String, required: true, unique: true },
    buildingName: { type: String, required: true },
    floor: { type: String, required: true },
    isOccupied: { type: Boolean, default: false },
    currentVehicle: { type: String },
  },
  { timestamps: true }
);

const VehicleSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    buildingName: { type: String },
    unitNumber: { type: String },
    make: { type: String },
    vehicleModel: { type: String },
    color: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const ParkingSlot = mongoose.models.ParkingSlot || mongoose.model('ParkingSlot', ParkingSlotSchema);
const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('Please provide MONGODB_URI environment variable');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await ParkingSlot.deleteMany({});
    await Vehicle.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const adminPassword = await bcrypt.hash('admin123', 12);
    const guardPassword = await bcrypt.hash('guard123', 12);
    const residentPassword = await bcrypt.hash('resident123', 12);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@parktrack.com',
      passwordHash: adminPassword,
      role: 'admin',
      isActive: true,
    });

    await User.create({
      name: 'Guard User',
      email: 'guard@parktrack.com',
      passwordHash: guardPassword,
      role: 'guard',
      isActive: true,
      createdBy: admin._id,
    });

    const resident1 = await User.create({
      name: 'John Resident',
      email: 'resident@parktrack.com',
      passwordHash: residentPassword,
      role: 'resident',
      buildingName: 'Tower A',
      unitNumber: '12A',
      isActive: true,
      createdBy: admin._id,
    });

    // Create more residents
    const resident2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      passwordHash: residentPassword,
      role: 'resident',
      buildingName: 'Tower B',
      unitNumber: '305',
      isActive: true,
      createdBy: admin._id,
    });

    console.log('Created users');

    // Create vehicles
    await Vehicle.create({
      plateNumber: 'ABC 1234',
      ownerId: resident1._id,
      make: 'Toyota',
      vehicleModel: 'Camry',
      color: 'Silver',
      isActive: true,
      createdBy: resident1._id,
    });

    await Vehicle.create({
      plateNumber: 'XYZ 9876',
      ownerId: resident2._id,
      make: 'Honda',
      vehicleModel: 'Civic',
      color: 'Black',
      isActive: true,
      createdBy: resident2._id,
    });

    console.log('Created vehicles');

    // Create parking slots
    const buildings = ['Tower A', 'Tower B', 'Tower C'];
    const floors = ['Floor 1', 'Floor 2', 'Basement'];
    const slotsPerFloor = 10;

    const parkingSlots = [];
    for (const building of buildings) {
      for (let floorIndex = 0; floorIndex < floors.length; floorIndex++) {
        const floor = floors[floorIndex];
        const prefix = floor === 'Basement' ? 'B1' : `P${floorIndex + 1}`;
        const buildingPrefix = building.replace('Tower ', '');

        for (let i = 1; i <= slotsPerFloor; i++) {
          parkingSlots.push({
            slotCode: `${prefix}-${buildingPrefix}${i.toString().padStart(2, '0')}`,
            buildingName: building,
            floor,
            isOccupied: false,
          });
        }
      }
    }

    await ParkingSlot.insertMany(parkingSlots);
    console.log(`Created ${parkingSlots.length} parking slots`);

    console.log('\n=== Seed completed successfully ===');
    console.log('\nDemo Credentials:');
    console.log('Admin: admin@parktrack.com / admin123');
    console.log('Guard: guard@parktrack.com / guard123');
    console.log('Resident: resident@parktrack.com / resident123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
