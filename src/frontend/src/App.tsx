import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { toast } from "sonner";
import AdminDashboard from "./components/AdminDashboard";
import DriverApp from "./components/DriverApp";
import LoginScreen from "./components/LoginScreen";
import RiderApp from "./components/RiderApp";
import {
  seedAuditLogs,
  seedRides,
  seedSavedLocations,
  seedUsers,
} from "./data/seedData";
import type {
  AuditLog,
  Ride,
  SOSEvent,
  SavedLocation,
  User,
} from "./types/vcabs";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [rides, setRides] = useState<Ride[]>(seedRides);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(seedAuditLogs);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>([]);
  const [savedLocations] = useState<SavedLocation[]>(seedSavedLocations);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
    );
    setCurrentUser((prev) =>
      prev && prev.id === userId ? { ...prev, ...updates } : prev,
    );
  };

  const addRide = (ride: Ride) => {
    setRides((prev) => [ride, ...prev]);
    setTimeout(() => {
      setUsers((currentUsers) => {
        const onlineDrivers = currentUsers.filter(
          (u) => u.role === "driver" && u.status === "active" && u.isOnline,
        );
        if (onlineDrivers.length === 0) return currentUsers;
        const driver =
          onlineDrivers[Math.floor(Math.random() * onlineDrivers.length)];
        setRides((prevRides) =>
          prevRides.map((r) =>
            r.id === ride.id
              ? { ...r, status: "accepted", driverId: driver.id }
              : r,
          ),
        );
        toast.success(`Driver ${driver.name} is on the way! (within 5km)`, {
          duration: 4000,
        });
        return currentUsers;
      });
    }, 2000);
  };

  const updateRide = (rideId: string, updates: Partial<Ride>) => {
    setRides((prev) =>
      prev.map((r) => (r.id === rideId ? { ...r, ...updates } : r)),
    );
  };

  const addSOS = (event: SOSEvent) => {
    setSosEvents((prev) => [event, ...prev]);
    toast.error("SOS Alert sent to V Cabs Safety Team!", { duration: 5000 });
  };

  const toggleUserStatus = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      updateUser(userId, {
        status: user.status === "active" ? "suspended" : "active",
      });
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

  const addUser = (user: User) => {
    setUsers((prev) => [...prev, user]);
    setAuditLogs((prev) => [
      {
        id: `a${Date.now()}`,
        action: `Added user ${user.name} (${user.role})`,
        actor: currentUser?.name ?? "admin",
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const deleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (user) {
      setAuditLogs((prev) => [
        {
          id: `a${Date.now()}`,
          action: `Deleted user ${user.name} (${user.role})`,
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
          onUpdateUser={updateUser}
          onAddSOS={addSOS}
          savedLocations={savedLocations}
          onLogout={handleLogout}
        />
      ) : currentUser.role === "driver" ? (
        <DriverApp
          currentUser={currentUser}
          rides={rides}
          onUpdateRide={updateRide}
          onUpdateUser={updateUser}
          onAddSOS={addSOS}
          savedLocations={savedLocations}
          onLogout={handleLogout}
        />
      ) : (
        <AdminDashboard
          currentUser={currentUser}
          users={users}
          rides={rides}
          auditLogs={auditLogs}
          sosEvents={sosEvents}
          onToggleUserStatus={toggleUserStatus}
          onAddUser={addUser}
          onDeleteUser={deleteUser}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
