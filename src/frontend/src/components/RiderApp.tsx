import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Coins, LogOut, MapPin, Navigation } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { seedUsers } from "../data/seedData";
import type { Ride, User } from "../types/vcabs";

interface RiderAppProps {
  currentUser: User;
  rides: Ride[];
  onAddRide: (ride: Ride) => void;
  onLogout: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function RiderApp({
  currentUser,
  rides,
  onAddRide,
  onLogout,
}: RiderAppProps) {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const myRides = rides.filter((r) => r.riderId === currentUser.id);

  const estimateFare = () => {
    if (!pickup || !destination) {
      toast.error("Please enter pickup and destination");
      return;
    }
    setIsEstimating(true);
    setTimeout(() => {
      const fare = Math.floor(Math.random() * 40) + 15;
      setEstimatedFare(fare);
      setIsEstimating(false);
    }, 800);
  };

  const bookRide = () => {
    if (!pickup || !destination) {
      toast.error("Please enter pickup and destination");
      return;
    }
    const fare = estimatedFare ?? Math.floor(Math.random() * 40) + 15;
    const newRide: Ride = {
      id: `r${Date.now()}`,
      riderId: currentUser.id,
      pickup,
      destination,
      fare,
      status: "pending",
      otp: String(Math.floor(1000 + Math.random() * 9000)),
      createdAt: new Date().toISOString(),
    };
    onAddRide(newRide);
    setPickup("");
    setDestination("");
    setEstimatedFare(null);
    toast.success("Ride booked! Looking for a driver...");
  };

  const getDriverName = (driverId?: string) => {
    if (!driverId) return null;
    return seedUsers.find((u) => u.id === driverId)?.name ?? "Driver";
  };

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
          <Badge className="ml-2 bg-primary/20 text-primary border-primary/30 text-xs gap-1">
            <Coins className="w-3 h-3" />
            {currentUser.vCoins} VC
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
        <Tabs defaultValue="book">
          <TabsList className="w-full mb-6 bg-muted">
            <TabsTrigger
              data-ocid="rider.book_ride.tab"
              value="book"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Car className="w-4 h-4 mr-2" /> Book a Ride
            </TabsTrigger>
            <TabsTrigger
              data-ocid="rider.my_rides.tab"
              value="rides"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              My Rides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="book" className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Book Your Ride</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input
                      data-ocid="rider.pickup.input"
                      placeholder="Enter pickup location"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input
                      data-ocid="rider.destination.input"
                      placeholder="Enter destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {estimatedFare !== null && (
                  <div className="flex items-center justify-between rounded-lg bg-accent/60 px-4 py-3">
                    <span className="text-sm font-medium text-accent-foreground">
                      Estimated Fare
                    </span>
                    <span className="font-bold text-primary flex items-center gap-1">
                      <Coins className="w-4 h-4" /> {estimatedFare} V Coins
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    data-ocid="rider.estimate_fare.button"
                    variant="outline"
                    onClick={estimateFare}
                    disabled={isEstimating}
                    className="flex-1"
                  >
                    {isEstimating ? "Estimating..." : "Estimate Fare"}
                  </Button>
                  <Button
                    data-ocid="rider.book_ride.button"
                    onClick={bookRide}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Book Ride
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Map placeholder */}
            <div
              className="rounded-xl overflow-hidden border border-border shadow-sm"
              style={{ height: 200 }}
            >
              <div className="w-full h-full bg-gradient-to-br from-sidebar/5 to-primary/5 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-primary/40" />
                  <p className="text-sm">Live map will appear here</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rides" className="space-y-3">
            {myRides.length === 0 ? (
              <div
                data-ocid="rider.rides.empty_state"
                className="text-center py-12 text-muted-foreground"
              >
                <Car className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p>No rides yet. Book your first ride!</p>
              </div>
            ) : (
              myRides.map((ride, idx) => (
                <Card
                  key={ride.id}
                  data-ocid={`rider.ride.item.${idx + 1}`}
                  className="border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        #{ride.id.toUpperCase()}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border font-medium capitalize ${STATUS_COLORS[ride.status]}`}
                      >
                        {ride.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <span className="text-sm">{ride.pickup}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-foreground/30 mt-1.5 flex-shrink-0" />
                        <span className="text-sm">{ride.destination}</span>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-primary flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" /> {ride.fare} V Coins
                      </span>
                      {ride.driverId && (
                        <span className="text-muted-foreground">
                          Driver: {getDriverName(ride.driverId)}
                        </span>
                      )}
                    </div>
                    {ride.status === "in_progress" && (
                      <div className="mt-3 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                        <p className="text-xs text-primary font-medium">
                          Trip OTP:{" "}
                          <span className="font-mono font-bold text-sm">
                            {ride.otp}
                          </span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
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
