export type Role = "rider" | "driver" | "admin";
export type RideStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface User {
  id: string;
  name: string;
  role: Role;
  status: "active" | "suspended";
  vCoins: number;
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
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

export interface AppState {
  users: User[];
  rides: Ride[];
  auditLogs: AuditLog[];
  currentUser: User | null;
}
