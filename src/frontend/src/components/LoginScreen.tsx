import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import type { Role, User } from "../types/vcabs";

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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState("");

  const handleLogin = () => {
    // Fix: check against live users list (not static seedUsers)
    const user = users.find(
      (u) =>
        u.role === role &&
        (u.phone === username || u.email === username) &&
        u.password === password,
    );
    if (user) {
      if (user.status === "suspended") {
        setError("Your account has been suspended. Please contact support.");
        return;
      }
      onLogin(user);
    } else {
      setError(
        "Invalid credentials. Please check your mobile number and password.",
      );
    }
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
    // Check if phone already registered
    if (users.some((u) => u.phone === signupPhone)) {
      setSignupError("This mobile number is already registered.");
      return;
    }
    // Fix: create user and add to live users list so login works immediately
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
    // Auto-fill login form and show success message
    setShowSignup(false);
    setUsername(signupPhone.trim());
    setPassword(signupPassword.trim());
    setSignupError("");
    setError("Account created successfully! You can now sign in.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar via-[oklch(0.20_0.025_255)] to-[oklch(0.13_0.02_260)] p-4">
      {/* Decorative amber glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 border-border/60 shadow-2xl bg-card">
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

        <CardContent className="px-8 pb-8 space-y-6">
          {!showSignup ? (
            <>
              {/* Role Tabs */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Sign in as
                </Label>
                <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg">
                  {(["rider", "driver", "admin"] as Role[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      data-ocid="login.role.tab"
                      onClick={() => {
                        setRole(r);
                        setUsername("");
                        setPassword("");
                        setError("");
                      }}
                      className={`py-2 px-3 rounded-md text-sm font-semibold transition-all capitalize ${
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

              {/* Credentials */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Mobile Number
                  </Label>
                  <Input
                    id="username"
                    data-ocid="login.username.input"
                    type="text"
                    placeholder="Enter your mobile number"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    data-ocid="login.password.input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="h-10"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
              </div>

              {error && (
                <p
                  data-ocid="login.error_state"
                  className={`text-sm text-center ${
                    error.includes("created")
                      ? "text-green-600"
                      : "text-destructive"
                  }`}
                >
                  {error}
                </p>
              )}

              <Button
                data-ocid="login.submit_button"
                onClick={handleLogin}
                className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                New to V Cabs?{" "}
                <button
                  type="button"
                  data-ocid="login.signup.button"
                  onClick={() => {
                    setShowSignup(true);
                    setError("");
                  }}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="space-y-1 mb-2">
                <h2 className="text-xl font-bold text-foreground">
                  Create Account
                </h2>
                <p className="text-sm text-muted-foreground">
                  Sign up as a new {role}
                </p>
              </div>

              {/* Role Tabs in signup */}
              <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg">
                {(["rider", "driver"] as Role[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-md text-sm font-semibold transition-all capitalize ${
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
                    className="h-10"
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
                    className="h-10"
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
                    className="h-10"
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
                className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
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
                  className="text-primary font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
