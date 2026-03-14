import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Car,
  Coins,
  FileText,
  LogOut,
  Menu,
  MessageCircle,
  Package,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { seedUsers } from "../data/seedData";
import type { Ride, SOSEvent, SavedLocation, User } from "../types/vcabs";
import { formatFare } from "../utils/fareHelper";
import DocumentUpload from "./DocumentUpload";
import HelplineChat from "./HelplineChat";
import LiveMapCanvas from "./LiveMapCanvas";
import LocationSearchInput from "./LocationSearchInput";
import SOSScreen from "./SOSScreen";
import SidebarMenu from "./SidebarMenu";

interface RiderAppProps {
  currentUser: User;
  rides: Ride[];
  onAddRide: (ride: Ride) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onAddSOS: (event: SOSEvent) => void;
  savedLocations: SavedLocation[];
  onLogout: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const RIDE_TYPES = [
  {
    id: "bike",
    name: "Bike",
    icon: "🏙️",
    capacity: "1 passenger",
    multiplier: 1.0,
    tag: "",
  },
  {
    id: "auto",
    name: "Auto",
    icon: "🛣️",
    capacity: "3 passengers",
    multiplier: 1.2,
    tag: "",
  },
  {
    id: "cab",
    name: "Cab",
    icon: "🚕",
    capacity: "4 passengers",
    multiplier: 1.5,
    tag: "",
  },
  {
    id: "cab_ac",
    name: "Cab A/c",
    icon: "❄️",
    capacity: "4 passengers A/c",
    multiplier: 1.8,
    tag: "AC",
  },
  {
    id: "sedan",
    name: "Sedan",
    icon: "🚗",
    capacity: "4 passengers",
    multiplier: 2.0,
    tag: "Premium",
  },
  {
    id: "xl",
    name: "Premium XL",
    icon: "🚐",
    capacity: "7 passengers",
    multiplier: 2.5,
    tag: "7 Seater",
  },
];

const PARCEL_TYPES = [
  {
    id: "bike",
    name: "Bike",
    icon: "🏙️",
    desc: "Small parcels",
    multiplier: 1.0,
    tag: "Cheapest",
  },
  {
    id: "auto",
    name: "Auto",
    icon: "🛣️",
    desc: "Medium parcels",
    multiplier: 1.2,
    tag: "",
  },
  {
    id: "cab",
    name: "Cab",
    icon: "🚕",
    desc: "Standard",
    multiplier: 1.5,
    tag: "",
  },
  {
    id: "cab_ac",
    name: "Cab A/c",
    icon: "❄️",
    desc: "Sensitive items",
    multiplier: 1.8,
    tag: "AC",
  },
  {
    id: "sedan",
    name: "Sedan",
    icon: "🚗",
    desc: "Premium",
    multiplier: 2.0,
    tag: "Premium",
  },
  {
    id: "xl",
    name: "Premium XL",
    icon: "🚐",
    desc: "Large/heavy",
    multiplier: 2.5,
    tag: "7 Seater",
  },
];

const WEIGHT_OPTIONS = [
  { id: "light", label: "Light (<1 kg)", multiplier: 1.0 },
  { id: "medium", label: "Medium (1–5 kg)", multiplier: 1.3 },
  { id: "heavy", label: "Heavy (5–20 kg)", multiplier: 1.7 },
  { id: "oversized", label: "Oversized (20 kg+)", multiplier: 2.2 },
];

export default function RiderApp({
  currentUser,
  rides,
  onAddRide,
  onUpdateUser,
  onAddSOS,
  savedLocations,
  onLogout,
}: RiderAppProps) {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRideType, setSelectedRideType] = useState("cab");
  const [activeScreen, setActiveScreen] = useState<"home" | "sos" | "helpline">(
    "home",
  );

  // Parcel state
  const [parcelSender, setParcelSender] = useState("");
  const [parcelReceiver, setParcelReceiver] = useState("");
  const [parcelWeight, setParcelWeight] = useState("light");
  const [selectedParcelType, setSelectedParcelType] = useState("bike");
  const [parcelFare, setParcelFare] = useState<number | null>(null);
  const [isEstimatingParcel, setIsEstimatingParcel] = useState(false);

  // Document state
  const [docIdProof, setDocIdProof] = useState(
    currentUser.documents?.idProof ?? "",
  );
  const [docPhoto, setDocPhoto] = useState(currentUser.documents?.photo ?? "");

