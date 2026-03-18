import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import type { Role, User } from "../types/vcabs";

// PWA install prompt
let deferredPrompt:
  | (Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> })
  | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e as typeof deferredPrompt;
});

function AppDownloadSection() {
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        deferredPrompt = null;
      }
    } else {
      setShowAndroidGuide(true);
      setShowIosGuide(false);
    }
  };

  const handleIosInstall = () => {
    setShowIosGuide(true);
    setShowAndroidGuide(false);
  };

  return (
    <div className="pt-4 mt-2 border-t border-border/60 space-y-3">
      <p className="text-center text-xs text-muted-foreground">
        Install V Cabs on your device for the best experience
      </p>
      <p
        className="text-center text-sm font-semibold text-foreground"
        style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
      >
        Get the App
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          data-ocid="login.download_android.button"
          onClick={handleAndroidInstall}
          className="touch-manipulation flex flex-col items-center gap-1 bg-[oklch(0.16_0.02_255)] hover:bg-[oklch(0.20_0.02_255)] text-white rounded-xl px-3 py-3 transition-colors border border-white/10 active:scale-95"
        >
          <span className="text-2xl">📱</span>
          <span className="text-sm font-semibold leading-tight">
            Install App
          </span>
          <span className="text-xs text-white/60">Android</span>
        </button>
        <button
          type="button"
          data-ocid="login.download_ios.button"
          onClick={handleIosInstall}
          className="touch-manipulation flex flex-col items-center gap-1 bg-[oklch(0.16_0.02_255)] hover:bg-[oklch(0.20_0.02_255)] text-white rounded-xl px-3 py-3 transition-colors border border-white/10 active:scale-95"
        >
          <span className="text-2xl">🍎</span>
          <span className="text-sm font-semibold leading-tight">
            Add to iPhone
          </span>
          <span className="text-xs text-white/60">Safari</span>
        </button>
      </div>

      {showAndroidGuide && (
        <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Install on Android:</p>
          <p>1. Tap the ⋮ menu in Chrome (top-right)</p>
          <p>
            2. Tap <strong>"Add to Home screen"</strong>
          </p>
          <p>
            3. Tap <strong>Add</strong> — V Cabs appears like a native app!
          </p>
          <button
            type="button"
            onClick={() => setShowAndroidGuide(false)}
            className="mt-1 text-primary underline"
          >
            Got it
          </button>
        </div>
      )}

      {showIosGuide && (
        <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">
            Install on iPhone (Safari):
          </p>
          <p>1. Tap the Share button (□↑) at the bottom</p>
          <p>
            2. Scroll down and tap <strong>"Add to Home Screen"</strong>
          </p>
          <p>
            3. Tap <strong>Add</strong> — V Cabs appears like a native app!
          </p>
          <button
            type="button"
            onClick={() => setShowIosGuide(false)}
            className="mt-1 text-primary underline"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onSignup: (user: User) => void;
}

export default function LoginScreen({
  users,
  onLogin,
  onSignup,
}: LoginScreenProps) {
  const [role, setRole] = useState<Role>("rider");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [error, setError] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setOtpTimer(30);
    timerRef.current = setInterval(() => {
      setOtpTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleGetOtp = () => {
    if (!phone.trim() || phone.trim().length < 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    // Check user exists for the selected role (or admin)
    const user = users.find(
      (u) =>
        u.phone === phone.trim() &&
        (u.role === role || u.role === "admin") &&
        !u.deletedAt,
    );
    if (!user) {
      setError("Mobile number not registered. Please sign up first.");
      return;
    }
    if (user.status === "suspended") {
      setError("Your account has been suspended. Contact support.");
      return;
    }
    const newOtp = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    setOtp("");
    setError("");
    startTimer();
  };

  const handleVerifyOtp = () => {
    if (otp.trim() !== generatedOtp) {
      setError("Incorrect OTP. Please try again.");
      return;
    }
    const user = users.find(
      (u) =>
        u.phone === phone.trim() &&
        (u.role === role || u.role === "admin") &&
        !u.deletedAt,
    );
    if (user) {
      onLogin(user);
    } else {
      setError("User not found. Please sign up.");
    }
  };

  const handleResendOtp = () => {
    const newOtp = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(newOtp);
    setOtp("");
    setError("");
    startTimer();
  };

  const handleSignup = () => {
    if (!signupName.trim() || !signupPhone.trim() || !signupPassword.trim()) {
      setSignupError("All fields are required.");
      return;
    }
    if (signupPhone.length < 10) {
      setSignupError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (users.some((u) => u.phone === signupPhone)) {
      setSignupError("This mobile number is already registered.");
      return;
    }
    const newUser: User = {
      id: `u_${Date.now()}`,
      name: signupName.trim(),
      phone: signupPhone.trim(),
      password: signupPassword.trim(),
      role: role as "rider" | "driver",
      status: "active",
      vCoins: 100,
      rating: 5.0,
      savedAddresses: {},
    };
    onSignup(newUser);
    setShowSignup(false);
    setPhone(signupPhone.trim());
    setOtpSent(false);
    setGeneratedOtp("");
    setSignupError("");
    setError(
      "Account created! Enter your mobile number and get OTP to sign in.",
    );
  };

  const resetLogin = () => {
    setOtpSent(false);
    setOtp("");
    setGeneratedOtp("");
    setError("");
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar via-[oklch(0.20_0.025_255)] to-[oklch(0.13_0.02_260)] px-4 py-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md mx-auto relative z-10 border-border/60 shadow-2xl bg-card">
        <CardHeader className="pb-2 pt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span
                className="text-primary-foreground font-bold text-lg"
                style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
              >
                V
              </span>
            </div>
            <h1
              className="text-3xl font-extrabold text-foreground tracking-tight"
              style={{ fontFamily: "Bricolage Grotesque, sans-serif" }}
            >
              V Cabs
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Your Ride, Your Way
          </p>
        </CardHeader>

        <CardContent className="px-4 sm:px-8 pb-8 space-y-6">
          {!showSignup ? (
            <>
              {/* Role Tabs */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Sign in as
                </Label>
                <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg">
                  {(["rider", "driver"] as Role[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      data-ocid="login.role.tab"
                      onClick={() => {
                        setRole(r);
                        resetLogin();
                        setPhone("");
                      }}
                      className={`touch-manipulation py-2.5 px-3 rounded-md text-sm font-semibold transition-all capitalize ${
                        role === r
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {!otpSent ? (
                /* Step 1: Enter mobile */
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Mobile Number
                    </Label>
                    <Input
                      id="phone"
                      data-ocid="login.phone.input"
                      type="tel"
                      placeholder="Enter your 10-digit mobile number"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setError("");
                      }}
                      className="h-12 text-base"
                      maxLength={15}
                      onKeyDown={(e) => e.key === "Enter" && handleGetOtp()}
                    />
                  </div>

                  {error && (
                    <p
                      data-ocid="login.error_state"
                      className={`text-sm text-center ${
                        error.includes("created")
                          ? "text-green-500"
                          : "text-destructive"
                      }`}
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    data-ocid="login.get_otp.button"
                    onClick={handleGetOtp}
                    className="touch-manipulation w-full h-12 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-base"
                  >
                    Get OTP
                  </Button>
                </div>
              ) : (
                /* Step 2: Enter OTP */
                <div className="space-y-4">
                  {/* Demo OTP display */}
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Demo OTP sent to +91 {phone}
                    </p>
                    <p className="text-2xl font-bold tracking-[0.4em] text-primary">
                      {generatedOtp}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Use this OTP to verify)
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="otp" className="text-sm font-medium">
                      Enter OTP
                    </Label>
                    <Input
                      id="otp"
                      data-ocid="login.otp.input"
                      type="number"
                      placeholder="4-digit OTP"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        setError("");
                      }}
                      className="h-12 text-base text-center tracking-widest"
                      maxLength={4}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                    />
                  </div>

                  {error && (
                    <p
                      data-ocid="login.error_state"
                      className="text-destructive text-sm text-center"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    data-ocid="login.verify_otp.button"
                    onClick={handleVerifyOtp}
                    className="touch-manipulation w-full h-12 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-base"
                  >
                    Verify & Sign In
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      data-ocid="login.change_phone.button"
                      onClick={resetLogin}
                      className="touch-manipulation text-muted-foreground hover:text-foreground"
                    >
                      ← Change Number
                    </button>
                    {otpTimer > 0 ? (
                      <span className="text-muted-foreground">
                        Resend in {otpTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        data-ocid="login.resend_otp.button"
                        onClick={handleResendOtp}
                        className="touch-manipulation text-primary font-semibold hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground">
                New to V Cabs?{" "}
                <button
                  type="button"
                  data-ocid="login.signup.button"
                  onClick={() => {
                    setShowSignup(true);
                    resetLogin();
                  }}
                  className="touch-manipulation text-primary font-semibold hover:underline"
                >
                  Sign Up
                </button>
              </p>

              <AppDownloadSection />
            </>
          ) : (
            /* Signup Form */
            <>
              <div className="space-y-1 mb-2">
                <h2 className="text-xl font-bold text-foreground">
                  Create Account
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sign up as a new {role}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg">
                {(["rider", "driver"] as Role[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`touch-manipulation py-2.5 px-3 rounded-md text-sm font-semibold transition-all capitalize ${
                      role === r
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <Input
                    data-ocid="signup.name.input"
                    placeholder="Your full name"
                    value={signupName}
                    onChange={(e) => {
                      setSignupName(e.target.value);
                      setSignupError("");
                    }}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Mobile Number</Label>
                  <Input
                    data-ocid="signup.phone.input"
                    placeholder="10-digit mobile number"
                    value={signupPhone}
                    onChange={(e) => {
                      setSignupPhone(e.target.value);
                      setSignupError("");
                    }}
                    className="h-12 text-base"
                    type="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Password</Label>
                  <Input
                    data-ocid="signup.password.input"
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      setSignupError("");
                    }}
                    className="h-12 text-base"
                    type="password"
                  />
                </div>
              </div>

              {signupError && (
                <p
                  data-ocid="signup.error_state"
                  className="text-destructive text-sm text-center"
                >
                  {signupError}
                </p>
              )}

              <Button
                data-ocid="signup.submit_button"
                onClick={handleSignup}
                className="touch-manipulation w-full h-12 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-base"
              >
                Create Account
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  data-ocid="signup.back_to_login.button"
                  onClick={() => {
                    setShowSignup(false);
                    setSignupError("");
                  }}
                  className="touch-manipulation text-primary font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>

              <AppDownloadSection />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
