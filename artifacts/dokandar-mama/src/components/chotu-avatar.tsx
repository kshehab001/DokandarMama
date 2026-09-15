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

// Map of all poses to 3D WebP sprites (matching the authentic Genie Chotu character)
const SPRITE_MAP: Record<string, string> = {
  idle: "/assets/chotu/webp/idle.webp",
  listening: "/assets/chotu/webp/listening.webp",
  thinking: "/assets/chotu/webp/thinking.webp",
  speaking: "/assets/chotu/webp/speaking.webp",
  success: "/assets/chotu/webp/success.webp",
  billing: "/assets/chotu/webp/billing.webp",
  sale_done: "/assets/chotu/webp/success.webp",
  growth: "/assets/chotu/webp/success.webp",
  low_stock: "/assets/chotu/webp/thinking.webp",
  expiry: "/assets/chotu/webp/thinking.webp",
  dusting: "/assets/chotu/webp/thinking.webp",
  cashbox: "/assets/chotu/webp/idle.webp",
  baki: "/assets/chotu/webp/idle.webp",
  ledger: "/assets/chotu/webp/idle.webp",
  incoming: "/assets/chotu/webp/idle.webp",
  packaging: "/assets/chotu/webp/idle.webp",
  shutter: "/assets/chotu/webp/idle.webp",
  open: "/assets/chotu/webp/idle.webp",
  close: "/assets/chotu/webp/idle.webp",
  offline: "/assets/chotu/webp/idle.webp",
}

function getSpriteUrl(resolvedPose: string): string {
  return SPRITE_MAP[resolvedPose] || "/assets/chotu/webp/idle.webp"
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

  const [currentSprite, setCurrentSprite] = useState<string>(() => getSpriteUrl(activePose))
  const [prevSprite, setPrevSprite] = useState<string | null>(null)
  const [fadeIn, setFadeIn] = useState(true)

  useEffect(() => {
    const next = getSpriteUrl(activePose)
    if (next === currentSprite) return
    setPrevSprite(currentSprite)
    setFadeIn(false)
    const t = setTimeout(() => {
      setCurrentSprite(next)
      setFadeIn(true)
    }, 150)
    return () => clearTimeout(t)
  }, [activePose]) // eslint-disable-line

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center select-none",
        interactive && "cursor-pointer active:scale-95 hover:scale-105",
        className
      )}
      style={{
        width: className?.includes("w-") ? undefined : sizeDimensions.width,
        height: className?.includes("h-") ? undefined : sizeDimensions.height,
        transition: "transform 0.2s ease",
      }}
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

      <div className="relative w-full h-full chotu-bob flex items-center justify-center">
        {prevSprite && (
          <img
            src={prevSprite}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ opacity: fadeIn ? 0 : 1, transition: "opacity 0.2s ease" }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = "/assets/chotu/webp/idle.webp"
            }}
          />
        )}
        <img
          src={currentSprite}
          alt="Chotu"
          className="w-full h-full object-contain"
          style={{
            opacity: fadeIn ? 1 : 0,
            transition: "opacity 0.2s ease",
            filter: isListening
              ? "drop-shadow(0 0 10px rgba(6,182,212,0.7))"
              : isSuccess
              ? "drop-shadow(0 0 12px rgba(34,197,94,0.6))"
              : isThinking
              ? "drop-shadow(0 0 10px rgba(245,158,11,0.6))"
              : "drop-shadow(0 2px 8px rgba(0,0,0,0.18))",
          }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = "/assets/chotu/webp/idle.webp"
          }}
        />
      </div>
    </div>
  )
}

