import { useEffect, useRef } from "react";

export interface LiveMapCanvasProps {
  status: "idle" | "pending" | "accepted" | "in_progress" | "completed";
  pickup: string;
  destination: string;
  rideType?: string;
}

// ---- Fixed world coordinates (canvas 0..1 normalized) ----
const PICKUP = { x: 0.22, y: 0.52 };
const DROP = { x: 0.78, y: 0.48 };
const DRIVER_START = { x: 0.15, y: 0.28 };

// City grid intersections
const H_LINES = [0.2, 0.38, 0.52, 0.66, 0.82];
const V_LINES = [0.12, 0.28, 0.44, 0.58, 0.72, 0.88];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = "rgba(100,120,180,0.13)";
  ctx.lineWidth = 1.2;
  for (const hy of H_LINES) {
    ctx.beginPath();
    ctx.moveTo(0, hy * h);
    ctx.lineTo(w, hy * h);
    ctx.stroke();
  }
  for (const vx of V_LINES) {
    ctx.beginPath();
    ctx.moveTo(vx * w, 0);
    ctx.lineTo(vx * w, h);
    ctx.stroke();
  }
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(PICKUP.x * w, PICKUP.y * h);
  ctx.lineTo(0.5 * w, 0.38 * h);
  ctx.lineTo(DROP.x * w, DROP.y * h);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string,
  pulse = 0,
) {
  if (pulse > 0) {
    ctx.save();
    ctx.globalAlpha = (1 - pulse) * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, 10 + pulse * 18, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = "bold 10px 'General Sans', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y - 12);
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawRadioWaves(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
) {
  for (let i = 0; i < 3; i++) {
    const phase = (t + i * 0.33) % 1;
    ctx.save();
    ctx.globalAlpha = (1 - phase) * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, 12 + phase * 36, 0, Math.PI * 2);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

function drawCheckmark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
) {
  ctx.save();
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(34,197,94,0.15)";
  ctx.fill();
  ctx.globalAlpha = Math.min(progress * 2, 1);
  ctx.stroke();
  if (progress > 0.5) {
    const p = (progress - 0.5) * 2;
    ctx.globalAlpha = p;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x - 3, y + 8);
    ctx.lineTo(x + 11, y - 8);
    ctx.stroke();
  }
  ctx.restore();
}

interface RoamCar {
  x: number;
  y: number;
  tx: number;
  ty: number;
  speed: number;
  color: string;
}

export default function LiveMapCanvas({
  status,
  pickup,
  destination,
  rideType,
}: LiveMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  const roamCarsRef = useRef<RoamCar[]>([
    { x: 0.3, y: 0.38, tx: 0.58, ty: 0.38, speed: 0.00018, color: "#60a5fa" },
    { x: 0.72, y: 0.66, tx: 0.44, ty: 0.66, speed: 0.00022, color: "#a78bfa" },
    { x: 0.44, y: 0.2, tx: 0.72, ty: 0.52, speed: 0.00015, color: "#34d399" },
    { x: 0.88, y: 0.38, tx: 0.28, ty: 0.2, speed: 0.0002, color: "#f472b6" },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    let completedAnim = 0;

    const frame = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;

      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#0f0f1e");
      grad.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      drawGrid(ctx, W, H);

      const px = PICKUP.x * W;
      const py = PICKUP.y * H;
      const dx = DROP.x * W;
      const dy = DROP.y * H;
      const dsx = DRIVER_START.x * W;
      const dsy = DRIVER_START.y * H;

      const pulse = (Math.sin(elapsed / 600) + 1) / 2;

      if (status === "idle") {
        const cars = roamCarsRef.current;
        for (const car of cars) {
          const dist = Math.sqrt((car.tx - car.x) ** 2 + (car.ty - car.y) ** 2);
          const step = car.speed;
          if (dist < 0.01) {
            const hLine = H_LINES[Math.floor(Math.random() * H_LINES.length)];
            const vLine = V_LINES[Math.floor(Math.random() * V_LINES.length)];
            car.tx = vLine;
            car.ty = hLine;
          } else {
            car.x = lerp(car.x, car.tx, step * 60);
            car.y = lerp(car.y, car.ty, step * 60);
          }
          drawCar(ctx, car.x * W, car.y * H, car.color);
        }
        drawMarker(ctx, W / 2, H / 2, "#3b82f6", "You", pulse);
      } else if (status === "pending") {
        drawRoute(ctx, W, H, 0.5);
        const waveT = (elapsed % 2000) / 2000;
        drawRadioWaves(ctx, px, py, waveT);
        drawMarker(
          ctx,
          px,
          py,
          "#22c55e",
          pickup.substring(0, 8) || "Pickup",
          pulse,
        );
        drawMarker(
          ctx,
          dx,
          dy,
          "#ef4444",
          destination.substring(0, 8) || "Drop",
        );
        const cars = roamCarsRef.current;
        for (const car of cars) {
          const dist = Math.sqrt((car.tx - car.x) ** 2 + (car.ty - car.y) ** 2);
          if (dist < 0.01) {
            car.tx = PICKUP.x + (Math.random() - 0.5) * 0.3;
            car.ty = PICKUP.y + (Math.random() - 0.5) * 0.3;
          } else {
            car.x = lerp(car.x, car.tx, 0.012);
            car.y = lerp(car.y, car.ty, 0.012);
          }
          drawCar(ctx, car.x * W, car.y * H, car.color);
        }
      } else if (status === "accepted") {
        drawRoute(ctx, W, H, 0.7);
        const t = Math.min((elapsed % 6000) / 6000, 1);
        const ex = lerp(dsx, px, t);
        const ey = lerp(dsy, py, t);
        drawMarker(
          ctx,
          px,
          py,
          "#22c55e",
          pickup.substring(0, 8) || "Pickup",
          pulse,
        );
        drawMarker(
          ctx,
          dx,
          dy,
          "#ef4444",
          destination.substring(0, 8) || "Drop",
        );
        drawCar(ctx, ex, ey, "#f59e0b");
        ctx.font = "10px 'General Sans', sans-serif";
        ctx.fillStyle = "rgba(245,158,11,0.9)";
        ctx.textAlign = "center";
        ctx.fillText("Driver", ex, ey - 12);
      } else if (status === "in_progress") {
        drawRoute(ctx, W, H, 1);
        const tripT = (elapsed % 8000) / 8000;
        const wpx = 0.5 * W;
        const wpy = 0.38 * H;
        let ex: number;
        let ey: number;
        if (tripT < 0.5) {
          const t2 = tripT * 2;
          ex = lerp(px, wpx, t2);
          ey = lerp(py, wpy, t2);
        } else {
          const t2 = (tripT - 0.5) * 2;
          ex = lerp(wpx, dx, t2);
          ey = lerp(wpy, dy, t2);
        }
        ctx.save();
        ctx.strokeStyle = "rgba(245,158,11,0.35)";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
        drawMarker(ctx, px, py, "#22c55e", pickup.substring(0, 8) || "Pickup");
        drawMarker(
          ctx,
          dx,
          dy,
          "#ef4444",
          destination.substring(0, 8) || "Drop",
          pulse,
        );
        drawCar(ctx, ex, ey, "#f59e0b");
        ctx.font = "bold 10px 'General Sans', sans-serif";
        ctx.fillStyle = "rgba(245,158,11,0.95)";
        ctx.textAlign = "center";
        ctx.fillText(rideType ?? "Driver", ex, ey - 14);
        const pct = Math.round(tripT * 100);
        ctx.font = "bold 11px 'General Sans', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.textAlign = "left";
        ctx.fillText(`${pct}%`, 10, H - 8);
      } else if (status === "completed") {
        drawRoute(ctx, W, H, 0.4);
        completedAnim = Math.min(completedAnim + 0.015, 1);
        drawMarker(ctx, px, py, "#22c55e", pickup.substring(0, 8) || "Pickup");
        drawCheckmark(ctx, dx, dy, completedAnim);
        ctx.font = "bold 11px 'General Sans', sans-serif";
        ctx.fillStyle = "rgba(34,197,94,0.9)";
        ctx.textAlign = "center";
        ctx.fillText("Arrived!", dx, dy - 30);
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [status, pickup, destination, rideType]);

  const overlayMap: Record<
    string,
    { icon: string; text: string; cls: string }
  > = {
    idle: {
      icon: "📍",
      text: "Ready to book a ride",
      cls: "text-muted-foreground",
    },
    pending: {
      icon: "🔍",
      text: "Finding your driver...",
      cls: "text-amber-400 animate-pulse",
    },
    accepted: {
      icon: "🚗",
      text: "Driver is on the way · ETA ~3 min",
      cls: "text-blue-400",
    },
    in_progress: { icon: "🛣️", text: "Trip in progress", cls: "text-primary" },
    completed: { icon: "✅", text: "Trip completed!", cls: "text-green-400" },
  };
  const overlay = overlayMap[status] ?? overlayMap.idle;

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-border shadow-md"
      style={{ height: 240 }}
    >
      <canvas
        ref={canvasRef}
        data-ocid="rider.live_map.canvas_target"
        className="w-full h-full block"
        style={{ height: 240 }}
      />
      <div
        data-ocid="rider.map_status.panel"
        className="absolute bottom-2 left-2 right-2 flex items-center gap-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-2"
      >
        <span className="text-sm">{overlay.icon}</span>
        <span className={`text-xs font-medium flex-1 ${overlay.cls}`}>
          {overlay.text}
        </span>
        {status === "in_progress" && (
          <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{
                width: "60%",
                animation: "progress-bar 8s linear infinite",
              }}
            />
          </div>
        )}
        {pickup && status !== "idle" && (
          <span className="text-[10px] text-white/40 hidden sm:block truncate max-w-[100px]">
            {pickup} → {destination}
          </span>
        )}
      </div>
    </div>
  );
}
