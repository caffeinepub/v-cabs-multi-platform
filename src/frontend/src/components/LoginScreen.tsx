import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { seedUsers } from "../data/seedData";
import type { Role, User } from "../types/vcabs";

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const DEMO_CREDENTIALS: Record<Role, { username: string; password: string }> = {
  rider: { username: "rider@vcabs.com", password: "rider123" },
  driver: { username: "driver@vcabs.com", password: "driver123" },
  admin: { username: "admin@vcabs.com", password: "admin123" },
};

const ROLE_MAP: Record<string, Role> = {
  "rider@vcabs.com": "rider",
  "driver@vcabs.com": "driver",
  "admin@vcabs.com": "admin",
};

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [role, setRole] = useState<Role>("rider");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const creds = DEMO_CREDENTIALS[role];
    if (username === creds.username && password === creds.password) {
      const userRole = ROLE_MAP[username];
      let user: User | undefined;
      if (userRole === "admin") {
        user = seedUsers.find((u) => u.role === "admin");
      } else if (userRole === "rider") {
        user = seedUsers.find(
          (u) => u.role === "rider" && u.status === "active",
        );
      } else {
        user = seedUsers.find(
          (u) => u.role === "driver" && u.status === "active",
        );
      }
      if (user) onLogin(user);
    } else {
      setError("Invalid credentials. Use the demo credentials below.");
    }
  };

  const fillDemo = () => {
    const creds = DEMO_CREDENTIALS[role];
    setUsername(creds.username);
    setPassword(creds.password);
    setError("");
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
                Email
              </Label>
              <Input
                id="username"
                data-ocid="login.username.input"
                type="email"
                placeholder={`${role}@vcabs.com`}
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
              className="text-destructive text-sm text-center"
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

          {/* Demo hint */}
          <div className="rounded-lg bg-accent/60 p-4 space-y-1">
            <p className="text-xs font-semibold text-accent-foreground uppercase tracking-wider">
              Demo Credentials — {role}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {DEMO_CREDENTIALS[role].username}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {DEMO_CREDENTIALS[role].password}
            </p>
            <button
              type="button"
              onClick={fillDemo}
              className="text-xs text-primary hover:underline font-medium mt-1"
            >
              Click to fill →
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
