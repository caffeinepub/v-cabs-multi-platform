import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
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
  PaymentRequest,
  RateConfig,
  Ride,
  SOSEvent,
  SavedLocation,
  User,
} from "./types/vcabs";

const DEFAULT_RATE_CONFIG: RateConfig = {
  rideRates: [
    { id: "bike", name: "Bike", icon: "🏍️", multiplier: 1.0, baseRate: 8 },
    { id: "auto", name: "Auto", icon: "🛺", multiplier: 1.2, baseRate: 12 },
    { id: "cab", name: "Cab", icon: "🚕", multiplier: 1.5, baseRate: 15 },
    { id: "cab_ac", name: "Cab A/c", icon: "❄️", multiplier: 1.8, baseRate: 18 },
    { id: "sedan", name: "Sedan", icon: "🚗", multiplier: 2.0, baseRate: 20 },
    { id: "xl", name: "Premium XL", icon: "🚐", multiplier: 2.5, baseRate: 25 },
  ],
  parcelRates: [
    { id: "bike", name: "Bike", icon: "🏍️", multiplier: 1.0, baseRate: 8 },
    { id: "auto", name: "Auto", icon: "🛺", multiplier: 1.2, baseRate: 12 },
    { id: "cab", name: "Cab", icon: "🚕", multiplier: 1.5, baseRate: 15 },
    { id: "cab_ac", name: "Cab A/c", icon: "❄️", multiplier: 1.8, baseRate: 18 },
    { id: "sedan", name: "Sedan", icon: "🚗", multiplier: 2.0, baseRate: 20 },
    { id: "xl", name: "Premium XL", icon: "🚐", multiplier: 2.5, baseRate: 25 },
  ],
  weightSurcharges: [
    { id: "light", label: "Light (<1 kg)", multiplier: 1.0 },
    { id: "medium", label: "Medium (1–5 kg)", multiplier: 1.3 },
    { id: "heavy", label: "Heavy (5–20 kg)", multiplier: 1.7 },
    { id: "oversized", label: "Oversized (20 kg+)", multiplier: 2.2 },
  ],
  peakEnabled: false,
  peakMultiplier: 1.5,
  nightMultiplier: 1.2,
  vCoinRate: 5,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {}
  return fallback;
}

function loadUsers(): User[] {
  try {
    const stored = localStorage.getItem("vcabs_users");
    if (stored) {
      const parsed: User[] = JSON.parse(stored);
      const storedMap = new Map(parsed.map((u) => [u.id, u]));
      const merged = seedUsers.map((su) => storedMap.get(su.id) ?? su);
      const seedIds = new Set(seedUsers.map((u) => u.id));
      const extras = parsed.filter((u) => !seedIds.has(u.id));
      return [...merged, ...extras];
    }
  } catch {}
  return seedUsers;
}

function loadRides(): Ride[] {
  const stored = loadFromStorage<Ride[] | null>("vcabs_rides", null);
  if (stored) return stored;
  return seedRides;
}

