import React, { useId, useState, useEffect } from "react"
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

// Map of poses that have 3D-toon WebP sprites
const SPRITE_POSES = new Set(["idle","listening","thinking","speaking","success","billing"])

function getSpriteUrl(resolvedPose: string): string | null {
  if (SPRITE_POSES.has(resolvedPose)) return `/assets/chotu/webp/${resolvedPose}.jpg`
  return null
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

  const sizeDimensions = {
    small: { width: 56, height: 72 },
    medium: { width: 80, height: 104 },
    large: { width: 110, height: 142 },
  }[size]

  const activePose = pose || (
    state === "listening" ? "listening" :
    state === "thinking" ? "thinking" :
    state === "speaking" ? "speaking" :
    state === "success" ? "success" : "idle"
  )

  const isListening = state === "listening" || activePose === "listening"
  const isThinking = state === "thinking" || activePose === "thinking" || activePose === "low_stock"
  const isSpeaking = state === "speaking" || activePose === "speaking"
  const isSuccess = state === "success" || activePose === "sale_done" || activePose === "growth"
  const isError = state === "error"

  const [currentSprite, setCurrentSprite] = useState<string | null>(getSpriteUrl(activePose))
  const [prevSprite, setPrevSprite] = useState<string | null>(null)
  const [fadeIn, setFadeIn] = useState(true)

  useEffect(() => {
    const next = getSpriteUrl(activePose)
    if (next !== currentSprite) {
      setPrevSprite(currentSprite)
      setFadeIn(false)
      setTimeout(() => {
        setCurrentSprite(next)
        setFadeIn(true)
      }, 180)
    }
  }, [activePose]) // eslint-disable-line

  const skinGradId = `sg_${uid}`
  const skinShadowId = `ss_${uid}`
  const hairGradId = `hg_${uid}`
  const hairSheenId = `hs_${uid}`
  const capGradId = `cg_${uid}`
  const visorGradId = `vg_${uid}`
  const vestGradId = `wg_${uid}`
  const vestLapelId = `wl_${uid}`
  const genieTailId = `gt_${uid}`
  const genieCoreId = `gc_${uid}`
  const softGlowId = `sg2_${uid}`
  const dropShadowId = `ds_${uid}`

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center select-none",
        interactive && "cursor-pointer active:scale-95 hover:scale-105",
        className
      )}
      style={{ width: sizeDimensions.width, height: sizeDimensions.height, transition: "transform 0.2s ease" }}
    >
      {showAura && (
        <div className={cn(
          "absolute -inset-2 rounded-full blur-xl pointer-events-none transition-all duration-500",
          isListening && "bg-cyan-400/50 scale-125 animate-pulse",
          isThinking && "bg-amber-400/45 scale-110",
          isSpeaking && "bg-sky-500/45 animate-pulse",
          isSuccess && "bg-emerald-400/60",
          isError && "bg-rose-400/50",
          !isListening && !isThinking && !isSpeaking && !isSuccess && !isError && "bg-sky-400/25"
        )} />
      )}

      {currentSprite ? (
        <div className="relative w-full h-full chotu-bob">
          {prevSprite && (
            <img src={prevSprite} alt="" aria-hidden
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ opacity: fadeIn ? 0 : 1, transition: "opacity 0.3s ease" }}
            />
          )}
          <img src={currentSprite} alt="Chotu"
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              opacity: fadeIn ? 1 : 0,
              transition: "opacity 0.3s ease",
              filter: isListening
                ? "drop-shadow(0 0 10px rgba(6,182,212,0.7))"
                : isSuccess
                ? "drop-shadow(0 0 12px rgba(34,197,94,0.6))"
                : "drop-shadow(0 2px 8px rgba(0,0,0,0.18))",
            }}
          />
        </div>
      ) : (
        <svg viewBox="0 0 200 240" className={cn("w-full h-full drop-shadow-xl overflow-visible transition-all duration-300 chotu-bob",
          isListening && "filter drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]",
          isSuccess && "drop-shadow-[0_0_14px_rgba(34,197,94,0.6)]"
        )}>
          <defs>
            <linearGradient id={skinGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFE4C7"/><stop offset="60%" stopColor="#FED7AA"/><stop offset="100%" stopColor="#FDBA74"/>
            </linearGradient>
            <linearGradient id={skinShadowId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FED7AA"/><stop offset="100%" stopColor="#F97316" stopOpacity="0.6"/>
            </linearGradient>
            <linearGradient id={hairGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3D261D"/><stop offset="50%" stopColor="#26160F"/><stop offset="100%" stopColor="#140B07"/>
            </linearGradient>
            <linearGradient id={hairSheenId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6B4232" stopOpacity="0.8"/><stop offset="100%" stopColor="#3D261D" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id={capGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={capColor} stopOpacity="0.85"/><stop offset="40%" stopColor={capColor}/><stop offset="100%" stopColor="#14532D"/>
            </linearGradient>
            <linearGradient id={visorGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={capColor}/><stop offset="100%" stopColor="#0F381E"/>
            </linearGradient>
            <linearGradient id={vestGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={vestColor} stopOpacity="0.85"/><stop offset="50%" stopColor={vestColor}/><stop offset="100%" stopColor="#1E3A8A"/>
            </linearGradient>
            <linearGradient id={vestLapelId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD"/><stop offset="100%" stopColor={vestColor}/>
            </linearGradient>
            <linearGradient id={genieTailId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.95"/>
              <stop offset="40%" stopColor="#38BDF8" stopOpacity="0.9"/>
              <stop offset="75%" stopColor="#0284C7" stopOpacity="0.75"/>
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id={genieCoreId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E0F2FE"/><stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9"/>
            </linearGradient>
            <linearGradient id={`gc2_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A"/><stop offset="60%" stopColor="#FACC15"/><stop offset="100%" stopColor="#CA8A04"/>
            </linearGradient>
            <linearGradient id={`du_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047"/><stop offset="50%" stopColor="#38BDF8"/><stop offset="100%" stopColor="#818CF8"/>
            </linearGradient>
            <filter id={softGlowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
            <filter id={dropShadowId} x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15"/>
            </filter>
          </defs>

          <g opacity="0.6"><circle cx="100" cy="185" r="30" fill="#38BDF8" filter={`url(#${softGlowId})`} opacity="0.35"/></g>

          <g filter={`url(#${dropShadowId})`}>
            <path d="M 86 160 C 76 182 64 195 50 208 C 38 220 54 235 72 228 C 96 220 114 198 116 160 Z" fill={`url(#${genieTailId})`}/>
            <path d="M 94 162 C 84 182 74 196 62 210 C 56 216 64 222 72 218 C 88 210 104 192 106 162 Z" fill={`url(#${genieCoreId})`} opacity="0.75"/>
            <circle cx="56" cy="214" r="2.5" fill="#FFFFFF"/><circle cx="42" cy="198" r="2" fill="#BAE6FD"/>
            <polygon points="120,188 122,182 124,188 130,190 124,192 122,198 120,192 114,190" fill="#FDE047" opacity="0.8"/>
          </g>

          <g filter={`url(#${dropShadowId})`}>
            <path d="M 72 126 L 128 126 L 120 165 C 110 167 90 167 80 165 Z" fill="#FFFFFF"/>
            <path d="M 68 126 L 88 126 L 85 165 L 64 162 C 65 148 66 136 68 126 Z" fill={`url(#${vestGradId})`}/>
            <path d="M 132 126 L 112 126 L 115 165 L 136 162 C 135 148 134 136 132 126 Z" fill={`url(#${vestGradId})`}/>
            <path d="M 88 126 L 84 152 L 85 165 L 88 126 Z" fill={`url(#${vestLapelId})`}/>
            <path d="M 112 126 L 116 152 L 115 165 L 112 126 Z" fill={`url(#${vestLapelId})`}/>
            {outfit === "traditional" && (
              <g>
                <path d="M 66 126 Q 62 144 64 162 Q 72 164 74 158 Q 70 140 72 126 Z" fill="#EF4444"/>
                <path d="M 65 134 L 73 136 M 64 144 L 72 146" stroke="#FFFFFF" strokeWidth="1.5"/>
              </g>
            )}
            {outfit === "apron" && (
              <g>
                <path d="M 80 126 L 120 126 L 116 165 L 84 165 Z" fill="#059669"/>
                <rect x="88" y="142" width="24" height="16" rx="3" fill="#047857"/>
              </g>
            )}
          </g>

          {activePose === "inventory" || activePose === "dusting" ? (
            <g filter={`url(#${dropShadowId})`}>
              <path d="M 68 130 C 52 136 48 148 54 158 C 58 162 64 160 68 154 C 70 148 68 142 74 136 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="56" cy="156" r="5" fill={`url(#${skinGradId})`}/>
              <path d="M 130 130 C 146 132 156 122 162 110 C 166 104 160 98 154 104 C 146 112 140 122 128 136 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="160" cy="106" r="6" fill={`url(#${skinGradId})`}/>
              <g transform="translate(150, 65) rotate(25)">
                <rect x="18" y="45" width="4" height="35" rx="2" fill="#92400E"/>
                <path d="M 10 45 C 0 35 4 10 20 5 C 36 10 40 35 30 45 Z" fill={`url(#du_${uid})`}/>
              </g>
            </g>
          ) : activePose === "low_stock" || activePose === "expiry" ? (
            <g filter={`url(#${dropShadowId})`}>
              <path d="M 70 132 C 54 136 46 148 50 160 C 54 166 62 164 68 156 C 72 148 74 142 76 136 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="48" cy="154" r="5" fill={`url(#${skinGradId})`}/>
              <g transform="translate(24, 128)">
                <rect x="0" y="0" width="22" height="30" rx="3" fill="#EA580C" stroke="#C2410C" strokeWidth="1"/>
                <circle cx="11" cy="-4" r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5"/>
                <text x="9" y="0" fontSize="10" fill="#FFFFFF" fontWeight="bold" fontFamily="sans-serif">!</text>
              </g>
              <path d="M 130 130 C 142 136 140 152 126 156 C 114 158 106 148 94 138 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="94" cy="138" r="5" fill={`url(#${skinGradId})`}/>
              <g transform="translate(52, 114) rotate(-30)">
                <circle cx="20" cy="20" r="16" fill="#E0F2FE" fillOpacity="0.4" stroke="#0F172A" strokeWidth="3"/>
                <rect x="34" y="18" width="18" height="4.5" rx="2" fill="#475569" stroke="#0F172A" strokeWidth="1"/>
              </g>
            </g>
          ) : activePose === "baki" || activePose === "ledger" ? (
            <g filter={`url(#${dropShadowId})`}>
              <g transform="translate(68, 126) rotate(-8)">
                <rect x="0" y="0" width="36" height="46" rx="3" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.5"/>
                <rect x="0" y="0" width="6" height="46" rx="1" fill="#FACC15"/>
              </g>
              <path d="M 68 130 C 56 138 58 152 68 158 C 74 160 80 156 76 148 C 72 142 70 136 72 132 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="72" cy="154" r="5" fill={`url(#${skinGradId})`}/>
              <path d="M 130 130 C 142 136 134 154 116 156 C 110 158 106 150 110 144 C 118 138 124 134 126 130 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="110" cy="148" r="5" fill={`url(#${skinGradId})`}/>
              <g transform="translate(108, 134) rotate(-35)">
                <rect x="0" y="0" width="4" height="24" rx="1.5" fill="#FDE047" stroke="#78350F" strokeWidth="0.5"/>
              </g>
            </g>
          ) : activePose === "cashbox" ? (
            <g filter={`url(#${dropShadowId})`}>
              <g transform="translate(65, 140)">
                <rect x="0" y="12" width="70" height="28" rx="3" fill="#64748B" stroke="#1E293B" strokeWidth="1"/>
                <ellipse cx="16" cy="12" rx="7" ry="2.5" fill={`url(#gc2_${uid})`}/>
                <ellipse cx="16" cy="9.5" rx="7" ry="2.5" fill={`url(#gc2_${uid})`}/>
                <ellipse cx="16" cy="7" rx="7" ry="2.5" fill={`url(#gc2_${uid})`}/>
              </g>
              <path d="M 68 130 C 58 136 62 148 76 150 C 80 150 84 144 80 140 C 76 136 72 134 72 130 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="80" cy="144" r="4.5" fill={`url(#${skinGradId})`}/>
              <path d="M 130 130 C 140 136 136 148 122 150 C 118 150 114 144 118 140 C 122 136 126 134 126 130 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="120" cy="144" r="4.5" fill={`url(#${skinGradId})`}/>
              <ellipse cx="100" cy="134" rx="5" ry="5" fill={`url(#gc2_${uid})`} stroke="#FEF08A" strokeWidth="0.75"/>
            </g>
          ) : activePose === "sale_done" || activePose === "packaging" ? (
            <g filter={`url(#${dropShadowId})`}>
              <g transform="translate(74, 134)">
                <path d="M 4 14 L 48 14 L 44 54 L 8 54 Z" fill="#D97706" stroke="#92400E" strokeWidth="1"/>
                <circle cx="26" cy="34" r="7" fill="#16A34A"/>
                <rect x="12" y="2" width="8" height="14" rx="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1"/>
                <path d="M 16 14 C 16 6 36 6 36 14" fill="none" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round"/>
              </g>
              <path d="M 68 130 C 56 136 60 152 74 156 C 80 158 84 152 80 148 C 74 144 72 138 72 134 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="80" cy="152" r="5" fill={`url(#${skinGradId})`}/>
              <path d="M 130 130 C 142 136 138 152 124 156 C 118 158 114 152 118 148 C 124 144 126 138 126 134 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="120" cy="152" r="5" fill={`url(#${skinGradId})`}/>
            </g>
          ) : activePose === "open" || activePose === "close" || activePose === "shutter" ? (
            <g filter={`url(#${dropShadowId})`}>
              <g transform="translate(10, 16)">
                <rect x="0" y="0" width="180" height="7" fill="#64748B"/>
                <rect x="0" y="8" width="180" height="7" fill="#64748B"/>
                <rect x="0" y="16" width="180" height="9" rx="1.5" fill="#334155"/>
              </g>
              <path d="M 68 126 C 54 100 60 55 76 38 C 80 34 86 38 84 44 C 76 60 74 95 82 124 Z" fill={`url(#${skinGradId})`}/>
              <ellipse cx="78" cy="38" rx="6" ry="6" fill={`url(#${skinGradId})`}/>
              <path d="M 132 126 C 146 100 140 55 124 38 C 120 34 114 38 116 44 C 124 60 126 95 118 124 Z" fill={`url(#${skinGradId})`}/>
              <ellipse cx="122" cy="38" rx="6" ry="6" fill={`url(#${skinGradId})`}/>
            </g>
          ) : activePose === "incoming" ? (
            <g filter={`url(#${dropShadowId})`}>
              <path d="M 130 130 C 146 128 158 120 168 110 C 172 106 166 100 160 104 C 150 112 142 122 128 136 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="168" cy="106" r="7" fill={`url(#${skinGradId})`}/>
              <g transform="translate(150, 80)">
                <rect x="0" y="5" width="18" height="26" rx="3" fill="#374151"/>
                <rect x="3" y="8" width="12" height="10" rx="1" fill="#6EE7B7"/>
                <rect x="7" y="0" width="4" height="8" rx="1" fill="#9CA3AF"/>
                <circle cx="18" cy="10" r="3" fill="none" stroke="#38BDF8" strokeWidth="1.5" opacity="0.8"/>
                <circle cx="18" cy="10" r="6" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.5"/>
              </g>
              <path d="M 70 132 C 54 136 48 148 54 158 C 58 162 64 160 68 154 C 70 148 68 142 74 136 Z" fill={`url(#${skinGradId})`}/>
            </g>
          ) : activePose === "growth" ? (
            <g filter={`url(#${dropShadowId})`}>
              <path d="M 130 130 C 146 128 156 116 160 104 C 162 98 156 96 150 102 C 144 112 138 124 126 136 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="158" cy="102" r="7" fill={`url(#${skinGradId})`}/>
              <g transform="translate(134, 78)">
                <rect x="0" y="0" width="40" height="50" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1"/>
                <path d="M 5 40 L 12 28 L 20 32 L 28 18 L 35 10" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polygon points="35,4 40,14 30,14" fill="#22C55E"/>
              </g>
              <path d="M 70 132 C 54 136 48 148 54 158 C 58 162 64 160 68 154 Z" fill={`url(#${skinGradId})`}/>
            </g>
          ) : (
            <g filter={`url(#${dropShadowId})`}>
              <path d="M 68 130 C 52 138 50 152 56 162 C 59 166 65 166 68 160 C 70 155 64 148 72 138 Z" fill={`url(#${skinGradId})`}/>
              <path d="M 130 130 C 146 132 158 124 162 108 C 164 102 158 98 152 104 C 146 112 140 122 128 138 Z" fill={`url(#${skinGradId})`}/>
              <circle cx="162" cy="102" r="9" fill={`url(#${skinGradId})`}/>
              <rect x="156" y="90" width="3.5" height="7" rx="1.75" fill={`url(#${skinGradId})`} transform="rotate(-15 156 90)"/>
              <rect x="162" y="88" width="3.5" height="8" rx="1.75" fill={`url(#${skinGradId})`}/>
              <rect x="168" y="91" width="3.5" height="7" rx="1.75" fill={`url(#${skinGradId})`} transform="rotate(15 168 91)"/>
            </g>
          )}

          <path d="M 90 114 L 110 114 L 108 128 L 92 128 Z" fill={`url(#${skinShadowId})`}/>
          <path d="M 92 114 L 108 114 L 106 126 L 94 126 Z" fill={`url(#${skinGradId})`}/>

          <g filter={`url(#${dropShadowId})`}>
            <path d="M 64 64 C 54 80 56 106 70 118 C 76 122 84 124 100 124 C 116 124 124 122 130 118 C 144 106 146 80 136 64 Z" fill={`url(#${hairGradId})`}/>
            <ellipse cx="64" cy="94" rx="7.5" ry="10" fill={`url(#${skinGradId})`}/>
            <ellipse cx="65" cy="94" rx="4.5" ry="6" fill="#FDBA74"/>
            <ellipse cx="136" cy="94" rx="7.5" ry="10" fill={`url(#${skinGradId})`}/>
            <ellipse cx="135" cy="94" rx="4.5" ry="6" fill="#FDBA74"/>
            <path d="M 68 84 C 68 108 82 122 100 122 C 118 122 132 108 132 84 C 132 68 118 64 100 64 C 82 64 68 68 68 84 Z" fill={`url(#${skinGradId})`}/>
            <ellipse cx="76" cy="102" rx="7" ry="4.5" fill="#F43F5E" opacity="0.28"/>
            <ellipse cx="124" cy="102" rx="7" ry="4.5" fill="#F43F5E" opacity="0.28"/>
            <path d="M 66 70 C 72 82 82 86 90 80 C 98 88 112 86 122 74 C 128 78 134 76 135 70 Z" fill={`url(#${hairGradId})`}/>
            <path d="M 72 72 Q 82 78 88 74" fill="none" stroke={`url(#${hairSheenId})`} strokeWidth="2" strokeLinecap="round"/>
            <g>
              <path d="M 65 68 C 65 40 80 32 100 32 C 120 32 135 40 135 68 C 125 64 115 62 100 62 C 85 62 75 64 65 68 Z" fill={`url(#${capGradId})`}/>
              <circle cx="100" cy="48" r="8" fill="#FFFFFF" opacity="0.95"/>
              <polygon points="100,43 103,47 106,47 103,50 105,54 100,51 95,54 97,50 94,47 97,47" fill="#15803D"/>
              <path d="M 58 66 C 68 60 100 58 142 66 C 146 72 138 78 100 78 C 62 78 54 72 58 66 Z" fill={`url(#${visorGradId})`}/>
              <path d="M 62 67 Q 100 61 138 67" stroke="#4ADE80" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8"/>
            </g>
            {isThinking ? (
              <g>
                <ellipse cx="84" cy="90" rx="7.5" ry="8.5" fill="#FFFFFF"/>
                <ellipse cx="86" cy="88" rx="5.5" ry="6" fill="#3D261D"/>
                <circle cx="86" cy="88" r="3.5" fill="#1C120C"/>
                <circle cx="88" cy="86" r="2" fill="#FFFFFF"/>
                <path d="M 76 80 Q 84 75 92 78" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round"/>
                <ellipse cx="116" cy="90" rx="7.5" ry="8.5" fill="#FFFFFF"/>
                <ellipse cx="118" cy="88" rx="5.5" ry="6" fill="#3D261D"/>
                <circle cx="118" cy="88" r="3.5" fill="#1C120C"/>
                <circle cx="120" cy="86" r="2" fill="#FFFFFF"/>
                <path d="M 108 77 Q 116 72 126 76" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round"/>
                <ellipse cx="100" cy="97" rx="2.5" ry="1.75" fill="#F97316" opacity="0.6"/>
                <path d="M 94 107 Q 100 104 108 108" fill="none" stroke="#3D261D" strokeWidth="2.5" strokeLinecap="round"/>
              </g>
            ) : isSuccess ? (
              <g>
                <path d="M 76 92 Q 84 84 92 92" fill="none" stroke="#26160F" strokeWidth="3.5" strokeLinecap="round"/>
                <path d="M 108 92 Q 116 84 124 92" fill="none" stroke="#26160F" strokeWidth="3.5" strokeLinecap="round"/>
                <ellipse cx="100" cy="97" rx="2.5" ry="1.75" fill="#F97316" opacity="0.6"/>
                <path d="M 88 103 Q 100 120 112 103 Q 100 114 88 103 Z" fill="#3D261D"/>
                <path d="M 92 110 Q 100 119 108 110 Q 100 116 92 110 Z" fill="#F43F5E"/>
              </g>
            ) : isSpeaking ? (
              <g>
                <ellipse cx="84" cy="92" rx="7.5" ry="8.5" fill="#FFFFFF"/>
                <ellipse cx="84" cy="92" rx="5.5" ry="6" fill="#3D261D"/>
                <circle cx="84" cy="92" r="3.5" fill="#1C120C"/>
                <circle cx="86" cy="89" r="2.2" fill="#FFFFFF"/>
                <path d="M 76 80 Q 84 75 92 79" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round"/>
                <ellipse cx="116" cy="92" rx="7.5" ry="8.5" fill="#FFFFFF"/>
                <ellipse cx="116" cy="92" rx="5.5" ry="6" fill="#3D261D"/>
                <circle cx="116" cy="92" r="3.5" fill="#1C120C"/>
                <circle cx="118" cy="89" r="2.2" fill="#FFFFFF"/>
                <path d="M 108 79 Q 116 74 125 79" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round"/>
                <ellipse cx="100" cy="97" rx="2.5" ry="1.75" fill="#F97316" opacity="0.6"/>
                <path d="M 91 104 Q 100 102 109 104 Q 108 116 100 116 Q 92 116 91 104 Z" fill="#3D261D"/>
                <path d="M 94 111 Q 100 116 106 111 Q 100 115 94 111 Z" fill="#F43F5E"/>
              </g>
            ) : (
              <g>
                <ellipse cx="84" cy="92" rx="7.5" ry="9" fill="#FFFFFF"/>
                <ellipse cx="84" cy="92" rx="5.5" ry="6.5" fill="#3D261D"/>
                <circle cx="84" cy="92" r="4" fill="#1C120C"/>
                <circle cx="86" cy="89" r="2.2" fill="#FFFFFF"/>
                <circle cx="82" cy="94" r="1.1" fill="#FFFFFF"/>
                <path d="M 76 81 Q 84 76 92 80" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M 110 93 Q 118 86 126 93" fill="none" stroke="#26160F" strokeWidth="3" strokeLinecap="round"/>
                <path d="M 108 78 Q 118 73 126 79" fill="none" stroke="#26160F" strokeWidth="2.5" strokeLinecap="round"/>
                <ellipse cx="100" cy="97" rx="2.5" ry="1.75" fill="#F97316" opacity="0.6"/>
                <path d="M 90 105 Q 100 115 110 105" fill="none" stroke="#3D261D" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M 93 106 Q 100 114 107 106 Q 100 111 93 106 Z" fill="#F43F5E" opacity="0.75"/>
              </g>
            )}
          </g>
        </svg>
      )}
    </div>
  )
}
