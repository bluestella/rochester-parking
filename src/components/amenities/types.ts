export interface Amenity {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  capacity?: number;
  openHour: number;
  closeHour: number;
  feePerHour: number;
  exclusive: boolean;
  requiresApproval: boolean;
  isActive: boolean;
}
export interface Booking {
  _id: string;
  amenityId?: { _id: string; name: string; location?: string };
  residentId?: { name: string };
  buildingName?: string;
  unitNumber?: string;
  start: string;
  end: string;
  guests: number;
  purpose?: string;
  fee: number;
  status: string;
  decisionNote?: string;
}
