import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Briefcase,
  Car,
  Clock,
  Coins,
  CreditCard,
  FileText,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  Ride,
  User,
  PaymentRequest as VCabsPaymentRequest,
} from "../types/vcabs";
import { formatFare } from "../utils/fareHelper";
import DocumentUpload from "./DocumentUpload";

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

interface SidebarMenuProps {
  open: boolean;
  onClose: () => void;
  currentUser: User;
  rides: Ride[];
  onNavigate?: (screen: "sos" | "helpline") => void;
  onUpdateUser?: (updates: Partial<User>) => void;
  onSubmitPaymentRequest?: (req: VCabsPaymentRequest) => void;
  paymentRequests?: VCabsPaymentRequest[];
  adminUpi?: string;
}

const INITIAL_PAYMENT_METHODS = [
  { id: "pm1", type: "UPI", label: "alex@upi", icon: "💳" },
  { id: "pm2", type: "Card", label: "•••• 4242 (Visa)", icon: "💳" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= Math.round(rating)
              ? "fill-primary text-primary"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default function SidebarMenu({
  open,
  onClose,
  currentUser,
  rides,
  onNavigate,
  onUpdateUser,
  onSubmitPaymentRequest,
  paymentRequests = [],
  adminUpi = "9999000003@okbizaxis",
}: SidebarMenuProps) {
  const [editName, setEditName] = useState(currentUser.name);
  const [editPhone, setEditPhone] = useState(currentUser.phone ?? "");
  const [editEmail, setEditEmail] = useState(currentUser.email ?? "");
  const [editCity, setEditCity] = useState(currentUser.city ?? "");
  const [editHome, setEditHome] = useState(
    currentUser.savedAddresses?.home ?? "",
  );
  const [editWork, setEditWork] = useState(
    currentUser.savedAddresses?.work ?? "",
  );
  const [feedback, setFeedback] = useState("");

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState(INITIAL_PAYMENT_METHODS);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPmType, setNewPmType] = useState("");
  // Recharge V Coins state
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeUtr, setRechargeUtr] = useState("");
  const [rechargeMode, setRechargeMode] = useState("UPI");
  const [showRecharge, setShowRecharge] = useState(false);
  const [newPmLabel, setNewPmLabel] = useState("");

  const myRides = rides.filter(
    (r) =>
      (currentUser.role === "rider" ? r.riderId : r.driverId) ===
      currentUser.id,
  );
  const completedRides = myRides.filter((r) => r.status === "completed");
  const avgRating = currentUser.rating ?? 4.5;

  const [docIdProof, setDocIdProof] = useState(
    currentUser.documents?.idProof ?? "",
  );
  const [docPhoto, setDocPhoto] = useState(currentUser.documents?.photo ?? "");

  const saveDocs = () => {
    if (onUpdateUser) {
      onUpdateUser({
        documents: {
          ...currentUser.documents,
          idProof: docIdProof || undefined,
          photo: docPhoto || undefined,
        },
      });
      toast.success("Documents saved successfully!");
    }
  };

  const saveProfile = () => {
    if (onUpdateUser) {
      onUpdateUser({
        name: editName,
        phone: editPhone,
        email: editEmail,
        city: editCity,
        savedAddresses: { home: editHome, work: editWork },
      });
    }
    toast.success("Profile updated successfully!");
  };

  const submitFeedback = () => {
    if (!feedback.trim()) {
      toast.error("Please write your feedback first.");
      return;
    }
    toast.success("Thank you for your feedback!");
    setFeedback("");
  };

  const handleNavigate = (screen: "sos" | "helpline") => {
    onClose();
    if (onNavigate) onNavigate(screen);
  };

  const deletePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    toast.success("Payment method removed");
  };

  const addPaymentMethod = () => {
    if (!newPmType || !newPmLabel.trim()) {
      toast.error("Please select a type and enter a label.");
      return;
    }
    setPaymentMethods((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: newPmType,
        label: newPmLabel.trim(),
        icon: "💳",
      },
    ]);
    toast.success("Payment method added");
    setNewPmType("");
    setNewPmLabel("");
    setShowAddPayment(false);
  };

  const submitRechargeRequest = () => {
    if (!rechargeAmount || Number(rechargeAmount) <= 0 || !rechargeUtr.trim())
      return;
    const req: VCabsPaymentRequest = {
      id: `pr_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role as "rider" | "driver",
      amountPaid: Number(rechargeAmount),
      utrOrRef: rechargeUtr.trim(),
      paymentMode: rechargeMode,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    onSubmitPaymentRequest?.(req);
    setRechargeAmount("");
    setRechargeUtr("");
    setRechargeMode("UPI");
    setShowRecharge(false);
  };

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="left"
        className="w-[320px] sm:w-[380px] p-0 flex flex-col bg-background"
        data-ocid="sidebar.sheet"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-6 pb-4 bg-sidebar text-sidebar-foreground shrink-0">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 border-2 border-primary/40">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-sidebar-foreground text-lg leading-tight">
                {currentUser.name}
              </SheetTitle>
              <p className="text-sidebar-foreground/60 text-sm mt-0.5">
                {currentUser.phone ?? "Add phone"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs gap-1">
                  <Coins className="w-3 h-3" />
                  {currentUser.vCoins} VC · ₹{currentUser.vCoins * 5}
                </Badge>
                {currentUser.city && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <MapPin className="w-3 h-3" /> {currentUser.city}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* SOS + Helpline Quick Actions */}
        <div className="flex gap-2 px-4 py-3 border-b border-border shrink-0">
          <button
            data-ocid="sidebar.sos.button"
            type="button"
            onClick={() => handleNavigate("sos")}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-red-700 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> SOS
          </button>
          <button
            data-ocid="sidebar.helpline.button"
            type="button"
            onClick={() => handleNavigate("helpline")}
            className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Help & Support
          </button>
        </div>

        <Tabs defaultValue="profile" className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-4 mt-3 mb-0 grid grid-cols-3 h-auto bg-muted shrink-0">
            <TabsTrigger
              data-ocid="sidebar.profile.tab"
              value="profile"
              className="text-xs px-1 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              data-ocid="sidebar.payments.tab"
              value="payments"
              className="text-xs px-1 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Payments
            </TabsTrigger>
            <TabsTrigger
              data-ocid="sidebar.myrides.tab"
              value="myrides"
              className="text-xs px-1 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              My Rides
            </TabsTrigger>
            <TabsTrigger
              data-ocid="sidebar.history.tab"
              value="history"
              className="text-xs px-1 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              History
            </TabsTrigger>
            <TabsTrigger
              data-ocid="sidebar.ratings.tab"
              value="ratings"
              className="text-xs px-1 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Ratings
            </TabsTrigger>
            <TabsTrigger
              data-ocid="sidebar.docs.tab"
              value="sidedocs"
              className="text-xs px-1 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="w-3 h-3 mr-1" />
              Docs
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="flex-1 min-h-0 mt-3">
            <ScrollArea className="h-full px-4 pb-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Full Name
                  </Label>
                  <Input
                    data-ocid="sidebar.profile.name.input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input
                      data-ocid="sidebar.profile.phone.input"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Email{" "}
                    <span className="text-muted-foreground/50 normal-case">
                      (optional)
                    </span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <Input
                      data-ocid="sidebar.profile.email.input"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10"
                      type="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> City
                  </Label>
                  <Select value={editCity} onValueChange={setEditCity}>
                    <SelectTrigger data-ocid="sidebar.profile.city.select">
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

                <Separator />

                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Saved Addresses
                </p>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-primary" /> Home
                  </Label>
                  <Input
                    data-ocid="sidebar.profile.home.input"
                    value={editHome}
                    onChange={(e) => setEditHome(e.target.value)}
                    placeholder="Enter home address"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-primary" /> Work
                  </Label>
                  <Input
                    data-ocid="sidebar.profile.work.input"
                    value={editWork}
                    onChange={(e) => setEditWork(e.target.value)}
                    placeholder="Enter work address"
                  />
                </div>

                <Button
                  data-ocid="sidebar.profile.save.button"
                  onClick={saveProfile}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Profile
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="flex-1 min-h-0 mt-3">
            <ScrollArea className="h-full px-4 pb-6">
              <div className="space-y-4">
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
                  <Coins className="w-8 h-8 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-extrabold text-primary">
                    {currentUser.vCoins} VC
                  </p>
                  <p className="text-sm text-muted-foreground">
                    = ₹{currentUser.vCoins * 5}{" "}
                    <span className="text-xs">(1 VC = ₹5)</span>
                  </p>
                </div>

                <Separator />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Saved Payment Methods
                </p>

                {paymentMethods.length === 0 && (
                  <div
                    data-ocid="sidebar.payment.empty_state"
                    className="text-center py-6 text-muted-foreground text-sm"
                  >
                    No payment methods saved.
                  </div>
                )}

                {paymentMethods.map((pm, idx) => (
                  <div
                    key={pm.id}
                    data-ocid={`sidebar.payment.item.${idx + 1}`}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{pm.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {pm.type}
                        </p>
                      </div>
                    </div>
                    <Button
                      data-ocid={`sidebar.payment.delete_button.${idx + 1}`}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                      onClick={() => deletePaymentMethod(pm.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Add Payment Form */}
                {showAddPayment && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground">
                      New Payment Method
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Type
                      </Label>
                      <Select value={newPmType} onValueChange={setNewPmType}>
                        <SelectTrigger data-ocid="sidebar.payment.type.select">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                          <SelectItem value="Net Banking">
                            Net Banking
                          </SelectItem>
                          <SelectItem value="Wallet">Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Label
                      </Label>
                      <Input
                        data-ocid="sidebar.payment.label.input"
                        placeholder="e.g. alex@upi"
                        value={newPmLabel}
                        onChange={(e) => setNewPmLabel(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        data-ocid="sidebar.add_payment.confirm_button"
                        size="sm"
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={addPaymentMethod}
                      >
                        Add
                      </Button>
                      <Button
                        data-ocid="sidebar.add_payment.cancel_button"
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowAddPayment(false);
                          setNewPmType("");
                          setNewPmLabel("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {!showAddPayment && (
                  <Button
                    data-ocid="sidebar.add_payment.button"
                    variant="outline"
                    className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/5"
                    onClick={() => setShowAddPayment(true)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" /> Add Payment Method
                  </Button>
                )}

                {/* Recharge V Coins */}
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-primary" />
                      <p className="text-sm font-bold text-foreground">
                        Recharge V Coins
                      </p>
                    </div>
                    <Button
                      data-ocid="sidebar.recharge.toggle"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-primary"
                      onClick={() => setShowRecharge(!showRecharge)}
                    >
                      {showRecharge ? "Hide" : "Pay Now"}
                    </Button>
                  </div>
                  <div className="rounded-lg bg-background border border-border p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Pay to Admin UPI:
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground break-all">
                        {adminUpi}
                      </p>
                      <Button
                        data-ocid="sidebar.recharge.copy_upi.button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs flex-shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(adminUpi);
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Rate: 1 VC = ₹5
                    </p>
                  </div>
                  {showRecharge && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Amount Paid (INR)
                        </Label>
                        <input
                          data-ocid="sidebar.recharge.amount.input"
                          type="number"
                          min="1"
                          placeholder="e.g. 500"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        {rechargeAmount && Number(rechargeAmount) > 0 && (
                          <p className="text-xs text-primary font-medium">
                            ≈ {Math.round(Number(rechargeAmount) / 5)} V Coins
                            will be allocated
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          UTR / Reference Number
                        </Label>
                        <input
                          data-ocid="sidebar.recharge.utr.input"
                          type="text"
                          placeholder="UTR or transaction ref"
                          value={rechargeUtr}
                          onChange={(e) => setRechargeUtr(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Payment Mode
                        </Label>
                        <Select
                          value={rechargeMode}
                          onValueChange={setRechargeMode}
                        >
                          <SelectTrigger data-ocid="sidebar.recharge.mode.select">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Bank Transfer">
                              Bank Transfer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        data-ocid="sidebar.recharge.submit.button"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={submitRechargeRequest}
                        disabled={
                          !rechargeAmount ||
                          Number(rechargeAmount) <= 0 ||
                          !rechargeUtr.trim()
                        }
                      >
                        Request V Coin Recharge
                      </Button>
                    </div>
                  )}
                </div>

                {/* Past Requests */}
                {paymentRequests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      My Recharge Requests
                    </p>
                    {paymentRequests.map((pr, idx) => (
                      <div
                        key={pr.id}
                        data-ocid={`sidebar.recharge.item.${idx + 1}`}
                        className="rounded-lg border border-border p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">
                            ₹{pr.amountPaid} via {pr.paymentMode}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${pr.status === "approved" ? "bg-green-100 text-green-800" : pr.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {pr.status}
                          </span>
                        </div>
                        {pr.status === "approved" && pr.vCoinsAllocated && (
                          <p className="text-xs text-primary font-semibold">
                            +{pr.vCoinsAllocated} VC allocated
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Ref: {pr.utrOrRef}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(pr.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 min-h-0 mt-3">
            <ScrollArea className="h-full px-4 pb-6">
              {completedRides.length === 0 ? (
                <div
                  data-ocid="sidebar.history.empty_state"
                  className="text-center py-10 text-muted-foreground"
                >
                  <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm">No ride history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedRides.map((ride, idx) => (
                    <div
                      key={ride.id}
                      data-ocid={`sidebar.history.item.${idx + 1}`}
                      className="rounded-lg border border-border p-3 space-y-2"
                    >
                      <div className="flex items-start gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <span className="text-xs text-foreground/80">
                          {ride.pickup}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Navigation className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-foreground/80">
                          {ride.destination}
                        </span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(ride.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                        <span className="text-xs font-bold text-primary">
                          {formatFare(ride.fare)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Ratings Tab */}
          <TabsContent value="ratings" className="flex-1 min-h-0 mt-3">
            <ScrollArea className="h-full px-4 pb-6">
              <div className="space-y-4">
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Your Average Rating
                  </p>
                  <StarRating rating={avgRating} />
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on {myRides.length} trip
                    {myRides.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Share Your Feedback
                  </Label>
                  <Textarea
                    data-ocid="sidebar.feedback.textarea"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us about your experience with V Cabs..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Button
                  data-ocid="sidebar.feedback.submit.button"
                  onClick={submitFeedback}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Star className="w-4 h-4 mr-2" /> Submit Feedback
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* My Rides Tab */}
          <TabsContent value="myrides" className="flex-1 min-h-0 mt-3">
            <ScrollArea className="h-full px-4 pb-6">
              {myRides.length === 0 ? (
                <div
                  data-ocid="sidebar.myrides.empty_state"
                  className="text-center py-10 text-muted-foreground"
                >
                  <Car className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm">No rides yet. Book your first ride!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRides
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((ride, idx) => {
                      const isParcel = ride.rideType?.startsWith("📦 Parcel");
                      const statusColors: Record<string, string> = {
                        pending:
                          "bg-yellow-100 text-yellow-800 border-yellow-200",
                        accepted: "bg-blue-100 text-blue-800 border-blue-200",
                        in_progress:
                          "bg-primary/10 text-primary border-primary/20",
                        completed:
                          "bg-green-100 text-green-800 border-green-200",
                        cancelled: "bg-gray-100 text-gray-600 border-gray-200",
                      };
                      return (
                        <div
                          key={ride.id}
                          data-ocid={`sidebar.myrides.item.${idx + 1}`}
                          className="rounded-lg border border-border p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            {ride.rideType && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${isParcel ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-primary/10 text-primary border-primary/20"}`}
                              >
                                {ride.rideType}
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${statusColors[ride.status] ?? ""}`}
                            >
                              {ride.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <span className="text-xs text-foreground/80">
                              {ride.pickup}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <Navigation className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-foreground/80">
                              {ride.destination}
                            </span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(ride.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            <span className="text-xs font-bold text-primary">
                              {formatFare(ride.fare)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Docs Tab */}
          <TabsContent value="sidedocs" className="flex-1 min-h-0 mt-3">
            <ScrollArea className="h-full px-4 pb-6">
              <div className="space-y-4">
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-primary" /> Rider
                    Documents
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Upload your ID proof and photo for verification
                  </p>
                </div>
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
                  data-ocid="sidebar.save_docs.button"
                  onClick={saveDocs}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Documents
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Your documents are securely stored and used for identity
                  verification only.
                </p>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
