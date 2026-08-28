import React, { useId } from "react"
import { cn } from "@/lib/utils"
import {
  type ChotuConfig,
  type ChotuState,
  DEFAULT_CHOTU_CONFIG,
} from "@/lib/chotu-config"
import { type ChouPose } from "@/context/chou-presence-context"

export interface ChotuAvatarProps {
  config?: ChotuConfig
  state?: ChotuState
  pose?: ChouPose | "dusting" | "billing" | "expiry" | "packaging" | "shutter" | "ledger" | "incoming" | "growth" | "cashbox" | "idle"
  className?: string
  onClick?: () => void
  interactive?: boolean
  showAura?: boolean
}

export function ChotuAvatar({
  config = DEFAULT_CHOTU_CONFIG,
  state = "idle",
  pose,
  className,
  onClick,
  interactive = true,
  showAura = true,
}: ChotuAvatarProps) {
  const uid = useId().replace(/:/g, "")
  const capColor = config.capColor || "#15803D"
  const vestColor = config.vestColor || "#2563EB"
  const outfit = config.outfit || "traditional"
  const size = config.size || "medium"

  // Scale map
  const sizeDimensions = {
    small: { width: 56, height: 72 },
    medium: { width: 80, height: 104 },
    large: { width: 110, height: 142 },
  }[size]

  // Active pose determination (pose prop takes precedence if specific, else mapped from state)
  const activePose = pose || (
    state === "listening" ? "listening" :
    state === "thinking" ? "thinking" :
    state === "speaking" ? "speaking" :
    state === "success" ? "success" :
    "idle"
  )

  const isListening = state === "listening" || activePose === "listening"
  const isThinking = state === "thinking" || activePose === "thinking" || activePose === "low_stock"
  const isSpeaking = state === "speaking" || activePose === "speaking"
  const isSuccess = state === "success" || activePose === "sale_done" || activePose === "growth"
  const isError = state === "error"

  // Gradients IDs
  const skinGradId = `skinGrad_${uid}`
  const skinShadowId = `skinShadow_${uid}`
  const hairGradId = `hairGrad_${uid}`
  const hairSheenId = `hairSheen_${uid}`
  const capGradId = `capGrad_${uid}`
  const visorGradId = `visorGrad_${uid}`
  const vestGradId = `vestGrad_${uid}`
  const vestLapelId = `vestLapel_${uid}`
  const genieTailId = `genieTail_${uid}`
  const genieCoreId = `genieCore_${uid}`
  const softGlowId = `softGlow_${uid}`
  const dropShadowId = `dropShadow_${uid}`

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center select-none transition-all duration-300",
        interactive && "cursor-pointer active:scale-95 hover:scale-105",
        config.animationIntensity === "expressive" && "animate-bounce-subtle",
        className
      )}
      style={{
        width: sizeDimensions.width,
        height: sizeDimensions.height,
      }}
    >
      {/* 1. Magical Atmospheric Aura Glow */}
      {showAura && (
        <div
          className={cn(
            "absolute -inset-2 rounded-full blur-xl pointer-events-none transition-all duration-500",
            isListening && "bg-cyan-400/50 scale-125 animate-pulse",
            isThinking && "bg-amber-400/45 scale-110",
            isSpeaking && "bg-sky-500/45 scale-120 animate-pulse",
            isSuccess && "bg-emerald-400/60 scale-130",
            isError && "bg-rose-400/50 scale-110",
            !isListening && !isThinking && !isSpeaking && !isSuccess && !isError && "bg-sky-400/25 scale-100"
          )}
        />
      )}

      {/* 2. Vector SVG Mascot */}
      <svg
        viewBox="0 0 200 240"
        className={cn(
          "w-full h-full drop-shadow-xl overflow-visible transition-all duration-300",
          isListening && "filter drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]",
          isSuccess && "drop-shadow-[0_0_14px_rgba(34,197,94,0.6)]"
        )}
      >
        <defs>
          {/* Skin */}
          <linearGradient id={skinGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE4C7" />
            <stop offset="60%" stopColor="#FED7AA" />
            <stop offset="100%" stopColor="#FDBA74" />
          </linearGradient>
          <linearGradient id={skinShadowId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.6" />
          </linearGradient>

          {/* Hair */}
          <linearGradient id={hairGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3D261D" />
            <stop offset="50%" stopColor="#26160F" />
            <stop offset="100%" stopColor="#140B07" />
          </linearGradient>
          <linearGradient id={hairSheenId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6B4232" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3D261D" stopOpacity="0" />
          </linearGradient>

          {/* Cap */}
          <linearGradient id={capGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={capColor} stopOpacity="0.85" />
            <stop offset="40%" stopColor={capColor} />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>
          <linearGradient id={visorGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={capColor} />
            <stop offset="100%" stopColor="#0F381E" />
          </linearGradient>

          {/* Vest */}
          <linearGradient id={vestGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={vestColor} stopOpacity="0.85" />
            <stop offset="50%" stopColor={vestColor} />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
          <linearGradient id={vestLapelId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor={vestColor} />
          </linearGradient>

          {/* Genie Tail */}
          <linearGradient id={genieTailId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#0284C7" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0369A1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={genieCoreId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
          </linearGradient>

          {/* Props Gradients */}
          <linearGradient id={`goldCoin_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="60%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id={`taka500_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <linearGradient id={`taka100_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id={`dusterGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>

          {/* Filters */}
          <filter id={softGlowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id={dropShadowId} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Ambient Tail Glow */}
        <g className="animate-pulse" opacity="0.6">
          <circle cx="100" cy="185" r="30" fill="#38BDF8" filter={`url(#${softGlowId})`} opacity="0.35" />
        </g>

        {/* 1. Sinuous Glowing Genie Tail */}
        <g filter={`url(#${dropShadowId})`}>
          <path
            d="M 86 160 C 76 182 64 195 50 208 C 38 220 54 235 72 228 C 96 220 114 198 116 160 Z"
            fill={`url(#${genieTailId})`}
          />
          <path
            d="M 94 162 C 84 182 74 196 62 210 C 56 216 64 222 72 218 C 88 210 104 192 106 162 Z"
            fill={`url(#${genieCoreId})`}
            opacity="0.75"
          />
          <path
            d="M 90 166 Q 78 190 62 208 T 52 222"
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 6"
            opacity="0.8"
          />
          <circle cx="56" cy="214" r="2.5" fill="#FFFFFF" />
          <circle cx="42" cy="198" r="2" fill="#BAE6FD" />
          <polygon points="120,188 122,182 124,188 130,190 124,192 122,198 120,192 114,190" fill="#FDE047" opacity="0.8" />
        </g>

        {/* 2. Torso & Clothes */}
        <g id="torso" filter={`url(#${dropShadowId})`}>
          {/* Crisp White T-Shirt */}
          <path d="M 72 126 L 128 126 L 120 165 C 110 167 90 167 80 165 Z" fill="#FFFFFF" />
          <path d="M 95 130 Q 100 148 96 164" stroke="#E2E8F0" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 85 142 Q 88 152 86 162" stroke="#E2E8F0" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Vest Panels (Left & Right) */}
          <path d="M 68 126 L 88 126 L 85 165 L 64 162 C 65 148 66 136 68 126 Z" fill={`url(#${vestGradId})`} />
          <path d="M 132 126 L 112 126 L 115 165 L 136 162 C 135 148 134 136 132 126 Z" fill={`url(#${vestGradId})`} />
          <path d="M 88 126 L 84 152 L 85 165 L 88 126 Z" fill={`url(#${vestLapelId})`} />
          <path d="M 112 126 L 116 152 L 115 165 L 112 126 Z" fill={`url(#${vestLapelId})`} />

          {/* Outfit Specific Details */}
          {outfit === "traditional" && (
            <g>
              {/* Gamcha Accent */}
              <path d="M 66 126 Q 62 144 64 162 Q 72 164 74 158 Q 70 140 72 126 Z" fill="#EF4444" />
              <path d="M 65 134 L 73 136 M 64 144 L 72 146" stroke="#FFFFFF" strokeWidth="1.5" />
            </g>
          )}

          {outfit === "apron" && (
            <g>
              <path d="M 80 126 L 120 126 L 116 165 L 84 165 Z" fill="#059669" />
              <rect x="88" y="142" width="24" height="16" rx="3" fill="#047857" />
              <path d="M 92 146 L 108 146" stroke="#A7F3D0" strokeWidth="1.5" />
            </g>
          )}
        </g>

        {/* 3. Pose-Specific Arms & Props */}
        {activePose === "billing" ? (
          // Billing: Fan of Taka banknotes & glowing invoice
          <g id="pose-billing" filter={`url(#${dropShadowId})`}>
            <path d="M 70 132 C 54 136 44 148 48 160 C 52 166 60 164 66 156 C 70 148 72 142 74 136 Z" fill={`url(#${skinGradId})`} />
            <g transform="translate(32, 126) rotate(-15)">
              <rect x="0" y="0" width="22" height="12" rx="1.5" fill="#DB2777" stroke="#FDF2F8" strokeWidth="0.75" transform="rotate(-15)" />
              <rect x="3" y="0" width="22" height="12" rx="1.5" fill={`url(#taka500_${uid})`} stroke="#F0FDF4" strokeWidth="0.75" />
              <rect x="6" y="0" width="22" height="12" rx="1.5" fill={`url(#taka100_${uid})`} stroke="#EFF6FF" strokeWidth="0.75" transform="rotate(15)" />
            </g>
            <circle cx="50" cy="150" r="5" fill={`url(#${skinGradId})`} />

            <path d="M 130 130 C 144 132 152 142 156 154 C 158 160 152 164 146 160 C 138 152 134 144 126 136 Z" fill={`url(#${skinGradId})`} />
            <circle cx="150" cy="152" r="5.5" fill={`url(#${skinGradId})`} />
            <g transform="translate(142, 110)">
              <path d="M 0 0 L 28 0 C 30 0 32 2 32 4 L 32 38 Q 28 36 24 38 Q 20 36 16 38 Q 12 36 8 38 Q 4 36 0 38 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
              <circle cx="16" cy="20" r="6" fill="#22C55E" />
              <polyline points="13,20 15,22 19,18" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
        ) : activePose === "inventory" || activePose === "dusting" ? (
          // Dusting / Shelves tidying
          <g id="pose-dusting" filter={`url(#${dropShadowId})`}>
            <path d="M 68 130 C 52 136 48 148 54 158 C 58 162 64 160 68 154 C 70 148 68 142 74 136 Z" fill={`url(#${skinGradId})`} />
            <circle cx="56" cy="156" r="5" fill={`url(#${skinGradId})`} />

            <path d="M 130 130 C 146 132 156 122 162 110 C 166 104 160 98 154 104 C 146 112 140 122 128 136 Z" fill={`url(#${skinGradId})`} />
            <circle cx="160" cy="106" r="6" fill={`url(#${skinGradId})`} />
            <g transform="translate(150, 65) rotate(25)">
              <rect x="18" y="45" width="4" height="35" rx="2" fill="#92400E" />
              <path d="M 10 45 C 0 35 4 10 20 5 C 36 10 40 35 30 45 Z" fill={`url(#dusterGrad_${uid})`} />
            </g>
          </g>
        ) : activePose === "low_stock" || activePose === "expiry" ? (
          // Magnifying glass inspecting product
          <g id="pose-expiry" filter={`url(#${dropShadowId})`}>
            <path d="M 70 132 C 54 136 46 148 50 160 C 54 166 62 164 68 156 C 72 148 74 142 76 136 Z" fill={`url(#${skinGradId})`} />
            <circle cx="48" cy="154" r="5" fill={`url(#${skinGradId})`} />
            <g transform="translate(24, 128)">
              <rect x="0" y="0" width="22" height="30" rx="3" fill="#EA580C" stroke="#C2410C" strokeWidth="1" />
              <circle cx="11" cy="-4" r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x="9" y="0" fontSize="10" fill="#FFFFFF" fontWeight="bold" fontFamily="sans-serif">!</text>
            </g>

            <path d="M 130 130 C 142 136 140 152 126 156 C 114 158 106 148 94 138 Z" fill={`url(#${skinGradId})`} />
            <circle cx="94" cy="138" r="5" fill={`url(#${skinGradId})`} />
            <g transform="translate(52, 114) rotate(-30)">
              <circle cx="20" cy="20" r="16" fill="#E0F2FE" fillOpacity="0.4" stroke="#0F172A" strokeWidth="3" />
              <rect x="34" y="18" width="18" height="4.5" rx="2" fill="#475569" stroke="#0F172A" strokeWidth="1" />
            </g>
          </g>
        ) : activePose === "baki" || activePose === "ledger" ? (
          // Writing in Red Khata
          <g id="pose-ledger" filter={`url(#${dropShadowId})`}>
            <g transform="translate(68, 126) rotate(-8)">
              <rect x="0" y="0" width="36" height="46" rx="3" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5" />
              <rect x="0" y="0" width="6" height="46" rx="1" fill="#FACC15" />
              <text x="16" y="21" fontSize="7" fill="#991B1B" fontWeight="bold" fontFamily="sans-serif">খাতা</text>
            </g>
            <path d="M 68 130 C 56 138 58 152 68 158 C 74 160 80 156 76 148 C 72 142 70 136 72 132 Z" fill={`url(#${skinGradId})`} />
            <circle cx="72" cy="154" r="5" fill={`url(#${skinGradId})`} />

            <path d="M 130 130 C 142 136 134 154 116 156 C 110 158 106 150 110 144 C 118 138 124 134 126 130 Z" fill={`url(#${skinGradId})`} />
            <circle cx="110" cy="148" r="5" fill={`url(#${skinGradId})`} />
            <g transform="translate(108, 134) rotate(-35)">
              <rect x="0" y="0" width="4" height="24" rx="1.5" fill="#FDE047" stroke="#78350F" strokeWidth="0.5" />
            </g>
          </g>
        ) : activePose === "cashbox" ? (
          // Counting Gold Coins & Cashbox
          <g id="pose-cashbox" filter={`url(#${dropShadowId})`}>
            <g transform="translate(65, 140)">
              <rect x="0" y="12" width="70" height="28" rx="3" fill="#64748B" stroke="#1E293B" strokeWidth="1" />
              <ellipse cx="16" cy="12" rx="7" ry="2.5" fill={`url(#goldCoin_${uid})`} />
              <ellipse cx="16" cy="9.5" rx="7" ry="2.5" fill={`url(#goldCoin_${uid})`} />
              <ellipse cx="16" cy="7" rx="7" ry="2.5" fill={`url(#goldCoin_${uid})`} />
            </g>
            <path d="M 68 130 C 58 136 62 148 76 150 C 80 150 84 144 80 140 C 76 136 72 134 72 130 Z" fill={`url(#${skinGradId})`} />
            <circle cx="80" cy="144" r="4.5" fill={`url(#${skinGradId})`} />

            <path d="M 130 130 C 140 136 136 148 122 150 C 118 150 114 144 118 140 C 122 136 126 134 126 130 Z" fill={`url(#${skinGradId})`} />
            <circle cx="120" cy="144" r="4.5" fill={`url(#${skinGradId})`} />
            <ellipse cx="100" cy="134" rx="5" ry="5" fill={`url(#goldCoin_${uid})`} stroke="#FEF08A" strokeWidth="0.75" />
          </g>
        ) : activePose === "sale_done" || activePose === "packaging" ? (
          // Packaging grocery bag
          <g id="pose-packaging" filter={`url(#${dropShadowId})`}>
            <g transform="translate(74, 134)">
              <path d="M 4 14 L 48 14 L 44 54 L 8 54 Z" fill="#D97706" stroke="#92400E" strokeWidth="1" />
              <circle cx="26" cy="34" r="7" fill="#16A34A" />
              <rect x="12" y="2" width="8" height="14" rx="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
              <path d="M 16 14 C 16 6 36 6 36 14" fill="none" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <path d="M 68 130 C 56 136 60 152 74 156 C 80 158 84 152 80 148 C 74 144 72 138 72 134 Z" fill={`url(#${skinGradId})`} />
            <circle cx="80" cy="152" r="5" fill={`url(#${skinGradId})`} />

            <path d="M 130 130 C 142 136 138 152 124 156 C 118 158 114 152 118 148 C 124 144 126 138 126 134 Z" fill={`url(#${skinGradId})`} />
            <circle cx="120" cy="152" r="5" fill={`url(#${skinGradId})`} />
          </g>
        ) : activePose === "open" || activePose === "close" || activePose === "shutter" ? (
          // Shutter pull
          <g id="pose-shutter" filter={`url(#${dropShadowId})`}>
            <g transform="translate(10, 16)">
              <rect x="0" y="0" width="180" height="7" fill="#64748B" />
              <rect x="0" y="8" width="180" height="7" fill="#64748B" />
              <rect x="0" y="16" width="180" height="9" rx="1.5" fill="#334155" />
            </g>
            <path d="M 68 126 C 54 100 60 55 76 38 C 80 34 86 38 84 44 C 76 60 74 95 82 124 Z" fill={`url(#${skinGradId})`} />
            <ellipse cx="78" cy="38" rx="6" ry="6" fill={`url(#${skinGradId})`} />

            <path d="M 132 126 C 146 100 140 55 124 38 C 120 34 114 38 116 44 C 124 60 126 95 118 124 Z" fill={`url(#${skinGradId})`} />
            <ellipse cx="122" cy="38" rx="6" ry="6" fill={`url(#${skinGradId})`} />
          </g>
        ) : activePose === "listening" ? (
          // Listening Pose
          <g id="pose-listening" filter={`url(#${dropShadowId})`}>
            <path d="M 70 132 C 54 126 48 108 52 94 C 54 88 60 90 60 96 C 60 106 64 120 72 136 Z" fill={`url(#${skinGradId})`} />
            <circle cx="52" cy="94" r="6" fill={`url(#${skinGradId})`} />

            <path d="M 130 132 C 146 126 152 108 148 94 C 146 88 140 90 140 96 C 140 106 136 120 128 136 Z" fill={`url(#${skinGradId})`} />
            <circle cx="148" cy="94" r="6" fill={`url(#${skinGradId})`} />
          </g>
        ) : activePose === "thinking" ? (
          // Thinking Pose: Hand on chin
          <g id="pose-thinking" filter={`url(#${dropShadowId})`}>
            <path d="M 68 130 C 54 136 50 154 62 164 C 74 166 94 162 106 154 C 110 150 106 142 98 144 C 84 148 74 150 68 142 Z" fill={`url(#${skinGradId})`} />

            <path d="M 130 130 C 142 142 136 160 120 156 C 114 154 116 142 118 136 C 122 124 118 114 112 110 Z" fill={`url(#${skinGradId})`} />
            <ellipse cx="112" cy="110" rx="7" ry="7" fill={`url(#${skinGradId})`} />
            <rect x="108" y="102" width="3.5" height="8" rx="1.75" fill={`url(#${skinGradId})`} transform="rotate(-20 108 102)" />
          </g>
        ) : activePose === "speaking" ? (
          // Speaking Pose: Explaining & Pointing
          <g id="pose-speaking" filter={`url(#${dropShadowId})`}>
            <path d="M 68 130 C 50 134 42 144 40 152 C 38 158 46 162 52 156 C 58 148 64 140 72 136 Z" fill={`url(#${skinGradId})`} />
            <circle cx="42" cy="154" r="6" fill={`url(#${skinGradId})`} />

            <path d="M 130 130 C 146 128 158 120 168 110 C 172 106 166 100 160 104 C 150 112 142 122 128 136 Z" fill={`url(#${skinGradId})`} />
            <circle cx="168" cy="106" r="7" fill={`url(#${skinGradId})`} />
            <rect x="168" y="102" width="10" height="3.5" rx="1.75" fill={`url(#${skinGradId})`} transform="rotate(-15 168 102)" />
          </g>
        ) : activePose === "success" ? (
          // Victory celebration fists
          <g id="pose-success" filter={`url(#${dropShadowId})`}>
            <path d="M 68 126 C 46 116 38 88 44 72 C 48 66 54 70 54 76 C 52 86 58 110 74 128 Z" fill={`url(#${skinGradId})`} />
            <circle cx="44" cy="70" r="7" fill={`url(#${skinGradId})`} />

            <path d="M 132 126 C 154 116 162 88 156 72 C 152 66 146 70 146 76 C 148 86 142 110 126 128 Z" fill={`url(#${skinGradId})`} />
            <circle cx="156" cy="70" r="7" fill={`url(#${skinGradId})`} />
          </g>
        ) : (
          // Idle: Friendly wave & thumb up
          <g id="pose-idle" filter={`url(#${dropShadowId})`}>
            <path d="M 68 130 C 52 138 50 152 56 162 C 59 166 65 166 68 160 C 70 155 64 148 72 138 Z" fill={`url(#${skinGradId})`} />
            <path d="M 130 130 C 146 132 158 124 162 108 C 164 102 158 98 152 104 C 146 112 140 122 128 138 Z" fill={`url(#${skinGradId})`} />
            <circle cx="162" cy="102" r="9" fill={`url(#${skinGradId})`} />
            <rect x="156" y="90" width="3.5" height="7" rx="1.75" fill={`url(#${skinGradId})`} transform="rotate(-15 156 90)" />
            <rect x="162" y="88" width="3.5" height="8" rx="1.75" fill={`url(#${skinGradId})`} />
            <rect x="168" y="91" width="3.5" height="7" rx="1.75" fill={`url(#${skinGradId})`} transform="rotate(15 168 91)" />
          </g>
        )}

        {/* 4. Neck */}
        <path d="M 90 114 L 110 114 L 108 128 L 92 128 Z" fill={`url(#${skinShadowId})`} />
        <path d="M 92 114 L 108 114 L 106 126 L 94 126 Z" fill={`url(#${skinGradId})`} />

        {/* 5. Head & Hair */}
        <g id="head" filter={`url(#${dropShadowId})`}>
          <path d="M 64 64 C 54 80 56 106 70 118 C 76 122 84 124 100 124 C 116 124 124 122 130 118 C 144 106 146 80 136 64 Z" fill={`url(#${hairGradId})`} />

          {/* Ears */}
          <ellipse cx="64" cy="94" rx="7.5" ry="10" fill={`url(#${skinGradId})`} />
          <ellipse cx="65" cy="94" rx="4.5" ry="6" fill="#FDBA74" />
          <ellipse cx="136" cy="94" rx="7.5" ry="10" fill={`url(#${skinGradId})`} />
          <ellipse cx="135" cy="94" rx="4.5" ry="6" fill="#FDBA74" />

          {/* Face Base */}
          <path d="M 68 84 C 68 108 82 122 100 122 C 118 122 132 108 132 84 C 132 68 118 64 100 64 C 82 64 68 68 68 84 Z" fill={`url(#${skinGradId})`} />

          {/* Rosy Cheeks */}
          <ellipse cx="76" cy="102" rx="7" ry="4.5" fill="#F43F5E" opacity="0.28" />
          <ellipse cx="124" cy="102" rx="7" ry="4.5" fill="#F43F5E" opacity="0.28" />

          {/* Front Hair Bangs */}
          <path d="M 66 70 C 72 82 82 86 90 80 C 98 88 112 86 122 74 C 128 78 134 76 135 70 Z" fill={`url(#${hairGradId})`} />
          <path d="M 72 72 Q 82 78 88 74" fill="none" stroke={`url(#${hairSheenId})`} strokeWidth="2" strokeLinecap="round" />

          {/* Dokandar Cap */}
          <g id="cap">
            <path d="M 65 68 C 65 40 80 32 100 32 C 120 32 135 40 135 68 C 125 64 115 62 100 62 C 85 62 75 64 65 68 Z" fill={`url(#${capGradId})`} />
            <path d="M 100 32 Q 100 48 100 62" stroke="#15803D" strokeWidth="1.5" fill="none" opacity="0.7" />
            <circle cx="100" cy="48" r="8" fill="#FFFFFF" opacity="0.95" />
            <polygon points="100,43 103,47 106,47 103,50 105,54 100,51 95,54 97,50 94,47 97,47" fill="#15803D" />

            <path d="M 58 66 C 68 60 100 58 142 66 C 146 72 138 78 100 78 C 62 78 54 72 58 66 Z" fill={`url(#${visorGradId})`} />
            <path d="M 62 67 Q 100 61 138 67" stroke="#4ADE80" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />
          </g>

          {/* Cyber Headphones on Listening */}
          {isListening && (
            <g id="headphones">
              <path d="M 56 86 C 56 36 144 36 144 86" fill="none" stroke="#0891B2" strokeWidth="4" strokeLinecap="round" />
              <rect x="50" y="80" width="12" height="26" rx="6" fill="#0891B2" stroke="#E0F2FE" strokeWidth="1.5" />
              <rect x="138" y="80" width="12" height="26" rx="6" fill="#0891B2" stroke="#E0F2FE" strokeWidth="1.5" />
              <circle cx="43" cy="94" r="14" fill="none" stroke="#38BDF8" strokeWidth="1.5" className="animate-ping" opacity="0.7" />
              <circle cx="157" cy="94" r="14" fill="none" stroke="#38BDF8" strokeWidth="1.5" className="animate-ping" opacity="0.7" />
            </g>
          )}

          {/* 6. Expressive Face Geometry */}
          {isThinking ? (
            // Thinking Face: Inquisitive Eyes & Pursed mouth
            <g id="face-thinking">
              <ellipse cx="84" cy="90" rx="7.5" ry="8.5" fill="#FFFFFF" />
              <ellipse cx="86" cy="88" rx="5.5" ry="6" fill="#3D261D" />
              <circle cx="86" cy="88" r="3.5" fill="#1C120C" />
              <circle cx="88" cy="86" r="2" fill="#FFFFFF" />
              <path d="M 76 80 Q 84 75 92 78" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round" />

              <ellipse cx="116" cy="90" rx="7.5" ry="8.5" fill="#FFFFFF" />
              <ellipse cx="118" cy="88" rx="5.5" ry="6" fill="#3D261D" />
              <circle cx="118" cy="88" r="3.5" fill="#1C120C" />
              <circle cx="120" cy="86" r="2" fill="#FFFFFF" />
              <path d="M 108 77 Q 116 72 126 76" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round" />

              <ellipse cx="100" cy="97" rx="2.5" ry="1.75" fill="#F97316" opacity="0.6" />
              <path d="M 94 107 Q 100 104 108 108" fill="none" stroke="#3D261D" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ) : isSuccess ? (
            // Joyful Success (^_^)
            <g id="face-success">
              <path d="M 76 92 Q 84 84 92 92" fill="none" stroke="#26160F" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 76 80 Q 84 75 92 80" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round" />

              <path d="M 108 92 Q 116 84 124 92" fill="none" stroke="#26160F" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 108 80 Q 116 75 124 80" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round" />

              <ellipse cx="100" cy="97" rx="2.5" ry="1.75" fill="#F97316" opacity="0.6" />
              <path d="M 88 103 Q 100 120 112 103 Q 100 114 88 103 Z" fill="#3D261D" />
              <path d="M 92 110 Q 100 119 108 110 Q 100 116 92 110 Z" fill="#F43F5E" />
            </g>
          ) : isSpeaking ? (
            // Speaking mouth
            <g id="face-speaking">
              <ellipse cx="84" cy="92" rx="7.5" ry="8.5" fill="#FFFFFF" />
              <ellipse cx="84" cy="92" rx="5.5" ry="6" fill="#3D261D" />
              <circle cx="84" cy="92" r="3.5" fill="#1C120C" />
              <circle cx="86" cy="89" r="2.2" fill="#FFFFFF" />
              <path d="M 76 80 Q 84 75 92 79" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round" />

              <ellipse cx="116" cy="92" rx="7.5" ry="8.5" fill="#FFFFFF" />
              <ellipse cx="116" cy="92" rx="5.5" ry="6" fill="#3D261D" />
              <circle cx="116" cy="92" r="3.5" fill="#1C120C" />
              <circle cx="118" cy="89" r="2.2" fill="#FFFFFF" />
              <path d="M 108 79 Q 116 74 125 79" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round" />

              <ellipse cx="100" cy="97" rx="2.5" ry="1.75" fill="#F97316" opacity="0.6" />
              <path d="M 91 104 Q 100 102 109 104 Q 108 116 100 116 Q 92 116 91 104 Z" fill="#3D261D" />
              <path d="M 94 111 Q 100 116 106 111 Q 100 115 94 111 Z" fill="#F43F5E" />
            </g>
          ) : (
            // Classic Charming Wink
            <g id="face-wink">
              <ellipse cx="84" cy="92" rx="7.5" ry="9" fill="#FFFFFF" />
              <ellipse cx="84" cy="92" rx="5.5" ry="6.5" fill="#3D261D" />
              <circle cx="84" cy="92" r="4" fill="#1C120C" />
              <circle cx="86" cy="89" r="2.2" fill="#FFFFFF" />
              <circle cx="82" cy="94" r="1.1" fill="#FFFFFF" />
              <path d="M 76 81 Q 84 76 92 80" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round" />

              <path d="M 110 93 Q 118 86 126 93" fill="none" stroke="#26160F" strokeWidth="3" strokeLinecap="round" />
              <path d="M 108 78 Q 118 73 126 79" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round" />

              <ellipse cx="100" cy="97" rx="2.5" ry="1.75" fill="#F97316" opacity="0.6" />
              <path d="M 90 105 Q 100 115 110 105" fill="none" stroke="#3D261D" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 93 106 Q 100 114 107 106 Q 100 111 93 106 Z" fill="#F43F5E" opacity="0.75" />
            </g>
          )}
        </g>
      </svg>
    </div>
  )
}
