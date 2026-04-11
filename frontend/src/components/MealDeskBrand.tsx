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
   • Phase 1: M + D slide in touching each other (no gap)
   • Phase 2: Letters cascade in one-by-one with blur+scale
   • Desk letters get an accent glow pulse
   • Accent underline scans left→right with shimmer
───────────────────────────────────────────── */
export function MealDeskSplitReveal({
  size = 96,
  lightMode = false,
}: {
  size?: number;
  lightMode?: boolean;
}) {
  const fontSize = size >= 120 ? "text-8xl" : size >= 96 ? "text-7xl" : "text-6xl";

  const inkColor = lightMode ? "white" : "var(--color-ink)";
  const accentColor = "var(--color-accent)";

  return (
    <>
      <style>{`
        /* Phase 1: MD initials touch and fade */
        @keyframes md-init-m {
          0%   { opacity:0; transform: translateX(-20px) scale(0.8) rotate(-5deg); filter:blur(8px); }
          52%  { opacity:1; transform: translateX(0) scale(1.06) rotate(0.8deg);  filter:blur(0); }
          78%  { opacity:1; transform: translateX(0) scale(1) rotate(0deg); }
          100% { opacity:0; transform: translateX(0) scale(0.9); filter:blur(3px); }
        }
        @keyframes md-init-d {
          0%   { opacity:0; transform: translateX(20px) scale(0.8) rotate(5deg);  filter:blur(8px); }
          52%  { opacity:1; transform: translateX(0) scale(1.06) rotate(-0.8deg); filter:blur(0); }
          78%  { opacity:1; transform: translateX(0) scale(1) rotate(0deg); }
          100% { opacity:0; transform: translateX(0) scale(0.9); filter:blur(3px); }
        }
        /* Phase 2: each letter cascades in */
        @keyframes md-letter-in {
          0%   { opacity:0; transform: translateY(20px) scale(0.72); filter:blur(8px); }
          58%  { opacity:1; transform: translateY(-2px) scale(1.05); filter:blur(0); }
          100% { opacity:1; transform: translateY(0) scale(1); filter:blur(0); }
        }
        /* Desk letters glow pulse */
        @keyframes md-glow-letter {
          0%,100% { text-shadow: 0 0 0 transparent; }
          50%      { text-shadow: 0 0 18px rgba(249,115,22,0.75), 0 0 36px rgba(193,91,61,0.35); }
        }
        /* Underline scans right */
        @keyframes md-scan-line {
          0%   { transform: scaleX(0); transform-origin: left center; opacity:0; }
          15%  { opacity:1; }
          100% { transform: scaleX(1); transform-origin: left center; opacity:1; }
        }
        /* Shimmer on underline */
        @keyframes md-shimmer-bar {
          0%   { left:-60%; }
          100% { left:160%; }
        }
      `}</style>

      <div className="flex flex-col items-center justify-center">
        {/* ── Height container so phase 1 and 2 overlap ── */}
        <div
          className="relative flex items-center justify-center"
          style={{ minHeight: `${size * 0.95}px` }}
        >
          {/* ── Phase 1: M and D initials (touching) ── */}
          <span
            className={`${fontSize} font-black select-none leading-none`}
            style={{
              color: inkColor,
              letterSpacing: "-0.05em",
              animation: "md-init-m 0.88s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            M
          </span>
          {/* D sits directly next to M — marginLeft:-0.03em closes any gap */}
          <span
            className={`${fontSize} font-black select-none leading-none`}
            style={{
              color: accentColor,
              letterSpacing: "-0.05em",
              marginLeft: "-0.03em",
              animation: "md-init-d 0.88s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            D
          </span>

          {/* ── Phase 2: Full wordmark (Meal + Desk) letter cascade ── */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: "none" }}
            aria-hidden="true"
          >
            {/* "Meal" — staggered letters */}
            {(["M", "e", "a", "l"] as const).map((ch, i) => (
              <span
                key={`m-${i}`}
                className={`${fontSize} font-black select-none leading-none`}
                style={{
                  color: inkColor,
                  letterSpacing: "-0.05em",
                  marginLeft: i === 0 ? 0 : "-0.02em",
                  opacity: 0,
                  animation: `md-letter-in 0.52s ${0.82 + i * 0.065}s cubic-bezier(0.22,1,0.36,1) both`,
                }}
              >
                {ch}
              </span>
            ))}
            {/* "Desk" — staggered letters with glow */}
            {(["D", "e", "s", "k"] as const).map((ch, i) => (
              <span
                key={`d-${i}`}
                className={`${fontSize} font-black select-none leading-none`}
                style={{
                  color: accentColor,
                  letterSpacing: "-0.05em",
                  /* Meal's last letter + Desk's D should touch */
                  marginLeft: i === 0 ? "-0.02em" : "-0.02em",
                  opacity: 0,
                  animation: `md-letter-in 0.52s ${1.08 + i * 0.065}s cubic-bezier(0.22,1,0.36,1) both, md-glow-letter 2.4s ${1.6 + i * 0.12}s ease-in-out infinite`,
                }}
              >
                {ch}
              </span>
            ))}
          </div>
        </div>

        {/* ── Accent scan-line underline ── */}
        <div
          style={{
            position: "relative",
            width: `${size * 1.38}px`,
            height: "3px",
            borderRadius: "999px",
            background: `linear-gradient(90deg, ${accentColor}, #f97316, #fbbf24)`,
            marginTop: "10px",
            overflow: "hidden",
            opacity: 0,
            animation: "md-scan-line 0.6s 1.42s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 0,
              width: "45%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.72), transparent)",
              animation: "md-shimmer-bar 1.1s 2.0s ease both",
            }}
          />
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   MD LOADER  — Minimal loading indicator
   Two bold initials that breathe independently
   + a thin accent bar that pulses beneath.
   Deliberately NOT the full split-reveal;
   this is the lightweight in-page spinner.
───────────────────────────────────────────── */
export function MealDeskLoader({
  label,
  size = "md",
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const fontSize =
    size === "lg" ? "text-5xl" : size === "sm" ? "text-2xl" : "text-4xl";
  const barW =
    size === "lg" ? "w-16" : size === "sm" ? "w-8" : "w-12";

  return (
    <>
      <style>{`
        @keyframes mdl-m-pulse {
          0%,100% { opacity:1;    transform: scaleY(1)    translateY(0px); }
          45%      { opacity:0.75; transform: scaleY(0.93) translateY(1px); }
        }
        @keyframes mdl-d-pulse {
          0%,100% { opacity:1;   transform: scaleY(1)   translateY(0px); }
          55%      { opacity:0.7; transform: scaleY(0.9) translateY(2px); }
        }
        @keyframes mdl-bar-pulse {
          0%,100% { transform: scaleX(0.35); opacity: 0.5; }
          50%      { transform: scaleX(1);    opacity: 1;   }
        }
        @keyframes mdl-label-fade {
          0%,100% { opacity:0.45; }
          50%      { opacity:1; }
        }
      `}</style>

      <div className="flex flex-col items-center gap-3">
        <div className={`flex items-baseline leading-none select-none ${fontSize}`}
          style={{ gap: 0 }}
        >
          <span
            className="font-black"
            style={{
              color: "var(--color-accent)",
              letterSpacing: "-0.04em",
              display: "inline-block",
              animation: "mdl-m-pulse 1.6s ease-in-out infinite",
            }}
          >M</span>
          <span
            className="font-black"
            style={{
              color: "var(--color-ink)",
              opacity: 0.65,
              letterSpacing: "-0.04em",
              display: "inline-block",
              animation: "mdl-d-pulse 1.6s 0.22s ease-in-out infinite",
            }}
          >D</span>
        </div>

        <div
          className={`${barW} h-[3px] rounded-full origin-center`}
          style={{
            background: "linear-gradient(90deg, var(--color-accent), #f97316)",
            animation: "mdl-bar-pulse 1.6s 0.08s ease-in-out infinite",
          }}
        />

        {label && (
          <p
            className="text-[10px] font-black uppercase tracking-[0.22em]"
            style={{
              color: "var(--color-muted)",
              animation: "mdl-label-fade 1.6s ease-in-out infinite",
            }}
          >
            {label}
          </p>
        )}
      </div>
    </>
  );
}
