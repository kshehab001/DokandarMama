import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, VolumeX, Store, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShopShutterProps {
  mode?: "daily_open" | "manual_close"
  onComplete?: () => void
  shopName?: string
}

// Synthesizes a subtle, mechanical shop shutter rolling sound using Web Audio API
function playShutterSound(isOpening: boolean) {
  try {
    const isSoundEnabled = localStorage.getItem("dokandar_sound_enabled") !== "false"
    if (!isSoundEnabled) return

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === "suspended") {
      ctx.resume()
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(isOpening ? 120 : 180, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(isOpening ? 280 : 80, ctx.currentTime + 1.2)

    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 1.2)
  } catch {
    // Graceful fallback if browser restricts audio
  }
}

export function ShopShutter({
  mode = "daily_open",
  onComplete,
  shopName = "দোকানদার মামা",
}: ShopShutterProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("dokandar_sound_enabled") !== "false"
  })

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined

    if (mode === "daily_open") {
      const today = new Date().toISOString().split("T")[0]
      const lastOpenDate = localStorage.getItem("dokandar_last_shutter_open_date")

      if (lastOpenDate !== today) {
        setIsVisible(true)
        localStorage.setItem("dokandar_last_shutter_open_date", today)
        playShutterSound(true)

        timer = setTimeout(() => {
          setIsVisible(false)
          if (onComplete) onComplete()
        }, 1800)
      }
    } else {
      setIsVisible(true)
      playShutterSound(false)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [mode, onComplete])

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    localStorage.setItem("dokandar_sound_enabled", String(next))
  }

  if (!isVisible) return null

  const isOpening = mode === "daily_open"

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-zinc-950 text-white overflow-hidden select-none"
      >
        {/* Shutter Slats Background Pattern */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[repeating-linear-gradient(0deg,#000,#000_12px,#222_12px,#222_24px)]" />

        {/* Top Header / Sound Toggle */}
        <div className="w-full flex items-center justify-between p-4 z-10">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm text-zinc-300">{shopName}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleSound}
            className="h-8 px-2.5 rounded-full text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>

        {/* Shutter Body with Rolling Animation */}
        <motion.div
          initial={{ y: isOpening ? "0%" : "-100%" }}
          animate={{ y: isOpening ? "-100%" : "0%" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="absolute inset-0 bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 border-b-8 border-primary flex flex-col items-center justify-center shadow-2xl z-20"
        >
          {/* Slat Lines */}
          <div className="w-full h-full flex flex-col justify-between py-6 opacity-30">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="w-full h-1 bg-zinc-700 border-t border-zinc-600" />
            ))}
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center mb-4 shadow-lg">
              <Store className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-1">
              {isOpening ? "দোকান খোলা হচ্ছে..." : "দোকানের দিন শেষ হচ্ছে..."}
            </h2>
            <p className="text-sm font-medium text-zinc-400 max-w-xs">
              {isOpening
                ? "বিসমিল্লাহির রাহমানির রাহিম — আজকের শুভ সূচনা"
                : "আজকের হিসাব সম্পন্ন! কাল আবার দেখা হবে ইনশাআল্লাহ।"}
            </p>
          </div>
        </motion.div>

        {/* Revealed Content Behind Shutter */}
        <div className="flex-1 flex flex-col items-center justify-center z-0 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-white">দোকান প্রস্তুত!</h3>
          <p className="text-xs text-zinc-400 mt-1">সব হিসাব ও ইনভেন্টরি লোড হয়েছে</p>
        </div>

        {/* Bottom Bar */}
        <div className="w-full p-4 text-center text-[11px] text-zinc-600 z-10">
          দোকানদার মামা — ডিজিটাল রিটেইল অ্যাসিস্ট্যান্ট
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
