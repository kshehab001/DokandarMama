import React from "react"
import { cn } from "@/lib/utils"
import {
  type ChotuConfig,
  type ChotuState,
  DEFAULT_CHOTU_CONFIG,
} from "@/lib/chotu-config"

interface ChotuAvatarProps {
  config?: ChotuConfig
  state?: ChotuState
  className?: string
  onClick?: () => void
  interactive?: boolean
  showAura?: boolean
}

export function ChotuAvatar({
  config = DEFAULT_CHOTU_CONFIG,
  state = "idle",
  className,
  onClick,
  interactive = true,
  showAura = true,
}: ChotuAvatarProps) {
  const capColor = config.capColor || "#2563eb"
  const vestColor = config.vestColor || "#1d4ed8"
  const outfit = config.outfit || "traditional"
  const size = config.size || "medium"

  // Scale map
  const sizeDimensions = {
    small: { width: 56, height: 74 },
    medium: { width: 78, height: 104 },
    large: { width: 104, height: 138 },
  }[size]

  // State-based dynamic styling classes
  const isListening = state === "listening"
  const isThinking = state === "thinking"
  const isSpeaking = state === "speaking"
  const isSuccess = state === "success"
  const isError = state === "error"

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center select-none transition-transform",
        interactive && "cursor-pointer active:scale-95 hover:scale-105",
        config.animationIntensity === "expressive" && "animate-bounce-subtle",
        className
      )}
      style={{
        width: sizeDimensions.width,
        height: sizeDimensions.height,
      }}
    >
      {/* Magical Aura Glow */}
      {showAura && (
        <div
          className={cn(
            "absolute -inset-2 rounded-full blur-xl pointer-events-none transition-all duration-500",
            isListening && "bg-cyan-400/50 scale-125 animate-pulse",
            isThinking && "bg-amber-400/40 scale-110",
            isSpeaking && "bg-blue-500/50 scale-120 animate-pulse",
            isSuccess && "bg-emerald-400/60 scale-130",
            isError && "bg-rose-400/50 scale-110",
            state === "idle" && "bg-blue-400/25 scale-100"
          )}
        />
      )}

      {/* Floating SVG Character */}
      <svg
        viewBox="0 0 160 210"
        className={cn(
          "w-full h-full drop-shadow-xl overflow-visible transition-all",
          isListening && "filter drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]",
          isSuccess && "animate-bounce",
          isError && "animate-wiggle"
        )}
      >
        <defs>
          {/* Genie Tail Gradient */}
          <linearGradient id="genieTailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
          </linearGradient>

          {/* Golden Lamp Gradient */}
          <linearGradient id="goldLampGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Skin Tone Gradient */}
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.3" />
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#fdba74" />
          </linearGradient>

          {/* Hair Gradient */}
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#33241d" />
            <stop offset="100%" stopColor="#1c120c" />
          </linearGradient>
        </defs>

        {/* 1. Magical Genie Tail (Floating bottom) */}
        <g className="animate-pulse">
          <path
            d="M 68 140 Q 60 165 48 180 T 32 205 Q 60 195 78 175 Q 92 160 92 140 Z"
            fill="url(#genieTailGrad)"
          />
          <path
            d="M 75 145 Q 65 170 54 185 T 45 200"
            stroke="#e0f2fe"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="4 4"
            opacity="0.8"
          />
          {/* Sparkles around tail */}
          <circle cx="42" cy="180" r="2.5" fill="#38bdf8" className="animate-ping" />
          <circle cx="58" cy="195" r="2" fill="#7dd3fc" />
          <circle cx="70" cy="170" r="1.5" fill="#bae6fd" />
        </g>

        {/* 2. Mini Golden Magic Lamp at Base (Genie origin) */}
        <g transform="translate(18, 185) scale(0.65)">
          <path
            d="M 12 18 Q 28 22 44 18 Q 42 12 36 8 L 20 8 Q 14 12 12 18 Z"
            fill="url(#goldLampGrad)"
          />
          <ellipse cx="28" cy="20" rx="14" ry="4" fill="#92400e" opacity="0.4" />
          <path
            d="M 36 10 Q 52 4 58 0 Q 56 6 42 14 Z"
            fill="url(#goldLampGrad)"
          />
          <path
            d="M 16 12 Q 4 10 4 18 Q 4 24 14 20"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>

        {/* 3. Body & Torso */}
        {/* White Inner Shirt */}
        <path
          d="M 56 108 L 104 108 L 96 142 L 64 142 Z"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {/* Outfit Layer */}
        {outfit === "traditional" && (
          // Traditional Bangladeshi Panjabi Vest with Gamcha
          <g>
            {/* Open Blue Vest */}
            <path
              d="M 52 108 L 70 108 L 68 142 L 48 140 Z"
              fill={vestColor}
            />
            <path
              d="M 108 108 L 90 108 L 92 142 L 112 140 Z"
              fill={vestColor}
            />
            {/* Red/White Check Gamcha over Left Shoulder */}
            <path
              d="M 50 105 Q 44 125 46 142 Q 54 144 56 138 Q 54 120 58 105 Z"
              fill="#ef4444"
            />
            <path
              d="M 48 114 L 56 116 M 46 124 L 54 126 M 46 134 L 54 136"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </g>
        )}

        {outfit === "pharmacy" && (
          // White Pharmacist Doctor Coat & Stethoscope
          <g>
            <path
              d="M 50 106 L 72 108 L 68 144 L 46 142 Z"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            <path
              d="M 110 106 L 88 108 L 92 144 L 114 142 Z"
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            {/* Stethoscope */}
            <path
              d="M 62 108 Q 80 135 98 108"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            <circle cx="80" cy="130" r="4.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
          </g>
        )}

        {outfit === "electronics" && (
          // Tech Vest with High-Tech Badge
          <g>
            <path
              d="M 50 106 L 72 108 L 68 142 L 48 140 Z"
              fill="#1e293b"
            />
            <path
              d="M 110 106 L 88 108 L 92 142 L 112 140 Z"
              fill="#1e293b"
            />
            {/* Neon Cyan Circuit Lines */}
            <path
              d="M 56 114 L 64 122 L 64 134"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
            />
            <circle cx="56" cy="114" r="1.5" fill="#22d3ee" />
            <circle cx="64" cy="134" r="1.5" fill="#22d3ee" />
          </g>
        )}

        {outfit === "clothing" && (
          // Trendy Denim Vest & Purple Scarf
          <g>
            <path
              d="M 50 106 L 72 108 L 68 142 L 48 140 Z"
              fill="#2563eb"
            />
            <path
              d="M 110 106 L 88 108 L 92 142 L 112 140 Z"
              fill="#2563eb"
            />
            {/* Purple Trendy Scarf */}
            <path
              d="M 62 106 Q 80 120 98 106 Q 90 124 84 136 L 76 136 Q 70 124 62 106 Z"
              fill="#9333ea"
            />
          </g>
        )}

        {outfit === "apron" && (
          // Store Apron
          <g>
            <path
              d="M 60 106 L 100 106 L 104 144 L 56 144 Z"
              fill="#059669"
            />
            {/* Apron Pocket */}
            <rect x="68" y="122" width="24" height="16" rx="3" fill="#047857" />
            <path d="M 72 126 L 88 126" stroke="#a7f3d0" strokeWidth="1.5" />
          </g>
        )}

        {outfit === "genie" && (
          // Classic Genie Golden Vest & Jewels
          <g>
            <path
              d="M 50 106 L 72 108 L 68 142 L 48 140 Z"
              fill="url(#goldLampGrad)"
            />
            <path
              d="M 110 106 L 88 108 L 92 142 L 112 140 Z"
              fill="url(#goldLampGrad)"
            />
            <circle cx="80" cy="120" r="3.5" fill="#ef4444" stroke="#fbbf24" strokeWidth="1" />
          </g>
        )}

        {/* 4. Arms & Hands with Expressive Poses */}
        {isListening ? (
          // Hands adjusting futuristic glowing headphones
          <g>
            <path
              d="M 48 114 Q 30 100 36 78 Q 42 76 48 84"
              fill="url(#skinGrad)"
              stroke="#ea580c"
              strokeWidth="1"
            />
            <path
              d="M 112 114 Q 130 100 124 78 Q 118 76 112 84"
              fill="url(#skinGrad)"
              stroke="#ea580c"
              strokeWidth="1"
            />
          </g>
        ) : isThinking ? (
          // Right Hand on chin, pondering
          <g>
            <path
              d="M 48 114 Q 34 130 42 140"
              fill="none"
              stroke="url(#skinGrad)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 112 114 Q 118 135 96 112 Q 90 98 84 94"
              fill="none"
              stroke="url(#skinGrad)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <circle cx="84" cy="94" r="7" fill="url(#skinGrad)" />
          </g>
        ) : isSpeaking ? (
          // Right hand pointing / presenting, Left hand resting
          <g>
            <path
              d="M 48 114 Q 32 130 36 142"
              fill="none"
              stroke="url(#skinGrad)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 112 114 Q 135 110 148 98"
              fill="none"
              stroke="url(#skinGrad)"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* Pointing index finger */}
            <circle cx="148" cy="98" r="6" fill="url(#skinGrad)" />
            <path d="M 148 98 L 158 92" stroke="url(#skinGrad)" strokeWidth="4" strokeLinecap="round" />
          </g>
        ) : (
          // Idle Pose: Friendly wave / thumbs up
          <g>
            <path
              d="M 48 114 Q 32 128 38 140"
              fill="none"
              stroke="url(#skinGrad)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 112 114 Q 138 108 142 86"
              fill="none"
              stroke="url(#skinGrad)"
              strokeWidth="11"
              strokeLinecap="round"
            />
            {/* Waving Hand */}
            <ellipse cx="142" cy="84" rx="7" ry="8" fill="url(#skinGrad)" />
            <path d="M 142 78 L 144 72 M 146 80 L 150 75 M 138 80 L 136 74" stroke="url(#skinGrad)" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* 5. Neck */}
        <rect x="72" y="96" width="16" height="15" rx="3" fill="url(#skinGrad)" />

        {/* 6. Head & Face (Cute, expressive Chotu) */}
        <ellipse cx="80" cy="74" rx="34" ry="32" fill="url(#skinGrad)" />

        {/* Cheeks Blush */}
        <circle cx="56" cy="82" r="6" fill="#f43f5e" opacity="0.35" />
        <circle cx="104" cy="82" r="6" fill="#f43f5e" opacity="0.35" />

        {/* Cute Ears */}
        <ellipse cx="46" cy="74" rx="6" ry="9" fill="url(#skinGrad)" />
        <ellipse cx="114" cy="74" rx="6" ry="9" fill="url(#skinGrad)" />

        {/* Listening Headphones */}
        {isListening && (
          <g>
            <path
              d="M 42 70 Q 80 20 118 70"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <rect x="38" y="62" width="10" height="24" rx="5" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" />
            <rect x="112" y="62" width="10" height="24" rx="5" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" />
            {/* Glowing sound rings */}
            <circle cx="43" cy="74" r="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="animate-ping" opacity="0.7" />
            <circle cx="117" cy="74" r="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="animate-ping" opacity="0.7" />
          </g>
        )}

        {/* Tech Glasses (for Electronics Outfit) */}
        {outfit === "electronics" && (
          <g>
            <rect x="56" y="66" width="20" height="14" rx="4" fill="#06b6d4" opacity="0.3" stroke="#0891b2" strokeWidth="2" />
            <rect x="84" y="66" width="20" height="14" rx="4" fill="#06b6d4" opacity="0.3" stroke="#0891b2" strokeWidth="2" />
            <line x1="76" y1="73" x2="84" y2="73" stroke="#0891b2" strokeWidth="2" />
          </g>
        )}

        {/* 7. Expressive Eyes & Eyebrows */}
        {isThinking ? (
          // Looking up in contemplation
          <g>
            {/* Eyebrows arched */}
            <path d="M 58 60 Q 67 54 74 60" fill="none" stroke="#261a14" strokeWidth="3" strokeLinecap="round" />
            <path d="M 86 58 Q 93 52 102 58" fill="none" stroke="#261a14" strokeWidth="3" strokeLinecap="round" />
            {/* Eyes looking up */}
            <ellipse cx="66" cy="69" rx="6.5" ry="7" fill="#ffffff" />
            <circle cx="67" cy="67" r="4.5" fill="#451a03" />
            <circle cx="68" cy="65" r="1.5" fill="#ffffff" />

            <ellipse cx="94" cy="69" rx="6.5" ry="7" fill="#ffffff" />
            <circle cx="95" cy="67" r="4.5" fill="#451a03" />
            <circle cx="96" cy="65" r="1.5" fill="#ffffff" />
          </g>
        ) : isSuccess ? (
          // Joyful happy closed eyes (^_^)
          <g>
            <path d="M 58 72 Q 66 64 74 72" fill="none" stroke="#382319" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 86 72 Q 94 64 102 72" fill="none" stroke="#382319" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        ) : (
          // Classic friendly wink or bright open eyes
          <g>
            {/* Left Eye: Open, Sparkly Brown Eye */}
            <ellipse cx="65" cy="73" rx="7.5" ry="8" fill="#ffffff" />
            <ellipse cx="65" cy="73" rx="5" ry="5.5" fill="#451a03" />
            <circle cx="67" cy="71" r="2.2" fill="#ffffff" />
            <circle cx="63" cy="75" r="1" fill="#ffffff" />
            {/* Left Eyebrow */}
            <path d="M 58 63 Q 66 59 74 63" fill="none" stroke="#261a14" strokeWidth="3" strokeLinecap="round" />

            {/* Right Eye: Friendly Wink */}
            <path d="M 86 74 Q 94 67 102 74" fill="none" stroke="#382319" strokeWidth="3.5" strokeLinecap="round" />
            {/* Right Eyebrow */}
            <path d="M 86 62 Q 94 58 102 63" fill="none" stroke="#261a14" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* Cute Button Nose */}
        <ellipse cx="80" cy="78" rx="2" ry="1.5" fill="#ea580c" opacity="0.6" />

        {/* 8. Expressive Mouth */}
        {isSpeaking ? (
          // Open animated smiling mouth
          <g className="animate-pulse">
            <path
              d="M 72 84 Q 80 97 88 84 Z"
              fill="#991b1b"
              stroke="#7f1d1d"
              strokeWidth="1.5"
            />
            {/* Teeth */}
            <path d="M 73 84 Q 80 88 87 84" fill="#ffffff" />
            {/* Tongue */}
            <path d="M 76 91 Q 80 88 84 91 Q 80 96 76 91" fill="#f43f5e" />
          </g>
        ) : isThinking ? (
          // Small wondering mouth (o)
          <ellipse cx="80" cy="87" rx="3.5" ry="4" fill="#991b1b" />
        ) : (
          // Sweet warm smile (^_~)
          <path
            d="M 72 84 Q 80 92 88 84"
            fill="none"
            stroke="#991b1b"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* 9. Stylized Messy Anime Hair */}
        <g>
          <path
            d="M 46 64 C 36 50 48 30 64 26 C 72 16 94 16 102 28 C 114 26 126 42 118 64 C 114 62 112 56 108 58 C 104 46 96 42 90 48 C 82 38 72 40 68 50 C 62 48 54 54 52 64 Z"
            fill="url(#hairGrad)"
          />
          {/* Cute Tuft of hair popping on forehead */}
          <path
            d="M 74 48 Q 78 38 84 46"
            fill="none"
            stroke="#33241d"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>

        {/* 10. Dokandar Mama Custom Cap */}
        <g>
          {/* Cap Crown */}
          <path
            d="M 48 48 C 48 24 112 24 112 48 C 112 56 48 56 48 48 Z"
            fill={capColor}
          />
          {/* Cap Visor / Brim */}
          <path
            d="M 42 50 C 44 42 116 42 118 50 C 112 60 48 60 42 50 Z"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />
          <path
            d="M 40 50 Q 80 62 120 50"
            fill="none"
            stroke={capColor}
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Dokandar Mama Shop Logo Badge on Cap */}
          <g transform="translate(71, 31) scale(0.65)">
            {/* Mini Store Canopy */}
            <rect x="0" y="4" width="28" height="14" rx="3" fill="#ffffff" />
            <path
              d="M 2 8 L 8 8 L 8 14 L 2 14 Z M 10 8 L 16 8 L 16 14 L 10 14 Z M 18 8 L 24 8 L 24 14 L 18 14 Z"
              fill={capColor}
            />
            <path d="M 0 4 Q 14 0 28 4 L 26 8 L 2 8 Z" fill="#f59e0b" />
          </g>
        </g>

        {/* 11. Interactive State Overlays & Thought Bubbles */}
        {isThinking && (
          <g className="animate-bounce">
            <ellipse cx="120" cy="36" rx="9" ry="9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
            <text x="116" y="42" fontSize="14" fontWeight="bold" fill="#854d0e" fontFamily="sans-serif">?</text>
            <circle cx="108" cy="46" r="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
            <circle cx="102" cy="52" r="1.5" fill="#fef08a" />
          </g>
        )}

        {isSuccess && (
          <g className="animate-ping">
            <path d="M 125 30 L 128 36 L 134 38 L 128 40 L 125 46 L 122 40 L 116 38 L 122 36 Z" fill="#fbbf24" />
            <path d="M 35 34 L 37 38 L 42 40 L 37 42 L 35 46 L 33 42 L 28 40 L 33 38 Z" fill="#38bdf8" />
          </g>
        )}

        {isSpeaking && (
          // Sound wave bars
          <g transform="translate(132, 60)" className="animate-pulse">
            <rect x="0" y="6" width="3" height="8" rx="1.5" fill="#0284c7" />
            <rect x="5" y="2" width="3" height="16" rx="1.5" fill="#38bdf8" />
            <rect x="10" y="4" width="3" height="12" rx="1.5" fill="#0ea5e9" />
          </g>
        )}
      </svg>
    </div>
  )
}
