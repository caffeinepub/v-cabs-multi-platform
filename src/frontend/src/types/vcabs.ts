export type Role = "rider" | "driver" | "admin";
export type RideStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface UserDocuments {
  idProof?: string; // data URL
  photo?: string; // data URL
  vehicleRc?: string; // data URL (driver only)
  insurance?: string; // data URL (driver only)
  permit?: string; // data URL (driver only)
}

export interface User {
  id: string;
  name: string;
  role: Role;
  status: "active" | "suspended";
  vCoins: number;
  phone?: string;
  password?: string;
  email?: string;
  city?: string;
  isOnline?: boolean;
  rating?: number;
  savedAddresses?: { home?: string; work?: string };
  photoUrl?: string;
  documents?: UserDocuments;
  vehicleType?: string;
  vehicleNumber?: string;
  deletedAt?: string; // soft-delete timestamp
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  pickup: string;
  destination: string;
  fare: number;
  status: RideStatus;
  otp: string;
  createdAt: string;
  pickupLat?: number;
  pickupLng?: number;
  destLat?: number;
  destLng?: number;
  distanceKm?: number;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

export interface SOSEvent {
  id: string;
  userId: string;
  userName: string;
  role: string;
  city: string;
  location: string;
  timestamp: string;
}

export interface SavedLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  city: string;
}

export interface VehicleRate {
  id: string;
  name: string;
  icon: string;
  multiplier: number;
  baseRate: number;
}

export interface WeightSurcharge {
  id: string;
  label: string;
  multiplier: number;
}

export interface RateConfig {
  rideRates: VehicleRate[];
  parcelRates: VehicleRate[];
  weightSurcharges: WeightSurcharge[];
  peakEnabled: boolean;
  peakMultiplier: number;
  nightMultiplier: number;
  vCoinRate: number;
}

export interface AppState {
  users: User[];
  rides: Ride[];
  auditLogs: AuditLog[];
  currentUser: User | null;
  sosEvents: SOSEvent[];
  savedLocations: SavedLocation[];
}