  const myRides = rides.filter((r) => r.riderId === currentUser.id);
  const activeRide = myRides.find((r) =>
    ["pending", "accepted", "in_progress"].includes(r.status),
  ) as (Ride & { rideType?: string }) | undefined;

  const mapStatus =
    (activeRide?.status as
      | "idle"
      | "pending"
      | "accepted"
      | "in_progress"
      | "completed") ?? "idle";
  const mapPickup = activeRide?.pickup ?? pickup;
  const mapDest = activeRide?.destination ?? destination;
  const mapRideType = (activeRide as Ride & { rideType?: string })?.rideType;

  const selectedType =
    RIDE_TYPES.find((r) => r.id === selectedRideType) ?? RIDE_TYPES[2];
  const selectedParcel =
    PARCEL_TYPES.find((p) => p.id === selectedParcelType) ?? PARCEL_TYPES[0];
  const selectedWeightOption =
    WEIGHT_OPTIONS.find((w) => w.id === parcelWeight) ?? WEIGHT_OPTIONS[0];

  const estimateFare = () => {
    if (!pickup || !destination) {
      toast.error("Please enter pickup and destination");
      return;
    }
    setIsEstimating(true);
    setTimeout(() => {
      setEstimatedFare(Math.floor(Math.random() * 40) + 15);
      setIsEstimating(false);
    }, 800);
  };

  const getFareForType = (baseFare: number, typeId: string) => {
    const type = RIDE_TYPES.find((r) => r.id === typeId);
    return Math.round(baseFare * (type?.multiplier ?? 1));
  };

  const getParcelFareForType = (
    baseFare: number,
    typeId: string,
    weightId: string,
  ) => {
    const type = PARCEL_TYPES.find((p) => p.id === typeId);
    const weight = WEIGHT_OPTIONS.find((w) => w.id === weightId);
    return Math.round(
      baseFare * (type?.multiplier ?? 1) * (weight?.multiplier ?? 1),
    );
  };

  const bookRide = () => {
    if (!pickup || !destination) {
      toast.error("Please enter pickup and destination");
      return;
    }
    const baseFare = estimatedFare ?? Math.floor(Math.random() * 40) + 15;
    const fare = getFareForType(baseFare, selectedRideType);
    const newRide: Ride & { rideType?: string } = {
      id: `r${Date.now()}`,
      riderId: currentUser.id,
      pickup,
      destination,
      fare,
      status: "pending",
      otp: String(Math.floor(1000 + Math.random() * 9000)),
      createdAt: new Date().toISOString(),
      rideType: selectedType.name,
    };
    onAddRide(newRide as Ride);
    setPickup("");
    setDestination("");
    setEstimatedFare(null);
    toast.success(
      `${selectedType.name} ride booked! Looking for a driver nearby...`,
    );
  };

  const estimateParcelFare = () => {
    if (!parcelSender || !parcelReceiver) {
      toast.error("Please enter sender and receiver locations");
      return;
    }
    setIsEstimatingParcel(true);
    setTimeout(() => {
      setParcelFare(Math.floor(Math.random() * 30) + 20);
      setIsEstimatingParcel(false);
    }, 800);
  };

  const sendParcel = () => {
    if (!parcelSender || !parcelReceiver) {
      toast.error("Please enter sender and receiver locations");
      return;
    }
    const baseFare = parcelFare ?? Math.floor(Math.random() * 30) + 20;
    const fare = getParcelFareForType(
      baseFare,
      selectedParcelType,
      parcelWeight,
    );
    const newRide: Ride & { rideType?: string } = {
      id: `p${Date.now()}`,
      riderId: currentUser.id,
      pickup: parcelSender,
      destination: parcelReceiver,
      fare,
      status: "pending",
      otp: String(Math.floor(1000 + Math.random() * 9000)),
      createdAt: new Date().toISOString(),
      rideType: `📦 Parcel - ${selectedParcel.name}`,
    };
    onAddRide(newRide as Ride);
    setParcelSender("");
    setParcelReceiver("");
    setParcelFare(null);
    toast.success(
      `Parcel via ${selectedParcel.name} booked! Looking for a driver nearby...`,
    );
  };

  const saveDocuments = () => {
    onUpdateUser(currentUser.id, {
      documents: {
        ...currentUser.documents,
        idProof: docIdProof || undefined,
        photo: docPhoto || undefined,
      },
    });
    toast.success("Documents saved successfully!");
  };

  const getDriverName = (driverId?: string) => {
    if (!driverId) return null;
    return seedUsers.find((u) => u.id === driverId)?.name ?? "Driver";
  };

