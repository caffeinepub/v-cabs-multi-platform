import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Car,
  ClipboardList,
  Coins,
  DollarSign,
  LayoutDashboard,
  LogOut,
  TrendingUp,
  Users,
} from "lucide-react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuditLog, Ride, SOSEvent, User } from "../types/vcabs";

const INDIAN_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
  "Surat",
  "Pune",
  "Jaipur",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Patna",
  "Vadodara",
  "Ghaziabad",
];

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  rides: Ride[];
  auditLogs: AuditLog[];
  sosEvents?: SOSEvent[];
  onToggleUserStatus: (userId: string) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onLogout: () => void;
}

type AdminPage = "dashboard" | "users" | "rides" | "audit" | "rates" | "sos";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const VEHICLE_DEFAULTS = [
  { id: "bike", name: "Bike", icon: "🏍️", multiplier: 1.0, baseRate: 8 },
  { id: "auto", name: "Auto", icon: "🛺", multiplier: 1.2, baseRate: 12 },
  { id: "cab", name: "Cab", icon: "🚕", multiplier: 1.5, baseRate: 15 },
  { id: "cab_ac", name: "Cab A/c", icon: "❄️", multiplier: 1.8, baseRate: 18 },
  { id: "sedan", name: "Sedan", icon: "🚗", multiplier: 2.0, baseRate: 20 },
  { id: "xl", name: "Premium XL", icon: "🚐", multiplier: 2.5, baseRate: 25 },
];

const WEIGHT_DEFAULTS = [
  { id: "light", label: "Light (<1 kg)", multiplier: 1.0 },
  { id: "medium", label: "Medium (1–5 kg)", multiplier: 1.3 },
  { id: "heavy", label: "Heavy (5–20 kg)", multiplier: 1.7 },
  { id: "oversized", label: "Oversized (20 kg+)", multiplier: 2.2 },
];

