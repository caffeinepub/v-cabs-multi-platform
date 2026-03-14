import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AdminDashboard from "./components/AdminDashboard";
import DriverApp from "./components/DriverApp";
import LoginScreen from "./components/LoginScreen";
import RiderApp from "./components/RiderApp";
import { seedAuditLogs, seedRides, seedUsers } from "./data/seedData";
import type { AuditLog, Ride, User } from "./types/vcabs";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [rides, setRides] = useState<Ride[]>(seedRides);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seedAuditLogs);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);

  const addRide = (ride: Ride) => setRides((prev) => [ride, ...prev]);

  const updateRide = (rideId: string, updates: Partial<Ride>) => {
    setRides((prev) =>
      prev.map((r) => (r.id === rideId ? { ...r, ...updates } : r)),
    );
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "suspended" : "active" }
          : u,
      ),
    );
    const user = users.find((u) => u.id === userId);
    if (user) {
      const action = `${user.status === "active" ? "Suspended" : "Activated"} user ${user.name} (${userId})`;
      setAuditLogs((prev) => [
        {
          id: `a${Date.now()}`,
          action,
          actor: currentUser?.name ?? "admin",
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      {!currentUser ? (
        <LoginScreen onLogin={handleLogin} />
      ) : currentUser.role === "rider" ? (
        <RiderApp
          currentUser={currentUser}
          rides={rides}
          onAddRide={addRide}
          onLogout={handleLogout}
        />
      ) : currentUser.role === "driver" ? (
        <DriverApp
          currentUser={currentUser}
          rides={rides}
          onUpdateRide={updateRide}
          onLogout={handleLogout}
        />
      ) : (
        <AdminDashboard
          currentUser={currentUser}
          users={users}
          rides={rides}
          auditLogs={auditLogs}
          onToggleUserStatus={toggleUserStatus}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
