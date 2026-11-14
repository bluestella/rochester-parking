import { ParkingForm } from '@/components/parking/ParkingForm';

export default function NewParkingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-8">
        <h1 className="type-display">New Parking Entry</h1>
        <p className="text-muted-foreground">
          Record a new vehicle entry into the parking area
        </p>
      </div>

      <ParkingForm />
    </div>
  );
}