function loadAuditLogs(): AuditLog[] {
  const stored = loadFromStorage<AuditLog[] | null>("vcabs_audit", null);
  if (stored) return stored;
  return seedAuditLogs;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [rides, setRides] = useState<Ride[]>(loadRides);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(loadAuditLogs);
  const [sosEvents, setSosEvents] = useState<SOSEvent[]>(
    loadFromStorage<SOSEvent[]>("vcabs_sos", []),
  );
  const [savedLocations] = useState<SavedLocation[]>(seedSavedLocations);
  const [rateConfig, setRateConfig] = useState<RateConfig>(() =>
    loadFromStorage<RateConfig>("vcabs_rates", DEFAULT_RATE_CONFIG),
  );
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(
    loadFromStorage<PaymentRequest[]>("vcabs_payments", []),
  );

  useEffect(() => {
    localStorage.setItem("vcabs_users", JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem("vcabs_rides", JSON.stringify(rides));
  }, [rides]);
  useEffect(() => {
    localStorage.setItem("vcabs_audit", JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem("vcabs_sos", JSON.stringify(sosEvents));
  }, [sosEvents]);
  useEffect(() => {
    localStorage.setItem("vcabs_rates", JSON.stringify(rateConfig));
  }, [rateConfig]);
  useEffect(() => {
    localStorage.setItem("vcabs_payments", JSON.stringify(paymentRequests));
  }, [paymentRequests]);

  const handleLogin = (user: User) => {
    const latest = users.find((u) => u.id === user.id) ?? user;
    setCurrentUser(latest);
  };
  const handleLogout = () => setCurrentUser(null);

  const handleSignup = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
  };

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
        setRides((prevRides) => {
          const activeDriverIds = new Set(
            prevRides
              .filter(
                (r) =>
                  ["accepted", "in_progress"].includes(r.status) && r.driverId,
              )
              .map((r) => r.driverId!),
          );
          const eligibleDrivers = currentUsers.filter(
            (u) =>
              u.role === "driver" &&
              u.status === "active" &&
              u.isOnline &&
              !u.deletedAt &&
              !activeDriverIds.has(u.id),
          );
          const getRequiredVehicleTypes = (rideType: string): string[] => {
            const rt = rideType.toLowerCase();
            if (rt.includes("bike")) return ["Bike"];
            if (rt.includes("auto")) return ["Auto"];
            return ["Cab", "Cab A/c", "Sedan", "Premium XL"];
          };
          const requiredTypes = ride.rideType
            ? getRequiredVehicleTypes(ride.rideType)
            : null;
          const typeMatchedDrivers = requiredTypes
            ? eligibleDrivers.filter(
                (u) => u.vehicleType && requiredTypes.includes(u.vehicleType),
              )
            : eligibleDrivers;
          if (typeMatchedDrivers.length === 0) {
            const typeLabel = ride.rideType ?? "vehicle";
            toast.error(
              `No ${typeLabel} driver available nearby. Try again shortly.`,
              { duration: 4000 },
            );
            return prevRides;
          }
          const driver =
            typeMatchedDrivers[
              Math.floor(Math.random() * typeMatchedDrivers.length)
            ];
          toast.success(`Driver ${driver.name} is on the way! (within 5km)`, {
            duration: 4000,
          });
          return prevRides.map((r) =>
            r.id === ride.id
              ? { ...r, status: "accepted", driverId: driver.id }
              : r,
          );
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
      const action = `${
        user.status === "active" ? "Suspended" : "Activated"
      } user ${user.name} (${userId})`;
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
    if (!user) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, deletedAt: new Date().toISOString() } : u,
      ),
    );
    setAuditLogs((prev) => [
      {
        id: `a${Date.now()}`,
        action: `Moved user ${user.name} (${user.role}) to Trash`,
        actor: currentUser?.name ?? "admin",
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const restoreUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, deletedAt: undefined } : u)),
    );
    setAuditLogs((prev) => [
      {
        id: `a${Date.now()}`,
        action: `Restored user ${user.name} (${user.role}) from Trash`,
        actor: currentUser?.name ?? "admin",
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const permanentDeleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setAuditLogs((prev) => [
      {
        id: `a${Date.now()}`,
        action: `Permanently deleted user ${user.name} (${user.role})`,
        actor: currentUser?.name ?? "admin",
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleSaveRates = (config: RateConfig) => {
    setRateConfig(config);
    setAuditLogs((prev) => [
      {
        id: `a${Date.now()}`,
        action: "Updated rate configuration",
        actor: currentUser?.name ?? "admin",
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleSubmitPaymentRequest = (req: PaymentRequest) => {
    setPaymentRequests((prev) => [req, ...prev]);
    toast.success(
      "Payment request submitted! Admin will allocate V Coins shortly.",
    );
  };

  const handleApprovePayment = (
    requestId: string,
    vCoinsToAllocate: number,
  ) => {
    setPaymentRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "approved" as const,
              vCoinsAllocated: vCoinsToAllocate,
              processedAt: new Date().toISOString(),
            }
          : r,
      ),
    );
    const req = paymentRequests.find((r) => r.id === requestId);
    if (req) {
      updateUser(req.userId, {
        vCoins:
          (users.find((u) => u.id === req.userId)?.vCoins ?? 0) +
          vCoinsToAllocate,
      });
      setAuditLogs((prev) => [
        {
          id: `a${Date.now()}`,
          action: `Approved payment request from ${req.userName}: allocated ${vCoinsToAllocate} V Coins for ₹${req.amountPaid}`,
          actor: currentUser?.name ?? "admin",
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  const handleRejectPayment = (requestId: string, note: string) => {
    setPaymentRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "rejected" as const,
              note,
              processedAt: new Date().toISOString(),
            }
          : r,
      ),
    );
    const req = paymentRequests.find((r) => r.id === requestId);
    if (req) {
      setAuditLogs((prev) => [
        {
          id: `a${Date.now()}`,
          action: `Rejected payment request from ${req.userName} for ₹${req.amountPaid}${note ? `: ${note}` : ""}`,
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
        <LoginScreen
          users={users}
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      ) : currentUser.role === "rider" ? (
        <RiderApp
          currentUser={currentUser}
          rides={rides}
          onAddRide={addRide}
          onUpdateUser={updateUser}
          onAddSOS={addSOS}
          savedLocations={savedLocations}
          onLogout={handleLogout}
          rateConfig={rateConfig}
          onlineDriverCount={
            users.filter(
              (u) => u.role === "driver" && u.isOnline && !u.deletedAt,
            ).length
          }
          onSubmitPaymentRequest={handleSubmitPaymentRequest}
          paymentRequests={paymentRequests.filter(
            (r) => r.userId === currentUser.id,
          )}
          adminUpi="9999000003@okbizaxis"
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
          onSubmitPaymentRequest={handleSubmitPaymentRequest}
          paymentRequests={paymentRequests.filter(
            (r) => r.userId === currentUser.id,
          )}
          adminUpi="9999000003@okbizaxis"
        />
      ) : (
        <AdminDashboard
          currentUser={currentUser}
          users={users}
          rides={rides}
          auditLogs={auditLogs}
          sosEvents={sosEvents}
          rateConfig={rateConfig}
          paymentRequests={paymentRequests}
          onToggleUserStatus={toggleUserStatus}
          onAddUser={addUser}
          onDeleteUser={deleteUser}
          onRestoreUser={restoreUser}
          onPermanentDeleteUser={permanentDeleteUser}
          onSaveRates={handleSaveRates}
          onApprovePayment={handleApprovePayment}
          onRejectPayment={handleRejectPayment}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