export default function AdminDashboard({
  currentUser,
  users,
  rides,
  auditLogs,
  sosEvents = [],
  onToggleUserStatus,
  onAddUser,
  onDeleteUser,
  onLogout,
}: AdminDashboardProps) {
  const [page, setPage] = useState<AdminPage>("dashboard");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<"rider" | "driver">("rider");
  const [newUserCity, setNewUserCity] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  // Rate management state
  const [rideRates, setRideRates] = useState(
    VEHICLE_DEFAULTS.map((v) => ({ ...v })),
  );
  const [parcelRates, setParcelRates] = useState(
    VEHICLE_DEFAULTS.map((v) => ({ ...v })),
  );
  const [weightSurcharges, setWeightSurcharges] = useState(
    WEIGHT_DEFAULTS.map((w) => ({ ...w })),
  );
  const [peakEnabled, setPeakEnabled] = useState(false);
  const [peakMultiplier, setPeakMultiplier] = useState("1.5");
  const [nightMultiplier, setNightMultiplier] = useState("1.2");
  const [vCoinRate, setVCoinRate] = useState("5");

  const totalRevenue = rides
    .filter((r) => r.status === "completed")
    .reduce((s, r) => s + r.fare, 0);
  const activeRides = rides.filter((r) =>
    ["accepted", "in_progress"].includes(r.status),
  ).length;

  const ridesByStatus = [
    "pending",
    "accepted",
    "in_progress",
    "completed",
    "cancelled",
  ].map((s) => ({
    status: s,
    count: rides.filter((r) => r.status === s).length,
    maxCount: rides.length,
  }));

  const navItems: { id: AdminPage; label: string; icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "rides", label: "Rides", icon: <Car className="w-4 h-4" /> },
    {
      id: "audit",
      label: "Audit Log",
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: "rates",
      label: "Rate Management",
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      id: "sos",
      label: "SOS Alerts",
      icon: <Activity className="w-4 h-4 text-red-500" />,
    },
  ];

  const getUserName = (id: string) =>
    users.find((u) => u.id === id)?.name ?? id;

  const saveRates = () => {
    toast.success("Rates updated successfully!");
  };

  const handleAddUser = () => {
    if (
      !newUserName.trim() ||
      !newUserPhone.trim() ||
      !newUserPassword.trim() ||
      !newUserCity
    ) {
      toast.error("All fields are required.");
      return;
    }
    const newUser: User = {
      id: `u_${Date.now()}`,
      name: newUserName.trim(),
      phone: newUserPhone.trim(),
      role: newUserRole,
      city: newUserCity,
      status: "active",
      vCoins: 100,
      rating: 4.5,
      isOnline: false,
    } as User;
    onAddUser(newUser);
    toast.success(`User ${newUser.name} added successfully`);
    setShowAddUser(false);
    setNewUserName("");
    setNewUserPhone("");
    setNewUserRole("rider");
    setNewUserCity("");
    setNewUserPassword("");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar text-sidebar-foreground flex-shrink-0 flex flex-col shadow-xl">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                V
              </span>
            </div>
            <span
              className="font-bold text-base"
              style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
            >
              V Cabs Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              data-ocid={
                item.id === "rates"
                  ? "admin.rates.tab"
                  : `admin.${item.id === "audit" ? "audit_log" : item.id}.tab`
              }
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                page === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {currentUser.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {page === "dashboard" && (
          <div className="p-6 space-y-6">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
              >
                Dashboard
              </h1>
              <p className="text-muted-foreground text-sm">
                V Cabs platform overview
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Users",
                  value: users.length,
                  icon: <Users className="w-5 h-5" />,
                  color: "text-blue-600",
                },
                {
                  label: "Total Rides",
                  value: rides.length,
                  icon: <Car className="w-5 h-5" />,
                  color: "text-primary",
                },
                {
                  label: "Active Rides",
                  value: activeRides,
                  icon: <Activity className="w-5 h-5" />,
                  color: "text-green-600",
                },
                {
                  label: "Revenue (VC)",
                  value: totalRevenue,
                  icon: <TrendingUp className="w-5 h-5" />,
                  color: "text-purple-600",
                },
              ].map((stat) => (
                <Card key={stat.label} className="border-border shadow-sm">
                  <CardContent className="p-5">
                    <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
                    <p
                      className="text-2xl font-extrabold"
                      style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Rides by Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ridesByStatus.map((item) => (
                  <div key={item.status} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground capitalize w-24 flex-shrink-0">
                      {item.status.replace("_", " ")}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{
                          width: `${item.maxCount ? (item.count / item.maxCount) * 100 : 0}%`,
                          minWidth: item.count > 0 ? "2rem" : 0,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold w-6 text-right">
                      {item.count}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {page === "users" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
                >
                  Users
                </h1>
                <p className="text-muted-foreground text-sm">
                  {users.length} registered users
                </p>
              </div>
              <Button
                data-ocid="admin.add_user.button"
                onClick={() => setShowAddUser(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                size="sm"
              >
                + Add User
              </Button>
            </div>
            {/* City Filter */}
            <div className="flex gap-3 items-center">
              <Label className="text-sm shrink-0">Filter by City:</Label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="border border-border rounded-md px-3 py-1.5 text-sm bg-background"
              >
                <option value="">All Cities</option>
                {Array.from(
                  new Set(users.filter((u) => u.city).map((u) => u.city!)),
                )
                  .sort()
                  .map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
              </select>
            </div>
            <Card className="border-border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>V Coins</TableHead>
                    <TableHead>Docs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter(
                      (u) =>
                        u.role !== "admin" &&
                        (!cityFilter || u.city === cityFilter),
                    )
                    .map((user, idx) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="capitalize text-xs"
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.city ?? "—"}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Coins className="w-3.5 h-3.5 text-primary" />
                            {user.vCoins}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.documents ? (
                            <span className="text-green-600 text-xs font-medium">
                              {
                                Object.values(user.documents).filter(Boolean)
                                  .length
                              }{" "}
                              uploaded
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              None
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              data-ocid={`admin.user.toggle.${idx + 1}`}
                              checked={user.status === "active"}
                              onCheckedChange={() => {
                                onToggleUserStatus(user.id);
                                toast.success(
                                  `User ${user.name} ${user.status === "active" ? "suspended" : "activated"}`,
                                );
                              }}
                            />
                            <Button
                              data-ocid={`admin.user.delete_button.${idx + 1}`}
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              onClick={() => {
                                onDeleteUser(user.id);
                                toast.success(`User ${user.name} deleted`);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {page === "rides" && (
          <div className="p-6 space-y-4">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
              >
                Rides
              </h1>
              <p className="text-muted-foreground text-sm">
                {rides.length} total rides
              </p>
            </div>
            <Card className="border-border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Rider</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Fare</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rides.map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell className="font-mono text-xs">
                        {ride.id.toUpperCase()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getUserName(ride.riderId)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ride.driverId ? (
                          getUserName(ride.driverId)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm max-w-40">
                        <p className="truncate text-xs">{ride.pickup}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          → {ride.destination}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm font-medium text-primary">
                          <Coins className="w-3 h-3" />
                          {ride.fare}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[ride.status]}`}
                        >
                          {ride.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(ride.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {page === "audit" && (
          <div className="p-6 space-y-4">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
              >
                Audit Log
              </h1>
              <p className="text-muted-foreground text-sm">
                Admin action history
              </p>
            </div>
            <Card className="border-border shadow-sm">
              <CardContent className="p-0">
                {auditLogs.map((log, idx) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-4 p-4 ${idx < auditLogs.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{log.action}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          by {log.actor}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {page === "sos" && (
          <div className="p-6 space-y-4">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
              >
                SOS Alerts
              </h1>
              <p className="text-muted-foreground text-sm">
                Emergency alerts from riders and drivers ({sosEvents.length}{" "}
                total)
              </p>
            </div>
            {sosEvents.length === 0 ? (
              <Card className="border-border shadow-sm">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p>No SOS alerts received</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sosEvents.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(ev.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {ev.userName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="capitalize text-xs"
                          >
                            {ev.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{ev.city}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-48 truncate">
                          {ev.location}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {page === "rates" && (
          <div className="p-6 space-y-6">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
              >
                Rate Management
              </h1>
              <p className="text-muted-foreground text-sm">
                Configure fares for rides, parcels, and surge pricing
              </p>
            </div>

            {/* Section 1: Ride Rates */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="w-4 h-4 text-primary" />
                  Ride Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Multiplier</TableHead>
                      <TableHead>Base Rate per km (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rideRates.map((v, idx) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <span className="text-xl">{v.icon}</span>
                            {v.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            data-ocid={`admin.ride_rate.input.${idx + 1}`}
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={v.multiplier}
                            onChange={(e) => {
                              const val =
                                Number.parseFloat(e.target.value) || 0;
                              setRideRates((prev) =>
                                prev.map((r) =>
                                  r.id === v.id ? { ...r, multiplier: val } : r,
                                ),
                              );
                            }}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                              ₹
                            </span>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={v.baseRate}
                              onChange={(e) => {
                                const val =
                                  Number.parseFloat(e.target.value) || 0;
                                setRideRates((prev) =>
                                  prev.map((r) =>
                                    r.id === v.id ? { ...r, baseRate: val } : r,
                                  ),
                                );
                              }}
                              className="pl-7"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Section 2: Parcel Rates */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-base">📦</span>
                  Parcel Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Multiplier</TableHead>
                      <TableHead>Base Rate per km (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parcelRates.map((v, idx) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <span className="text-xl">{v.icon}</span>
                            {v.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            data-ocid={`admin.parcel_rate.input.${idx + 1}`}
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={v.multiplier}
                            onChange={(e) => {
                              const val =
                                Number.parseFloat(e.target.value) || 0;
                              setParcelRates((prev) =>
                                prev.map((r) =>
                                  r.id === v.id ? { ...r, multiplier: val } : r,
                                ),
                              );
                            }}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                              ₹
                            </span>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={v.baseRate}
                              onChange={(e) => {
                                const val =
                                  Number.parseFloat(e.target.value) || 0;
                                setParcelRates((prev) =>
                                  prev.map((r) =>
                                    r.id === v.id ? { ...r, baseRate: val } : r,
                                  ),
                                );
                              }}
                              className="pl-7"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Weight Surcharges
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Weight Category</TableHead>
                        <TableHead>Multiplier</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weightSurcharges.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium">
                            {w.label}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={w.multiplier}
                              onChange={(e) => {
                                const val =
                                  Number.parseFloat(e.target.value) || 0;
                                setWeightSurcharges((prev) =>
                                  prev.map((s) =>
                                    s.id === w.id
                                      ? { ...s, multiplier: val }
                                      : s,
                                  ),
                                );
                              }}
                              className="w-24"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Surge Pricing */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Surge Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Peak Hours Surge</p>
                    <p className="text-xs text-muted-foreground">
                      Enable surge pricing during peak hours
                    </p>
                  </div>
                  <Switch
                    data-ocid="admin.surge.toggle"
                    checked={peakEnabled}
                    onCheckedChange={setPeakEnabled}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Peak Hour Multiplier</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.1"
                      value={peakMultiplier}
                      onChange={(e) => setPeakMultiplier(e.target.value)}
                      disabled={!peakEnabled}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Night Hour Multiplier</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.1"
                      value={nightMultiplier}
                      onChange={(e) => setNightMultiplier(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: V Coin Rate */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary" />V Coins Exchange
                  Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium whitespace-nowrap">
                    1 V Coin =
                  </span>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      ₹
                    </span>
                    <Input
                      data-ocid="admin.vcoin_rate.input"
                      type="number"
                      min="1"
                      step="0.5"
                      value={vCoinRate}
                      onChange={(e) => setVCoinRate(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Current: 1 VC = ₹{vCoinRate}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pb-4">
              <Button
                data-ocid="admin.rates.save.button"
                onClick={saveRates}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
              >
                Save Rates
              </Button>
            </div>
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border mx-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </footer>
      </main>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent
          data-ocid="admin.add_user.dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Full Name</Label>
              <Input
                data-ocid="admin.add_user.name.input"
                placeholder="Enter full name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Phone Number</Label>
              <Input
                data-ocid="admin.add_user.phone.input"
                placeholder="10-digit mobile number"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Role</Label>
              <Select
                value={newUserRole}
                onValueChange={(v) => setNewUserRole(v as "rider" | "driver")}
              >
                <SelectTrigger data-ocid="admin.add_user.role.select">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rider">Rider</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">City</Label>
              <Select value={newUserCity} onValueChange={setNewUserCity}>
                <SelectTrigger data-ocid="admin.add_user.city.select">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Password</Label>
              <Input
                data-ocid="admin.add_user.password.input"
                type="password"
                placeholder="Create a password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              data-ocid="admin.add_user.cancel_button"
              variant="outline"
              onClick={() => setShowAddUser(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin.add_user.submit_button"
              onClick={handleAddUser}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
