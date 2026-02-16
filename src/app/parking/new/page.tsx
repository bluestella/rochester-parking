import { ParkingForm } from '@/components/parking/ParkingForm';

export default function NewParkingPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">New Parking Entry</h1>
        <p className="text-muted-foreground">
          Record a new vehicle entry into the parking area
        </p>
      </div>

      <ParkingForm />
    </div>
  );
}