  // Render SOS or Helpline full screens
  if (activeScreen === "sos") {
    return (
      <SOSScreen
        user={currentUser}
        onBack={() => setActiveScreen("home")}
        onSOS={(e) => {
          onAddSOS(e);
        }}
      />
    );
  }
  if (activeScreen === "helpline") {
    return (
      <HelplineChat user={currentUser} onBack={() => setActiveScreen("home")} />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            data-ocid="rider.menu.button"
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded-md hover:bg-white/20 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-extrabold text-lg leading-none">V Cabs</h1>
            <p className="text-primary-foreground/70 text-xs">
              {currentUser.city ? `📍 ${currentUser.city}` : "Rider"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-ocid="rider.sos.button"
            type="button"
            onClick={() => setActiveScreen("sos")}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> SOS
          </button>
          <button
            data-ocid="rider.helpline.button"
            type="button"
            onClick={() => setActiveScreen("helpline")}
            className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
            title="Help & Support"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            data-ocid="rider.logout.button"
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        <Tabs defaultValue="ride">
          <TabsList className="grid grid-cols-4 bg-muted">
            <TabsTrigger
              data-ocid="rider.ride.tab"
              value="ride"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Car className="w-3.5 h-3.5 mr-1" />
              Ride
            </TabsTrigger>
            <TabsTrigger
              data-ocid="rider.parcel.tab"
              value="parcel"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Package className="w-3.5 h-3.5 mr-1" />
              Parcel
            </TabsTrigger>
            <TabsTrigger
              data-ocid="rider.rides.tab"
              value="rides"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              My Rides
            </TabsTrigger>
            <TabsTrigger
              data-ocid="rider.docs.tab"
              value="docs"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              Docs
            </TabsTrigger>
          </TabsList>

          {/* Book Ride */}
          <TabsContent value="ride" className="space-y-4">
            <LiveMapCanvas
              status={mapStatus}
              pickup={mapPickup}
              destination={mapDest}
              rideType={mapRideType}
            />

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  Book a Ride
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <LocationSearchInput
                    label="Pickup Location"
                    value={pickup}
                    onChange={(v) => {
                      setPickup(v);
                      setEstimatedFare(null);
                    }}
                    isPickup
                    city={currentUser.city}
                    savedLocations={savedLocations}
                    placeholder="Auto-detect or search pickup..."
                  />
                  <LocationSearchInput
                    label="Drop Location"
                    value={destination}
                    onChange={(v) => {
                      setDestination(v);
                      setEstimatedFare(null);
                    }}
                    city={currentUser.city}
                    savedLocations={savedLocations}
                    placeholder="Search destination..."
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Choose Ride Type
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {RIDE_TYPES.map((type, idx) => {
                      const isSelected = selectedRideType === type.id;
                      const displayFare = estimatedFare
                        ? getFareForType(estimatedFare, type.id)
                        : null;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          data-ocid={`rider.ride_type.item.${idx + 1}`}
                          onClick={() => setSelectedRideType(type.id)}
                          className={[
                            "relative flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 cursor-pointer transition-all duration-150 text-center",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-md scale-[1.03]"
                              : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
                          ].join(" ")}
                          aria-pressed={isSelected}
                        >
                          {type.tag && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                              {type.tag}
                            </span>
                          )}
                          <span className="text-2xl leading-none">
                            {type.icon}
                          </span>
                          <span
                            className={`text-[11px] font-semibold leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}
                          >
                            {type.name}
                          </span>
                          <span className="text-[9px] text-muted-foreground leading-tight">
                            {type.capacity}
                          </span>
                          {displayFare !== null && (
                            <span
                              className={`text-[10px] font-bold mt-0.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                            >
                              ₹{displayFare}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {estimatedFare !== null && (
                  <div className="flex items-center justify-between rounded-lg bg-accent/60 px-4 py-3">
                    <span className="text-sm font-medium text-accent-foreground">
                      Estimated Fare ({selectedType.name})
                    </span>
                    <span className="font-bold text-primary flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {formatFare(
                        getFareForType(estimatedFare, selectedRideType),
                      )}
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
                    Book {selectedType.icon} {selectedType.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Send Parcel */}
          <TabsContent value="parcel" className="space-y-4">
            <LiveMapCanvas
              status={mapStatus}
              pickup={mapPickup}
              destination={mapDest}
              rideType={mapRideType}
            />

            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Send a Parcel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <LocationSearchInput
                    label="Pickup / Sender Location"
                    value={parcelSender}
                    onChange={(v) => {
                      setParcelSender(v);
                      setParcelFare(null);
                    }}
                    isPickup
                    city={currentUser.city}
                    savedLocations={savedLocations}
                  />
                  <LocationSearchInput
                    label="Drop / Receiver Location"
                    value={parcelReceiver}
                    onChange={(v) => {
                      setParcelReceiver(v);
                      setParcelFare(null);
                    }}
                    city={currentUser.city}
                    savedLocations={savedLocations}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Parcel Weight</Label>
                  <Select
                    value={parcelWeight}
                    onValueChange={(v) => {
                      setParcelWeight(v);
                      setParcelFare(null);
                    }}
                  >
                    <SelectTrigger
                      data-ocid="rider.parcel_weight.select"
                      className="w-full"
                    >
                      <SelectValue placeholder="Select weight" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEIGHT_OPTIONS.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Choose Vehicle Type
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {PARCEL_TYPES.map((type, idx) => {
                      const isSelected = selectedParcelType === type.id;
                      const displayFare = parcelFare
                        ? getParcelFareForType(
                            parcelFare,
                            type.id,
                            parcelWeight,
                          )
                        : null;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          data-ocid={`rider.parcel_type.item.${idx + 1}`}
                          onClick={() => {
                            setSelectedParcelType(type.id);
                            setParcelFare(null);
                          }}
                          className={[
                            "relative flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 cursor-pointer transition-all duration-150 text-center",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-md scale-[1.03]"
                              : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
                          ].join(" ")}
                          aria-pressed={isSelected}
                        >
                          {type.tag && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                              {type.tag}
                            </span>
                          )}
                          <span className="text-2xl leading-none">
                            {type.icon}
                          </span>
                          <span
                            className={`text-[11px] font-semibold leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}
                          >
                            {type.name}
                          </span>
                          <span className="text-[9px] text-muted-foreground leading-tight">
                            {type.desc}
                          </span>
                          {displayFare !== null && (
                            <span
                              className={`text-[10px] font-bold mt-0.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                            >
                              ₹{displayFare}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {parcelFare !== null && (
                  <div className="flex items-center justify-between rounded-lg bg-accent/60 px-4 py-3">
                    <span className="text-sm font-medium text-accent-foreground">
                      Estimated ({selectedParcel.name} ·{" "}
                      {selectedWeightOption.label})
                    </span>
                    <span className="font-bold text-primary flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {formatFare(
                        getParcelFareForType(
                          parcelFare,
                          selectedParcelType,
                          parcelWeight,
                        ),
                      )}
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    data-ocid="rider.estimate_parcel_fare.button"
                    variant="outline"
                    onClick={estimateParcelFare}
                    disabled={isEstimatingParcel}
                    className="flex-1"
                  >
                    {isEstimatingParcel ? "Estimating..." : "Estimate Fare"}
                  </Button>
                  <Button
                    data-ocid="rider.send_parcel.button"
                    onClick={sendParcel}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    📦 Send via {selectedParcel.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Rides */}
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
              myRides.map((ride, idx) => {
                const rideWithType = ride as Ride & { rideType?: string };
                const isParcel = rideWithType.rideType?.startsWith("📦 Parcel");
                return (
                  <Card
                    key={ride.id}
                    data-ocid={`rider.ride.item.${idx + 1}`}
                    className="border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground font-mono">
                            #{ride.id.toUpperCase()}
                          </span>
                          {rideWithType.rideType && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                isParcel
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-primary/10 text-primary border-primary/20"
                              }`}
                            >
                              {rideWithType.rideType}
                            </span>
                          )}
                        </div>
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
                          <Coins className="w-3.5 h-3.5" />
                          {formatFare(ride.fare)}
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
                );
              })
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="docs" className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Rider Documents
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Upload your ID proof and photo for verification
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <DocumentUpload
                  label="ID Proof (Aadhaar / Passport / Driving License)"
                  value={docIdProof}
                  onChange={setDocIdProof}
                  required
                />
                <DocumentUpload
                  label="Profile Photo"
                  value={docPhoto}
                  onChange={setDocPhoto}
                  required
                />
                <Button
                  data-ocid="rider.save_docs.button"
                  onClick={saveDocuments}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Documents
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Your documents are securely stored and used for identity
                  verification only.
                </p>
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

      <SidebarMenu
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={currentUser}
        rides={rides}
        onNavigate={(screen) => setActiveScreen(screen)}
        onUpdateUser={(updates) => onUpdateUser(currentUser.id, updates)}
      />
    </div>
  );
}
