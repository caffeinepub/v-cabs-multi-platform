import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Car,
  CheckCircle,
  Coins,
  LogOut,
  MapPin,
  Navigation,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { seedUsers } from "../data/seedData";
import type { Ride, User } from "../types/vcabs";

interface DriverAppProps {
  currentUser: User;
  rides: Ride[];
  onUpdateRide: (rideId: string, updates: Partial<Ride>) => void;
  onLogout: () => void;
}

export default function DriverApp({
  currentUser,
  rides,
  onUpdateRide,
  onLogout,
}: DriverAppProps) {
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  const availableRides = rides.filter((r) => r.status === "pending");
  const myTrips = rides.filter(
    (r) =>
      r.driverId === currentUser.id &&
      ["accepted", "in_progress"].includes(r.status),
  );
  const completedTrips = rides.filter(
    (r) => r.driverId === currentUser.id && r.status === "completed",
  );
  const earnings = completedTrips.reduce((sum, r) => sum + r.fare, 0);

  const acceptRide = (ride: Ride) => {
    onUpdateRide(ride.id, { status: "accepted", driverId: currentUser.id });
    toast.success(`Ride accepted! Head to ${ride.pickup}`);
  };

  const verifyOtp = (ride: Ride) => {
    const entered = otpInputs[ride.id] ?? "";
    if (entered === ride.otp) {
      onUpdateRide(ride.id, { status: "in_progress" });
      toast.success("OTP verified! Trip started.");
    } else {
      toast.error("Incorrect OTP. Please try again.");
    }
  };

  const completeTrip = (ride: Ride) => {
    onUpdateRide(ride.id, { status: "completed" });
    toast.success(`Trip completed! Earned ${ride.fare} V Coins.`);
  };

  const getRiderName = (riderId: string) =>
    seedUsers.find((u) => u.id === riderId)?.name ?? "Rider";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav */}
      <header className="bg-sidebar text-sidebar-foreground px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">V</span>
          </div>
          <span
            className="font-bold text-lg"
            style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
          >
            V Cabs
          </span>
          <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs gap-1">
            <Coins className="w-3 h-3" />
            {currentUser.vCoins + earnings} VC
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sidebar-foreground/70 text-sm hidden sm:block">
            {currentUser.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Tabs defaultValue="available">
          <TabsList className="w-full mb-6 bg-muted">
            <TabsTrigger
              data-ocid="driver.available_rides.tab"
              value="available"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Available ({availableRides.length})
            </TabsTrigger>
            <TabsTrigger
              data-ocid="driver.my_trips.tab"
              value="trips"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              My Trips ({myTrips.length})
            </TabsTrigger>
            <TabsTrigger
              data-ocid="driver.earnings.tab"
              value="earnings"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Earnings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-3">
            {availableRides.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Car className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p>No available rides right now.</p>
              </div>
            ) : (
              availableRides.map((ride, idx) => (
                <Card
                  key={ride.id}
                  className="border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono mb-1">
                          #{ride.id.toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Rider: {getRiderName(ride.riderId)}
                        </p>
                      </div>
                      <span className="font-bold text-primary flex items-center gap-1">
                        <Coins className="w-4 h-4" /> {ride.fare}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{ride.pickup}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{ride.destination}</span>
                      </div>
                    </div>
                    <Button
                      data-ocid={`driver.accept_ride.button.${idx + 1}`}
                      onClick={() => acceptRide(ride)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Accept Ride
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="trips" className="space-y-3">
            {myTrips.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Car className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p>No active trips.</p>
              </div>
            ) : (
              myTrips.map((ride) => (
                <Card key={ride.id} className="border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono mb-1">
                          #{ride.id.toUpperCase()}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                            ride.status === "accepted"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {ride.status.replace("_", " ")}
                        </span>
                      </div>
                      <span className="font-bold text-primary flex items-center gap-1">
                        <Coins className="w-4 h-4" /> {ride.fare}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{ride.pickup}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="w-4 h-4 text-foreground/40 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{ride.destination}</span>
                      </div>
                    </div>

                    {ride.status === "accepted" && (
                      <div className="space-y-3">
                        <Separator />
                        <p className="text-sm text-muted-foreground">
                          Ask rider for OTP to start trip
                        </p>
                        <div className="flex gap-2">
                          <Input
                            data-ocid="driver.otp.input"
                            placeholder="Enter OTP"
                            value={otpInputs[ride.id] ?? ""}
                            onChange={(e) =>
                              setOtpInputs((prev) => ({
                                ...prev,
                                [ride.id]: e.target.value,
                              }))
                            }
                            className="font-mono text-lg tracking-widest text-center"
                            maxLength={4}
                          />
                          <Button
                            data-ocid="driver.verify_otp.button"
                            onClick={() => verifyOtp(ride)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                          >
                            Verify & Start
                          </Button>
                        </div>
                      </div>
                    )}

                    {ride.status === "in_progress" && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 mb-3">
                          <p className="text-xs text-primary font-medium">
                            Trip in progress
                          </p>
                        </div>
                        <Button
                          data-ocid="driver.complete_trip.button"
                          onClick={() => completeTrip(ride)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Complete Trip
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="earnings" className="space-y-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6 text-center">
                <Coins className="w-10 h-10 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">
                  Total V Coin Balance
                </p>
                <p
                  className="text-4xl font-extrabold text-primary"
                  style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
                >
                  {currentUser.vCoins + earnings}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  +{earnings} from completed trips
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Completed Trips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedTrips.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No completed trips yet.
                  </p>
                ) : (
                  completedTrips.map((ride) => (
                    <div
                      key={ride.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {ride.pickup} → {ride.destination}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ride.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-bold text-primary flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" /> {ride.fare}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border">
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
    </div>
  );
}
