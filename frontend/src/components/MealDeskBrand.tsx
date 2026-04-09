/**
 * MealDeskBrand.tsx
 * Faithful SVG recreation of the MealDesk logo mark.
 * - Background removed (transparent)
 * - Colors matched to website palette:
 *     dark warm: #1e1508 / #2a1e10
 *     accent orange/sienna: #c15b3d / #f97316
 *     cream icons: #d4c3a8 / #c8b89a
 * - Static variant for header (no animation)
 * - Animated variant for splash / hero
 */

/* ─────────────────────────────────────────────
   CORE SVG LOGO MARK
   Faithful recreation of the illustrated M mark:
   • Dark circle backdrop
   • Bold "M" letterform with sienna depth shadow
   • Fork (left), Knife (right, diagonal)
   • Serving cloche (lower-left inside circle)
   • Floating receipt + QR code (upper-right)
   • Credit card overlapping receipt
   • T-coin badge (upper-right circle edge)
───────────────────────────────────────────── */
export function MealDeskLogoMark({
  size = 40,
  animated = false,
  className = "",
}: {
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <>
      {animated && (
        <style>{`
          @keyframes md-float {
            0%,100% { transform: translateY(0) rotate(-1deg); }
            50%      { transform: translateY(-7px) rotate(1.5deg); }
          }
          @keyframes md-coin-pulse {
            0%,100% { opacity: 1; r: 9.5; }
            50%      { opacity: 0.85; r: 10.5; }
          }
        `}</style>
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={animated ? { animation: "md-float 4s ease-in-out infinite" } : undefined}
      >
        {/* ── Receipt paper (upper-right, rotated, partially outside circle) ── */}
        <g transform="rotate(22, 88, 32)">
          <rect x="74" y="5" width="28" height="46" rx="2.5" fill="#c8b89a" />
          {/* Text lines on receipt */}
          <rect x="78" y="12"  width="20" height="2.5" rx="1" fill="#7a6352" opacity="0.8" />
          <rect x="78" y="18"  width="15" height="2"   rx="1" fill="#7a6352" opacity="0.65" />
          <rect x="78" y="23"  width="18" height="2"   rx="1" fill="#7a6352" opacity="0.5" />
          {/* QR code area */}
          <rect x="78" y="29" width="17" height="17" rx="1.5" fill="#1e1508" />
          <rect x="79.5" y="30.5" width="5" height="5" rx="0.7" fill="#c8b89a" />
          <rect x="86"   y="30.5" width="5" height="5" rx="0.7" fill="#c8b89a" />
          <rect x="79.5" y="37"   width="5" height="5" rx="0.7" fill="#c8b89a" />
          <rect x="86"   y="37"   width="5" height="5" rx="0.7" fill="#c8b89a" />
          <rect x="92"   y="30.5" width="2" height="2.5" rx="0.5" fill="#c8b89a" />
          <rect x="92"   y="34.5" width="2" height="7"   rx="0.5" fill="#c8b89a" />
          <rect x="79.5" y="43"   width="13" height="2"  rx="0.5" fill="#c8b89a" />
        </g>

        {/* ── Credit card (overlapping receipt, slightly below) ── */}
        <g transform="rotate(18, 96, 58)">
          <rect x="82" y="47" width="26" height="16" rx="2.5" fill="#1e1508" />
          <rect x="82" y="54" width="26" height="4"  fill="#c15b3d" />
          <rect x="84.5" y="59" width="9" height="3.5" rx="1" fill="#d4c3a8" opacity="0.4" />
        </g>

        {/* ── MAIN CIRCLE (dark warm backdrop) ── */}
        <circle cx="52" cy="62" r="46" fill="#1e1508" />
        {/* Subtle inner ring for woodcut depth */}
        <circle cx="52" cy="62" r="44" fill="none" stroke="#2a1e10" strokeWidth="2.5" opacity="0.55" />

        {/* ── T-coin badge (upper-right edge of circle) ── */}
        <circle cx="84" cy="24" r="9.5" fill="#c15b3d" />
        <circle cx="84" cy="24" r="8"   fill="none" stroke="#d4c3a8" strokeWidth="0.8" opacity="0.35" />
        <text
          x="84" y="28.5"
          textAnchor="middle"
          fontFamily="Impact, 'Arial Black', sans-serif"
          fontSize="11"
          fontWeight="900"
          fill="#d4c3a8"
        >T</text>

        {/* ── Fork (left side of circle) ── */}
        {/* Handle */}
        <rect x="18" y="57" width="4.5" height="26" rx="2.25" fill="#d4c3a8" opacity="0.88" />
        {/* Neck connector arch */}
        <path d="M18 57 Q16 51 18.5 48 L22 48 Q24.5 51 22.5 57 Z" fill="#d4c3a8" opacity="0.88" />
        {/* Tines */}
        <rect x="17"   y="32" width="3"   height="18" rx="1.5" fill="#d4c3a8" opacity="0.88" />
        <rect x="21.5" y="30" width="3"   height="20" rx="1.5" fill="#d4c3a8" opacity="0.88" />
        <rect x="26"   y="33" width="3"   height="16" rx="1.5" fill="#d4c3a8" opacity="0.85" />

        {/* ── Serving cloche / dome (lower-center-left inside circle) ── */}
        {/* Steam wisps */}
        <path d="M36 47 Q34 44 36 41 Q38 38 36 35" stroke="#d4c3a8" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M42 45 Q40 42 42 39 Q44 36 42 33" stroke="#d4c3a8" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.6" />
        {/* Dome top knob */}
        <circle cx="41" cy="49" r="3.5" fill="#d4c3a8" opacity="0.9" />
        {/* Dome arc */}
        <path d="M23 63 Q23 49 41 49 Q59 49 59 63 Z" fill="#d4c3a8" opacity="0.9" />
        {/* Plate rim */}
        <rect x="21" y="63" width="40" height="5.5" rx="2.75" fill="#d4c3a8" opacity="0.9" />

        {/* ── Knife (right side, diagonal) ── */}
        <g transform="rotate(-12, 77, 56)">
          {/* Handle */}
          <rect x="74" y="58" width="4.5" height="24" rx="2.25" fill="#d4c3a8" opacity="0.88" />
          {/* Guard / bolster */}
          <rect x="73" y="55.5" width="6.5" height="3.5" rx="1" fill="#d4c3a8" opacity="0.9" />
          {/* Blade */}
          <path d="M74 55 L78.5 55 L77 28 Q75 25 73.5 28 Z" fill="#d4c3a8" opacity="0.88" />
          {/* Blade edge hint */}
          <path d="M74.2 54 L73.8 29" stroke="#b89a80" strokeWidth="0.7" opacity="0.45" />
        </g>

        {/* ── M letterform — sienna depth shadow (offset) ── */}
        <text
          x="55" y="85"
          textAnchor="middle"
          fontFamily="Impact, 'Arial Black', 'Franklin Gothic Heavy', sans-serif"
          fontSize="54"
          fontWeight="900"
          fill="#c15b3d"
          opacity="0.88"
        >M</text>

        {/* ── M letterform — cream main layer ── */}
        <text
          x="52" y="82"
          textAnchor="middle"
          fontFamily="Impact, 'Arial Black', 'Franklin Gothic Heavy', sans-serif"
          fontSize="54"
          fontWeight="900"
          fill="#d4c3a8"
        >M</text>
      </svg>
    </>
  );
}

/* ─────────────────────────────────────────────
   WORDMARK  — "Meal" + gradient "Desk"
───────────────────────────────────────────── */
export function MealDeskWordmark({
  size = "text-lg",
  showTagline = false,
  lightMode = false,
}: {
  size?: string;
  showTagline?: boolean;
  lightMode?: boolean;
}) {
  return (
    <div className="flex flex-col justify-center">
      <span
        className={`font-black tracking-tight leading-none select-none ${size}`}
        style={{ color: lightMode ? "white" : "var(--color-ink)" }}
      >
        Meal
        <span
          style={{
            background: "linear-gradient(135deg, #c15b3d 0%, #f97316 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Desk
        </span>
      </span>
      {showTagline && (
        <span
          className="text-[9px] font-bold uppercase tracking-[0.22em] mt-0.5 select-none"
          style={{ color: lightMode ? "rgba(255,255,255,0.55)" : "var(--color-muted)" }}
        >
          Powering modern restaurant flow
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   BRAND COMBO — Icon + Wordmark side-by-side
   Use this everywhere in headers / panels.
   showTagline=false by default (tagline only in splash).
───────────────────────────────────────────── */
export function MealDeskBrand({
  size = 36,
  showTagline = false,
  animated = false,
  lightMode = false,
  className = "",
}: {
  size?: number;
  showTagline?: boolean;
  animated?: boolean;
  lightMode?: boolean;
  className?: string;
}) {
  // Wordmark font size is roughly 55% of icon size
  const wSize =
    size >= 72 ? "text-3xl" :
    size >= 52 ? "text-2xl" :
    size >= 40 ? "text-xl"  :
    size >= 30 ? "text-lg"  :
    size >= 22 ? "text-base" :
    "text-sm";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <MealDeskLogoMark size={size} animated={animated} />
      <MealDeskWordmark size={wSize} showTagline={showTagline} lightMode={lightMode} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   SPLASH BRAND  — Large animated logo + tagline
   Used ONLY in the post-login transition splash.
   Has pulsing rings, float animation, tagline.
───────────────────────────────────────────── */
export function MealDeskSplashBrand({ size = 90 }: { size?: number }) {
  return (
    <>
      <style>{`
        @keyframes md-ring-pulse {
          0%   { transform:translate(-50%,-50%) scale(0.85); opacity:0.7; }
          100% { transform:translate(-50%,-50%) scale(2.4);  opacity:0; }
        }
        @keyframes md-logo-reveal {
          0%   { transform:translate(-50%,-50%) scale(0.65) rotate(-12deg); opacity:0; }
          65%  { transform:translate(-50%,-50%) scale(1.06)  rotate(2deg);  opacity:1; }
          100% { transform:translate(-50%,-50%) scale(1)     rotate(0deg);  opacity:1; }
        }
        @keyframes md-badge-pop {
          0%   { transform:scale(0) rotate(-25deg); opacity:0; }
          65%  { transform:scale(1.22)rotate(5deg); opacity:1; }
          100% { transform:scale(1)   rotate(0deg); opacity:1; }
        }
        @keyframes md-text-up {
          0%   { opacity:0; transform:translateY(18px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes md-tagline-up {
          0%   { opacity:0; transform:translateY(10px); }
          100% { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Pulsing rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute", top: "50%", left: "50%",
            width: size * 1.6, height: size * 1.6,
            borderRadius: "50%",
            border: "1.5px solid var(--color-accent)",
            animation: `md-ring-pulse 1.9s ${i * 0.42}s ease-out infinite`,
            opacity: 0,
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Logo mark */}
      <div
        style={{
          position: "absolute", top: "50%", left: "50%",
          animation: "md-logo-reveal 0.85s 0.2s both ease-out",
        }}
      >
        <MealDeskLogoMark size={size} animated />
      </div>

      {/* "Welcome" text */}
      <div
        style={{
          position: "absolute",
          bottom: "30%",
          textAlign: "center",
          animation: "md-text-up 0.65s 1.1s both ease",
        }}
      >
        <h2
          style={{
            fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px",
            color: "var(--color-ink)", marginBottom: 6,
          }}
        >
          Welcome to MealDesk
        </h2>
        <p
          style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "var(--color-accent)",
            animation: "md-tagline-up 0.5s 1.45s both ease",
          }}
        >
          Powering modern restaurant flow
        </p>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   SPLIT REVEAL BRAND  — MD to MealDesk
   Used for landing open and login splash.
───────────────────────────────────────────── */
export function MealDeskSplitReveal({
  size = 96,
  lightMode = false,
}: {
  size?: number;
  lightMode?: boolean;
}) {
  const fontSize = size >= 120 ? "text-8xl" : size >= 96 ? "text-7xl" : "text-6xl";

  return (
    <>
      <style>{`
        @keyframes md-reveal-md-left {
          0%   { opacity: 0; transform: translateX(-28px) scale(0.88); }
          55%  { opacity: 1; transform: translateX(0) scale(1.04); }
          100% { opacity: 0; transform: translateX(0) scale(0.94); }
        }
        @keyframes md-reveal-md-right {
          0%   { opacity: 0; transform: translateX(28px) scale(0.88); }
          55%  { opacity: 1; transform: translateX(0) scale(1.04); }
          100% { opacity: 0; transform: translateX(0) scale(0.94); }
        }
        @keyframes md-reveal-word-left {
          0%   { opacity: 0; transform: translateX(30px) scaleX(0.65); filter: blur(3px); }
          60%  { opacity: 1; transform: translateX(0) scaleX(1); filter: blur(0); }
          100% { opacity: 1; transform: translateX(0) scaleX(1); filter: blur(0); }
        }
        @keyframes md-reveal-word-right {
          0%   { opacity: 0; transform: translateX(-30px) scaleX(0.65); filter: blur(3px); }
          60%  { opacity: 1; transform: translateX(0) scaleX(1); filter: blur(0); }
          100% { opacity: 1; transform: translateX(0) scaleX(1); filter: blur(0); }
        }
        @keyframes md-reveal-line {
          from { width: 0; opacity: 0; }
          to { width: 100%; opacity: 1; }
        }
      `}</style>

      <div className="flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center" style={{ minHeight: `${size * 0.95}px` }}>
          <span
            className={`${fontSize} font-black tracking-tight select-none`}
            style={{
              color: lightMode ? "white" : "var(--color-ink)",
              animation: "md-reveal-md-left 0.85s ease both",
            }}
          >
            M
          </span>
          <span
            className={`${fontSize} font-black tracking-tight select-none ml-4`}
            style={{
              color: "var(--color-accent)",
              animation: "md-reveal-md-right 0.85s ease both",
            }}
          >
            D
          </span>

          <div
            className="absolute inset-0 flex items-center justify-center gap-0"
            style={{ pointerEvents: "none" }}
          >
            <span
              className={`${fontSize} font-black tracking-tight select-none`}
              style={{
                marginRight: `${size * 0.32}px`,
                color: lightMode ? "white" : "var(--color-ink)",
                opacity: 0,
                animation: "md-reveal-word-left 0.95s 0.72s ease both",
              }}
            >
              Meal
            </span>
            <span
              className={`${fontSize} font-black tracking-tight select-none`}
              style={{
                marginLeft: `${size * 0.28}px`,
                color: "var(--color-accent)",
                opacity: 0,
                animation: "md-reveal-word-right 0.95s 0.72s ease both",
              }}
            >
              Desk
            </span>
          </div>
        </div>

        <div
          className="mt-4 h-[3px] rounded-full"
          style={{
            width: `${size * 1.6}px`,
            background: "linear-gradient(90deg, var(--color-accent), #f97316)",
            opacity: 0,
            animation: "md-reveal-line 0.7s 1.05s ease both",
          }}
        />
      </div>
    </>
  );
}
