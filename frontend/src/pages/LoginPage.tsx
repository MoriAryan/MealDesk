import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  Coffee, UtensilsCrossed, CreditCard, BarChart3,
  QrCode, ChefHat, Receipt, MonitorSmartphone,
  ShoppingCart, Clock, Layers, Star,
} from "lucide-react";

type AuthTab = "login" | "signup";

/* ────────────────────────────────────────────────────────
   GATHERING SPLASH  —  the original "nodes fly to core" animation
───────────────────────────────────────────────────────── */
const GatheringSplash = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg overflow-hidden">
    <style>{`
      @keyframes spawnNode {
        0%   { opacity: 0; transform: translate(-50%, -30px) scale(0.7); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      @keyframes suckToCenter {
        0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); opacity: 0; filter: blur(4px); }
      }
      @keyframes coreGlow {
        0%, 75% { box-shadow: 0 0 0 rgba(193,91,61,0);   border-color: var(--color-border); }
        85%      { box-shadow: 0 0 80px rgba(193,91,61,0.7); border-color: var(--color-accent); transform: translate(-50%,-50%) scale(1.15); }
        100%     { box-shadow: 0 0 30px rgba(193,91,61,0.4); border-color: var(--color-accent); transform: translate(-50%,-50%) scale(1); }
      }
      @keyframes textFadeIn {
        0%   { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .ps-node {
        position: absolute;
        opacity: 0;
        width: 230px;
        padding: 14px 16px;
        background: var(--color-panel);
        border: 1px solid var(--color-border);
        border-radius: 14px;
        font-size: 12px;
        font-weight: 700;
        color: var(--color-ink);
        text-align: center;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        z-index: 10;
        transform: translate(-50%, -50%);
        animation:
          spawnNode    0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards,
          suckToCenter 0.5s cubic-bezier(0.5, 0, 0.2, 1) forwards;
      }
      .node-1 { top: 15%; left: 20%; animation-delay: 0.1s, 2.0s; }
      .node-2 { top: 15%; left: 80%; animation-delay: 0.4s, 2.1s; }
      .node-3 { top: 85%; left: 20%; animation-delay: 0.7s, 2.0s; }
      .node-4 { top: 85%; left: 80%; animation-delay: 1.0s, 2.1s; }
      .node-5 { top:  5%; left: 50%; animation-delay: 1.3s, 1.9s; }

      .core-basket {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        animation: coreGlow 3.5s ease-in-out forwards;
      }
      .core-text {
        opacity: 0;
        animation: textFadeIn 0.5s ease-out 2.5s forwards;
      }
    `}</style>

    <div className="relative w-full h-full max-w-5xl max-h-[700px] flex items-center justify-center">
      {/* Feature nodes — one per PS pillar */}
      <div className="ps-node node-1 border-t-4 border-t-blue-500">
        Restaurant table-based ordering
      </div>
      <div className="ps-node node-2 border-t-4 border-t-green-500">
        Multiple payment methods (UPI QR)
      </div>
      <div className="ps-node node-3 border-t-4 border-t-purple-500">
        Kitchen Display Integration
      </div>
      <div className="ps-node node-4 border-t-4 border-t-orange-500">
        Customer Display Integration
      </div>
      <div className="ps-node node-5" style={{ borderTop: "4px solid var(--color-accent)" }}>
        POS Configuration + Reporting
      </div>

      {/* Core — the application engine */}
      <div className="core-basket z-0 w-36 h-36 bg-panel border-4 border-border rounded-3xl flex flex-col items-center justify-center shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-accent/5" />
        <Coffee size={40} className="text-accent mb-2 z-10" />
        <span className="font-black text-[11px] tracking-widest uppercase text-ink z-10">App Engine</span>
      </div>
    </div>

    {/* Bottom label */}
    <div className="absolute bottom-16 text-center z-50">
      <h2 className="text-3xl font-black text-ink tracking-[0.2em] uppercase drop-shadow-md">
        Odoo POS Cafe
      </h2>
      <p className="core-text mt-3 text-accent font-bold text-sm tracking-widest uppercase bg-accent/10 px-5 py-2 rounded-full border border-accent/20">
        All Requirements Gathered
      </p>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────
   FLOATING BACKGROUND ICONS
   Scattered POS-themed symbols, slow & subtle (opacity ~10%)
