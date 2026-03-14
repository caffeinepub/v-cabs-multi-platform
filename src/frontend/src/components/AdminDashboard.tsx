import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  LayoutDashboard,
  LogOut,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AuditLog, Ride, User } from "../types/vcabs";

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  rides: Ride[];
  auditLogs: AuditLog[];
  onToggleUserStatus: (userId: string) => void;
  onLogout: () => void;
}

type AdminPage = "dashboard" | "users" | "rides" | "audit";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function AdminDashboard({
  currentUser,
  users,
  rides,
  auditLogs,
  onToggleUserStatus,
  onLogout,
}: AdminDashboardProps) {
  const [page, setPage] = useState<AdminPage>("dashboard");

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
  ];

  const getUserName = (id: string) =>
    users.find((u) => u.id === id)?.name ?? id;

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
              data-ocid={`admin.${item.id === "audit" ? "audit_log" : item.id}.tab`}
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

            {/* Stats */}
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

            {/* Bar chart */}
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
            <Card className="border-border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>V Coins</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter((u) => u.role !== "admin")
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
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Coins className="w-3.5 h-3.5 text-primary" />
                            {user.vCoins}
                          </span>
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
                    className={`flex items-start gap-4 p-4 ${
                      idx < auditLogs.length - 1 ? "border-b border-border" : ""
                    }`}
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
    </div>
  );
}
