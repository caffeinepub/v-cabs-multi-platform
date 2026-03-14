import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Car,
  CheckCircle,
  Coins,
  CreditCard,
  FileText,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { seedUsers } from "../data/seedData";
import type { Ride, SOSEvent, SavedLocation, User } from "../types/vcabs";
import { formatFare } from "../utils/fareHelper";
import DocumentUpload from "./DocumentUpload";
import HelplineChat from "./HelplineChat";
import LiveMapCanvas from "./LiveMapCanvas";
import SOSScreen from "./SOSScreen";
import SidebarMenu from "./SidebarMenu";

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

interface DriverAppProps {
  currentUser: User;
  rides: Ride[];
  onUpdateRide: (rideId: string, updates: Partial<Ride>) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onAddSOS: (event: SOSEvent) => void;
  savedLocations: SavedLocation[];
  onLogout: () => void;
}

export default function DriverApp({
  currentUser,
  rides,
  onUpdateRide,
  onUpdateUser,
  onAddSOS,
  onLogout,
}: DriverAppProps) {
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<"home" | "sos" | "helpline">(
    "home",
  );

  // Subscription state
  const [subscribedPlan, setSubscribedPlan] = useState<
    "daily" | "weekly" | null
  >(null);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<Date | null>(
    null,
  );

  // UPI Payment state
  const [upiList, setUpiList] = useState<string[]>(["9999000003@okbizaxis"]);
  const [newUpi, setNewUpi] = useState("");

  // Document state
  const [docIdProof, setDocIdProof] = useState(
    currentUser.documents?.idProof ?? "",
  );
  const [docPhoto, setDocPhoto] = useState(currentUser.documents?.photo ?? "");
  const [docVehicleRc, setDocVehicleRc] = useState(
    currentUser.documents?.vehicleRc ?? "",
  );
  const [docInsurance, setDocInsurance] = useState(
    currentUser.documents?.insurance ?? "",
  );
  const [docPermit, setDocPermit] = useState(
    currentUser.documents?.permit ?? "",
  );

  const isOnline = currentUser.isOnline ?? true;

  const toggleOnline = () => {
    const next = !isOnline;
    onUpdateUser(currentUser.id, { isOnline: next });
    toast.success(
      next
        ? "You're now Online — ready to receive rides!"
        : "You're now Offline.",
    );
  };

  const subscribeToPlan = (plan: "daily" | "weekly") => {
    const expiry = new Date();
    if (plan === "daily") {
      expiry.setDate(expiry.getDate() + 1);
      setSubscribedPlan("daily");
      setSubscriptionExpiry(expiry);
      toast.success("Daily plan activated! Valid for 24 hours");
    } else {
      expiry.setDate(expiry.getDate() + 7);
      setSubscribedPlan("weekly");
      setSubscriptionExpiry(expiry);
      toast.success("Weekly plan activated! Valid for 7 days");
    }
  };

  const cancelSubscription = () => {
    setSubscribedPlan(null);
    setSubscriptionExpiry(null);
    toast.success("Subscription cancelled.");
  };

  const addUpi = () => {
    const trimmed = newUpi.trim();
    if (!trimmed) {
      toast.error("Please enter a UPI ID.");
      return;
    }
    if (upiList.includes(trimmed)) {
      toast.error("This UPI ID is already added.");
      return;
    }
    setUpiList((prev) => [...prev, trimmed]);
    setNewUpi("");
    toast.success("UPI added!");
  };

  const deleteUpi = (upi: string) => {
    if (upiList.length === 1) {
      toast.error("At least one UPI is required.");
      return;
    }
    setUpiList((prev) => prev.filter((u) => u !== upi));
    toast.success("UPI removed.");
  };

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

  const activeTrip = myTrips[0] as (Ride & { rideType?: string }) | undefined;
  const driverMapStatus =
    (activeTrip?.status as
      | "idle"
      | "pending"
      | "accepted"
      | "in_progress"
      | "completed") ?? "idle";

  const acceptRide = (ride: Ride) => {
    onUpdateRide(ride.id, { status: "accepted", driverId: currentUser.id });
    toast.success(`Ride accepted! Head to ${ride.pickup}`);
  };

  const startTrip = (ride: Ride) => {
    const inputOtp = otpInputs[ride.id] ?? "";
    if (inputOtp !== ride.otp) {
      toast.error(`Wrong OTP! Expected: ${ride.otp}`);
      return;
    }
    onUpdateRide(ride.id, { status: "in_progress" });
    toast.success("Trip started! Safe driving!");
  };

  const completeTrip = (rideId: string) => {
    onUpdateRide(rideId, { status: "completed" });
    toast.success("Trip completed! Great job!");
  };

  const getRiderName = (riderId: string) =>
    seedUsers.find((u) => u.id === riderId)?.name ?? "Rider";

  const saveDocuments = () => {
    onUpdateUser(currentUser.id, {
      documents: {
        idProof: docIdProof || undefined,
        photo: docPhoto || undefined,
        vehicleRc: docVehicleRc || undefined,
        insurance: docInsurance || undefined,
        permit: docPermit || undefined,
      },
    });
    toast.success("Documents saved successfully!");
  };

  const docCount = [
    docIdProof,
    docPhoto,
    docVehicleRc,
    docInsurance,
    docPermit,
  ].filter(Boolean).length;

  // Full screen SOS/Helpline
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
            data-ocid="driver.menu.button"
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded-md hover:bg-white/20 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-extrabold text-lg leading-none">
              V Cabs Driver
            </h1>
            <p className="text-primary-foreground/70 text-xs">
              {currentUser.city ? `📍 ${currentUser.city}` : "Driver App"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-ocid="driver.sos.button"
            type="button"
            onClick={() => setActiveScreen("sos")}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> SOS
          </button>
          <button
            data-ocid="driver.helpline.button"
            type="button"
            onClick={() => setActiveScreen("helpline")}
            className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
            title="Help & Support"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            data-ocid="driver.logout.button"
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Online/Offline Banner */}
      <div
        data-ocid="driver.online_banner"
        className={`flex items-center justify-between px-4 py-2.5 text-sm font-semibold ${
          isOnline ? "bg-green-600 text-white" : "bg-gray-400 text-white"
        }`}
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          {isOnline
            ? "Online — Accepting Rides"
            : "Offline — Not Accepting Rides"}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-normal opacity-80">
            {isOnline ? "Go Offline" : "Go Online"}
          </span>
          <Switch
            data-ocid="driver.online_toggle.switch"
            checked={isOnline}
            onCheckedChange={toggleOnline}
            className="data-[state=checked]:bg-white data-[state=checked]:text-green-600"
          />
        </div>
      </div>

      <main className="flex-1 px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">
                {availableRides.length}
              </p>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {completedTrips.length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-primary">₹{earnings * 5}</p>
              <p className="text-xs text-muted-foreground">Earnings</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available">
          <TabsList className="grid grid-cols-5 bg-muted">
            <TabsTrigger
              data-ocid="driver.available.tab"
              value="available"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Available
            </TabsTrigger>
            <TabsTrigger
              data-ocid="driver.trips.tab"
              value="trips"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              My Trips
            </TabsTrigger>
            <TabsTrigger
              data-ocid="driver.profile.tab"
              value="profile"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              data-ocid="driver.docs.tab"
              value="docs"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="w-3.5 h-3.5 mr-0.5" />
              Docs{" "}
              {docCount > 0 && (
                <Badge className="ml-1 h-4 w-4 p-0 text-[9px] justify-center bg-green-500">
                  {docCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              data-ocid="driver.subscription.tab"
              value="subscription"
              className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Sub
              {subscribedPlan && (
                <Badge className="ml-1 h-4 w-4 p-0 text-[9px] justify-center bg-green-500">
                  ✓
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Available Rides */}
          <TabsContent value="available" className="space-y-3">
            {/* Live Map */}
            <LiveMapCanvas
              status={driverMapStatus}
              pickup={activeTrip?.pickup ?? ""}
              destination={activeTrip?.destination ?? ""}
              rideType={(activeTrip as Ride & { rideType?: string })?.rideType}
            />

            {!isOnline ? (
              <div
                data-ocid="driver.offline_state"
                className="text-center py-8 text-muted-foreground"
              >
                <WifiOff className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium">You are offline</p>
                <p className="text-sm mt-1">
                  Toggle online to start receiving rides
                </p>
              </div>
            ) : availableRides.length === 0 ? (
              <div
                data-ocid="driver.rides.empty_state"
                className="text-center py-8 text-muted-foreground"
              >
                <Car className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p>No available rides right now</p>
              </div>
            ) : (
              availableRides.map((ride, idx) => (
                <Card
                  key={ride.id}
                  data-ocid={`driver.ride.item.${idx + 1}`}
                  className="border-border shadow-sm"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span className="text-sm">{ride.pickup}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-foreground/30 mt-1.5 shrink-0" />
                          <span className="text-sm">{ride.destination}</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary flex items-center gap-1">
                          <Coins className="w-4 h-4" />
                          {formatFare(ride.fare)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Rider: {getRiderName(ride.riderId)}
                        </span>
                      </div>
                      <Button
                        data-ocid={`driver.accept_ride.button.${idx + 1}`}
                        onClick={() => acceptRide(ride)}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Accept Ride
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* My Trips */}
          <TabsContent value="trips" className="space-y-3">
            {myTrips.length === 0 ? (
              <div
                data-ocid="driver.trips.empty_state"
                className="text-center py-8 text-muted-foreground"
              >
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p>No active trips right now</p>
              </div>
            ) : (
              myTrips.map((ride, idx) => (
                <Card
                  key={ride.id}
                  data-ocid={`driver.trip.item.${idx + 1}`}
                  className="border-border shadow-sm"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={
                          ride.status === "in_progress"
                            ? "text-green-700 border-green-300 bg-green-50"
                            : "text-blue-700 border-blue-300 bg-blue-50"
                        }
                      >
                        {ride.status === "in_progress"
                          ? "In Progress"
                          : "Accepted"}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        OTP: {ride.otp}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span className="text-sm">{ride.pickup}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-foreground/30 mt-1.5 shrink-0" />
                        <span className="text-sm">{ride.destination}</span>
                      </div>
                    </div>
                    {ride.status === "accepted" && (
                      <div className="flex gap-2">
                        <input
                          data-ocid={`driver.otp.input.${idx + 1}`}
                          type="text"
                          placeholder="Enter OTP from rider"
                          value={otpInputs[ride.id] ?? ""}
                          onChange={(e) =>
                            setOtpInputs((prev) => ({
                              ...prev,
                              [ride.id]: e.target.value,
                            }))
                          }
                          className="flex-1 border border-border rounded-md px-3 py-2 text-sm"
                          maxLength={4}
                        />
                        <Button
                          data-ocid={`driver.start_trip.button.${idx + 1}`}
                          onClick={() => startTrip(ride)}
                          size="sm"
                          className="bg-primary text-primary-foreground"
                        >
                          Start Trip
                        </Button>
                      </div>
                    )}
                    {ride.status === "in_progress" && (
                      <Button
                        data-ocid={`driver.complete_trip.button.${idx + 1}`}
                        onClick={() => completeTrip(ride.id)}
                        className="w-full bg-green-600 text-white hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Complete Trip
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" /> Driver Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Name</span>
                    <span className="text-sm">{currentUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Phone</span>
                    <span className="text-sm">{currentUser.phone ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Rating</span>
                    <span className="text-sm font-bold text-primary">
                      ⭐ {currentUser.rating?.toFixed(1) ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">V Coins</span>
                    <span className="text-sm font-bold text-primary">
                      {currentUser.vCoins} VC = ₹{currentUser.vCoins * 5}
                    </span>
                  </div>
                </div>

                {/* City Selector */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Operating City
                  </p>
                  <Select
                    value={currentUser.city ?? ""}
                    onValueChange={(city) =>
                      onUpdateUser(currentUser.id, { city })
                    }
                  >
                    <SelectTrigger data-ocid="driver.city.select">
                      <SelectValue placeholder="Select your city" />
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

                {completedTrips.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Recent Completed Trips
                    </p>
                    <div className="space-y-2">
                      {completedTrips.slice(0, 3).map((ride, idx) => (
                        <div
                          key={ride.id}
                          data-ocid={`driver.completed.item.${idx + 1}`}
                          className="flex justify-between text-sm border border-border rounded-lg p-3"
                        >
                          <span className="text-muted-foreground truncate max-w-[60%]">
                            {ride.pickup} → {ride.destination}
                          </span>
                          <span className="font-bold text-primary">
                            {formatFare(ride.fare)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="docs" className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Driver Documents
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Upload all 5 required documents for verification ({docCount}/5
                  uploaded)
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <DocumentUpload
                  label="ID Proof (Aadhaar / Passport)"
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
                <DocumentUpload
                  label="Vehicle RC (Registration Certificate)"
                  value={docVehicleRc}
                  onChange={setDocVehicleRc}
                  required
                />
                <DocumentUpload
                  label="Insurance Certificate"
                  value={docInsurance}
                  onChange={setDocInsurance}
                  required
                />
                <DocumentUpload
                  label="Permit"
                  value={docPermit}
                  onChange={setDocPermit}
                  required
                />

                <Button
                  data-ocid="driver.save_docs.button"
                  onClick={saveDocuments}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Documents
                </Button>
                {docCount < 5 && (
                  <p className="text-xs text-amber-600 text-center">
                    ⚠️ Please upload all 5 documents to complete your profile
                    verification.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-4">
            <div className="text-center pt-2 pb-1">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Subscription Plans</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Unlock unlimited rides with a plan
              </p>
            </div>

            {/* Active Plan Status */}
            {subscribedPlan && subscriptionExpiry && (
              <Card
                data-ocid="driver.subscription.status.panel"
                className="border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-600 text-white capitalize">
                            {subscribedPlan} Plan Active
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires:{" "}
                          {subscriptionExpiry.toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      data-ocid="driver.subscription.cancel_button"
                      variant="outline"
                      size="sm"
                      onClick={cancelSubscription}
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Daily Plan */}
              <Card
                data-ocid="driver.subscription.daily.card"
                className={`border-2 transition-all ${
                  subscribedPlan === "daily"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      Daily Plan
                    </CardTitle>
                    {subscribedPlan === "daily" && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-primary">
                      ₹95
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">
                      / day
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {[
                      "Unlimited ride requests",
                      "Priority assignment",
                      "Valid for 24 hours",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    data-ocid="driver.subscription.daily.button"
                    onClick={() => subscribeToPlan("daily")}
                    disabled={subscribedPlan === "daily"}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {subscribedPlan === "daily"
                      ? "Current Plan"
                      : "Subscribe — ₹95"}
                  </Button>
                </CardContent>
              </Card>

              {/* Weekly Plan */}
              <Card
                data-ocid="driver.subscription.weekly.card"
                className={`border-2 transition-all relative ${
                  subscribedPlan === "weekly"
                    ? "border-primary bg-primary/5"
                    : "border-primary/70 hover:border-primary shadow-md shadow-primary/10"
                }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3" /> Best Value
                  </Badge>
                </div>
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Weekly Plan
                    </CardTitle>
                    {subscribedPlan === "weekly" && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-primary">
                      ₹555
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">
                      / week
                    </span>
                  </div>
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    💰 Save ₹110 vs daily
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {[
                      "Unlimited ride requests",
                      "Priority assignment",
                      "Valid for 7 days",
                      "24/7 support",
                    ].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    data-ocid="driver.subscription.weekly.button"
                    onClick={() => subscribeToPlan("weekly")}
                    disabled={subscribedPlan === "weekly"}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {subscribedPlan === "weekly"
                      ? "Current Plan"
                      : "Subscribe — ₹555"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* UPI Payment Methods */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  UPI Payment Methods
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Manage UPI IDs used for subscription payments
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* UPI List */}
                <div className="space-y-2">
                  {upiList.map((upi, idx) => (
                    <div
                      key={upi}
                      data-ocid={`driver.subscription.upi.item.${idx + 1}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Smartphone className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-mono truncate">
                          {upi}
                        </span>
                        {idx === 0 && (
                          <Badge className="ml-1 bg-primary/15 text-primary border border-primary/30 text-[10px] px-1.5 py-0 shrink-0">
                            Default
                          </Badge>
                        )}
                      </div>
                      <button
                        data-ocid={`driver.subscription.upi.delete_button.${idx + 1}`}
                        type="button"
                        onClick={() => deleteUpi(upi)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                        title="Remove UPI"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New UPI */}
                <div className="flex gap-2 pt-1">
                  <input
                    data-ocid="driver.subscription.upi.input"
                    type="text"
                    placeholder="Enter UPI ID (e.g. name@bank)"
                    value={newUpi}
                    onChange={(e) => setNewUpi(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addUpi()}
                    className="flex-1 border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <Button
                    data-ocid="driver.subscription.upi.add_button"
                    type="button"
                    onClick={addUpi}
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                  >
                    Add UPI
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-center text-muted-foreground pb-2">
              Payments in ₹ (INR). Plans auto-renew. Cancel anytime.
            </p>
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