───────────────────────────────────────────────────────── */
const BG_ICONS = [
  { Icon: Coffee,            size: 22, x: 7,  y: 10, dur: 20, delay: 0,   rot: 12  },
  { Icon: UtensilsCrossed,   size: 18, x: 88, y: 7,  dur: 24, delay: 3,   rot: -18 },
  { Icon: CreditCard,        size: 20, x: 12, y: 72, dur: 19, delay: 1.5, rot: 10  },
  { Icon: BarChart3,         size: 24, x: 91, y: 62, dur: 26, delay: 2,   rot: -6  },
  { Icon: QrCode,            size: 18, x: 4,  y: 42, dur: 21, delay: 4,   rot: 8   },
  { Icon: ChefHat,           size: 26, x: 80, y: 28, dur: 23, delay: 0.5, rot: -14 },
  { Icon: Receipt,           size: 18, x: 50, y: 4,  dur: 22, delay: 2.5, rot: 5   },
  { Icon: MonitorSmartphone, size: 20, x: 93, y: 85, dur: 27, delay: 1,   rot: -9  },
  { Icon: ShoppingCart,      size: 22, x: 18, y: 88, dur: 18, delay: 3.5, rot: 16  },
  { Icon: Clock,             size: 16, x: 62, y: 91, dur: 25, delay: 0.8, rot: -20 },
  { Icon: Layers,            size: 18, x: 40, y: 3,  dur: 20, delay: 4.5, rot: 10  },
  { Icon: Star,              size: 14, x: 74, y: 52, dur: 29, delay: 1.2, rot: 30  },
];


/* ────────────────────────────────────────────────────────
   LOGIN PAGE
───────────────────────────────────────────────────────── */
export function LoginPage() {
  const { login, signup, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showSplash, setShowSplash]           = useState(false);
  const [readyToRedirect, setReadyToRedirect] = useState(false);

  if (user && !showSplash)  return <Navigate to="/" replace />;
  if (readyToRedirect)       return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (activeTab === "login") await login(email, password);
      else                       await signup(name, email, password);
      setShowSplash(true);
      setTimeout(() => setReadyToRedirect(true), 3500);
    } catch (err) {
      setShowSplash(false);
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) return <GatheringSplash />;

  const inputClasses =
    "mt-2 block w-full rounded-xl border border-border bg-bg/50 px-4 py-3 " +
    "text-ink placeholder:text-muted/50 focus:border-accent focus:outline-none " +
    "focus:ring-1 focus:ring-accent transition-colors text-sm shadow-inner";

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center p-4 overflow-hidden">

      {/* ── Drift animation for background icons ── */}
      <style>{`
        @keyframes iconDrift {
          0%,100% { transform: translateY(0px) rotate(var(--irot)); }
          50%     { transform: translateY(-16px) rotate(calc(var(--irot) + 7deg)); }
        }
      `}</style>

      {/* ── Floating POS icons ── */}
      {BG_ICONS.map(({ Icon, size, x, y, dur, delay, rot }, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            left: `${x}%`,
            top: `${y}%`,
            opacity: 0.1,
            color: "var(--color-accent)",
            pointerEvents: "none",
            /* Use CSS var for rotation so the keyframe can reference it */
            ["--irot" as string]: `${rot}deg`,
            animation: `iconDrift ${dur}s ease-in-out ${delay}s infinite`,
          }}
        >
          <Icon size={size} />
        </div>
      ))}

      {/* ── Logo mark ── */}
      <div className="relative z-10 mb-6 flex flex-col items-center gap-2">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: "var(--color-accent)" }}
        >
          <Coffee size={28} className="text-white" />
        </div>
        <p
          className="text-[10px] font-bold uppercase tracking-[0.3em]"
          style={{ color: "var(--color-muted)" }}
        >
          Odoo POS Cafe
        </p>
      </div>

      {/* ── Auth card ── */}
      <section
        className="relative z-10 w-full max-w-sm rounded-[2rem] border p-8"
        style={{
          background: "var(--color-panel)",
          borderColor: "var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        {/* Tab pill switcher */}
        <div
          className="relative mb-7 flex w-full rounded-full p-1 border"
          style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
        >
          <div
            className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-transform duration-300 ease-out"
            style={{
              background: "var(--color-panel)",
              transform: activeTab === "login" ? "translateX(0)" : "translateX(100%)",
            }}
          />
          {(["login", "signup"] as AuthTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setError(null); }}
              className="relative z-10 flex-1 py-2.5 text-xs font-bold tracking-widest uppercase transition-colors"
              style={{ color: activeTab === tab ? "var(--color-accent)" : "var(--color-muted)" }}
            >
              {tab === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h2
            className="text-2xl font-black tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            {activeTab === "login" ? "Welcome back" : "Join the cafe"}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
            {activeTab === "login"
              ? "Sign in to open your session."
              : "Create your manager account."}
          </p>
        </div>

        {/* Form — only the essentials */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {activeTab === "signup" && (
            <label className="block text-sm font-medium" style={{ color: "var(--color-ink)" }}>
              Full Name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Manager name"
                className={inputClasses}
              />
            </label>
          )}

          <label className="block text-sm font-medium" style={{ color: "var(--color-ink)" }}>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@cafe.com"
              className={inputClasses}
            />
          </label>

          <label className="block text-sm font-medium" style={{ color: "var(--color-ink)" }}>
            Password
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClasses}
            />
          </label>

          {error && (
            <div
              className="rounded-xl p-3 text-center border"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
            >
              <p className="text-sm font-medium text-red-500">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "var(--color-accent)",
              boxShadow: "0 8px 24px rgba(193,91,61,0.25)",
            }}
          >
            {loading
              ? "Authenticating…"
              : activeTab === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>
      </section>
    </div>
  );
}
