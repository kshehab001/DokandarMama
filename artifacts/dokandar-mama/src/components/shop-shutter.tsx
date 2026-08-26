import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, VolumeX, Store, Sparkles, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShopShutterProps {
  mode?: "daily_open" | "manual_close"
  onComplete?: () => void
  shopName?: string
  ownerName?: string
}

// Synthesizes a subtle mechanical shop shutter rolling sound via Web Audio API
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
    osc.frequency.exponentialRampToValueAtTime(isOpening ? 280 : 80, ctx.currentTime + 1.1)

    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 1.1)
  } catch {
    // Autoplay safe fallback
  }
}

export function ShopShutter({
  mode = "daily_open",
  onComplete,
  shopName = "দোকানদার মামা",
  ownerName,
}: ShopShutterProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("dokandar_sound_enabled") !== "false"
  })

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined

    if (mode === "daily_open") {
      const today = new Date().toISOString().split("T")[0]
      const lastOpenDate = localStorage.getItem("dokandar_last_shutter_open_date")

      if (lastOpenDate !== today) {
        setIsVisible(true)
        localStorage.setItem("dokandar_last_shutter_open_date", today)
        playShutterSound(true)

        timer = setTimeout(
          () => {
            setIsVisible(false)
            if (onComplete) onComplete()
          },
          prefersReducedMotion ? 600 : 2100
        )
      }
    } else {
      setIsVisible(true)
      playShutterSound(false)

      timer = setTimeout(
        () => {
          setIsVisible(false)
          if (onComplete) onComplete()
        },
        prefersReducedMotion ? 600 : 2100
      )
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [mode, onComplete, prefersReducedMotion])

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    localStorage.setItem("dokandar_sound_enabled", String(next))
  }

  if (!isVisible) return null

  const isOpening = mode === "daily_open"
  const displayName = ownerName ? `${ownerName} মামা` : "মামা"

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-zinc-950 text-white overflow-hidden select-none"
      >
        {/* Shutter Slats Background Texture */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[repeating-linear-gradient(0deg,#000,#000_12px,#222_12px,#222_24px)]" />

        {/* Top Header / Sound Toggle */}
        <div className="w-full flex items-center justify-between p-4 z-30">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm text-zinc-200">{shopName}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleSound}
            className="h-8 px-2.5 rounded-full text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>

        {/* Physical Shutter Rolling Animation */}
        <motion.div
          initial={{ y: isOpening ? "0%" : "-100%" }}
          animate={{ y: isOpening ? "-100%" : "0%" }}
          transition={{
            duration: prefersReducedMotion ? 0.3 : 1.4,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.3,
          }}
          className="absolute inset-0 bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 border-b-8 border-primary flex flex-col items-center justify-center shadow-2xl z-20"
        >
          {/* Metal Slat Lines */}
          <div className="w-full h-full flex flex-col justify-between py-6 opacity-30">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="w-full h-1 bg-zinc-700 border-t border-zinc-600" />
            ))}
          </div>

          {/* Center Signboard on Shutter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="px-5 py-2.5 rounded-2xl bg-primary/20 border border-primary/50 text-primary flex items-center gap-2 mb-3 shadow-lg"
            >
              <Store className="h-5 w-5" />
              <span className="font-black text-sm tracking-wider uppercase">{shopName}</span>
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1.5">
              {isOpening ? "দোকানের ঝাঁপ খোলা হচ্ছে..." : "দোকানের দিন সমাপ্ত হচ্ছে..."}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-zinc-400 max-w-sm">
              {isOpening
                ? "বিসমিল্লাহির রাহমানির রাহিম — আজকের শুভ সূচনা"
                : "আজকের ক্যাশ ও হিসাব সম্পন্ন! কাল আবার দেখা হবে ইনশাআল্লাহ।"}
            </p>
          </div>
        </motion.div>

        {/* Chotu Mascot Revealing Behind Shutter */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 p-6 text-center max-w-md mx-auto">
          {/* Animated Chotu Avatar */}
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="relative mb-4"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-amber-400 p-1 shadow-2xl shadow-primary/30 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-zinc-950 flex flex-col items-center justify-center text-primary relative overflow-hidden">
                {/* Chotu Animated Face Graphic */}
                <div className="text-3xl">👦🏽</div>
                <div className="text-[10px] font-black uppercase text-amber-400 tracking-tighter mt-0.5">
                  ছোটু মামা
                </div>
              </div>
            </div>
            {/* Sparkle Badge */}
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-bounce">
              {isOpening ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-1.5"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isOpening ? "দোকান খোলা প্রস্তুত!" : "আজকের শিফট বন্ধ"}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {isOpening ? `শুভ সকাল, ${displayName}!` : `ধন্যবাদ, ${displayName}!`}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium">
              {isOpening
                ? "আমি ছোটু আপনার সাথে আছি। আজকের বেচাবিক্রি দারুণ হোক!"
                : "আজকের সকল বিক্রি ও ক্যাশ ড্রয়ার নিরাপদে সংরক্ষিত হয়েছে।"}
            </p>
          </motion.div>
        </div>

        {/* Bottom Tagline & Skip Button */}
        <div className="w-full p-4 flex items-center justify-between z-30 max-w-lg mx-auto">
          <span className="text-[11px] text-zinc-500 font-semibold">
            দোকানদার মামা — স্মার্ট রিটেইল পার্টনার
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsVisible(false)
              if (onComplete) onComplete()
            }}
            className="h-8 px-3 rounded-full text-xs font-bold border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            দোকানে প্রবেশ করুন ➔
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
