/**
 * ChouFloatingWidget
 *
 * The single, persistent Chotu genie widget mounted ONCE at the app root.
 * Fully draggable anywhere across the screen, minimizable, and carries
 * page-contextual poses, quick actions, speech bubbles, and voice engine.
 */
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { useLocation } from "wouter"
import { useUser } from "@clerk/react"
import {
  ShoppingCart,
  Package,
  Users,
  Wallet,
  BarChart3,
  Camera,
  Mic,
  X,
  ChevronRight,
  Zap,
  PlusCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useChouPresence, type ChouPose, type ChouMood } from "@/context/chou-presence-context"
import { ChotuAvatar } from "@/components/chotu-avatar"
import { type ChotuState } from "@/lib/chotu-config"
import { useOfflineSync } from "@/lib/offline-sync"
import { useListProducts } from "@workspace/api-client-react"

// ---------------------------------------------------------------------------
// Contextual quick-action definitions per route
// ---------------------------------------------------------------------------
interface QuickAction {
  icon: React.FC<{ className?: string }>
  labelBn: string
  labelEn: string
  href?: string
  action?: string
}

function quickActionsForRoute(pathname: string): QuickAction[] {
  if (pathname.includes("/billing")) {
    return [
      { icon: Camera, labelBn: "বারকোড স্ক্যান", labelEn: "Scan Barcode", action: "scan" },
      { icon: ShoppingCart, labelBn: "নতুন বিল", labelEn: "New Bill", action: "clear_cart" },
      { icon: Users, labelBn: "বাকি দেখুন", labelEn: "View Baki", href: "/app/customers" },
    ]
  }
  if (pathname.includes("/inventory")) {
    return [
      { icon: PlusCircle, labelBn: "নতুন পণ্য", labelEn: "Add Product", action: "add_product" },
      { icon: Camera, labelBn: "বারকোড স্ক্যান", labelEn: "Scan", action: "scan" },
      { icon: Package, labelBn: "স্টক রিপোর্ট", labelEn: "Stock Report", href: "/app/reports" },
    ]
  }
  if (pathname.includes("/customers")) {
    return [
      { icon: ShoppingCart, labelBn: "বিল করুন", labelEn: "New Sale", href: "/app/billing" },
      { icon: Users, labelBn: "নতুন কাস্টমার", labelEn: "Add Customer", action: "add_customer" },
      { icon: Wallet, labelBn: "ক্যাশ বক্স", labelEn: "Cash Box", href: "/app/cashbox" },
    ]
  }
  if (pathname.includes("/cashbox")) {
    return [
      { icon: ShoppingCart, labelBn: "বিক্রি করুন", labelEn: "New Sale", href: "/app/billing" },
      { icon: BarChart3, labelBn: "রিপোর্ট", labelEn: "Reports", href: "/app/reports" },
    ]
  }
  if (pathname.includes("/reports")) {
    return [
      { icon: ShoppingCart, labelBn: "বিক্রি শুরু", labelEn: "Start Selling", href: "/app/billing" },
      { icon: Package, labelBn: "স্টক চেক", labelEn: "Check Stock", href: "/app/inventory" },
    ]
  }
  // Dashboard / default
  return [
    { icon: ShoppingCart, labelBn: "নতুন বিক্রি", labelEn: "New Sale", href: "/app/billing" },
    { icon: Package, labelBn: "স্টক যোগ করুন", labelEn: "Add Stock", href: "/app/inventory" },
    { icon: Users, labelBn: "বাকি খাতা", labelEn: "Baki Ledger", href: "/app/customers" },
    { icon: Wallet, labelBn: "ক্যাশ বক্স", labelEn: "Cash Box", href: "/app/cashbox" },
  ]
}

// ---------------------------------------------------------------------------
// Contextual speech bubble copy per route & mood
// ---------------------------------------------------------------------------
function contextBubbleForRoute(pathname: string, mood: ChouMood, name: string): string | null {
  if (pathname.includes("/billing")) {
    return mood === "excited"
      ? `বাহ্ ${name}! বিক্রি ভালোই চলছে আজ! 🎉`
      : "পণ্য স্ক্যান করুন বা নাম লিখুন — বিল রেডি হয়ে যাবে! ⚡"
  }
  if (pathname.includes("/inventory")) {
    return mood === "concerned"
      ? "কিছু পণ্যের স্টক কম হয়ে গেছে মামা! দেখে নিন।"
      : "সব স্টক ঠিকঠাক আছে মামা! দোকান সাজানো আছে। 🧹"
  }
  if (pathname.includes("/customers")) {
    return "বাকি খাতা হালনাগাদ রাখুন মামা। পাওনা টাকা মনে রাখা জরুরি! 📒"
  }
  if (pathname.includes("/cashbox")) {
    return "আজকের ক্যাশ মিলিয়ে দেখুন — সব ঠিক থাকলে বন্ধ করুন। 💰"
  }
  if (pathname.includes("/reports")) {
    return "আজকের বিক্রির পুরো চিত্র এখানে আছে মামা! দেখুন। 📊"
  }
  return `দোকানদার মামা রেডি ${name}! যেকোনো সাহায্য লাগলে ডাকুন। ✨`
}

// Map ChouPose → ChotuState for the existing avatar
function poseToAvatarState(pose: ChouPose, mood: ChouMood): ChotuState {
  if (mood === "excited" || pose === "sale_done") return "success"
  if (mood === "concerned" || pose === "low_stock" || pose === "offline") return "thinking"
  if (pose === "listening") return "listening"
  return "idle"
}

// ---------------------------------------------------------------------------
// Pose emoji / prop overlay for the badge (rendered atop the avatar)
// ---------------------------------------------------------------------------
const POSE_PROPS: Record<ChouPose, { emoji: string; label: string }> = {
  idle: { emoji: "✨", label: "" },
  listening: { emoji: "🎙️", label: "শুনছি" },
  billing: { emoji: "🧾", label: "বিল" },
  sale_done: { emoji: "🎉", label: "বিক্রি!" },
  inventory: { emoji: "🧹", label: "স্টক" },
  low_stock: { emoji: "⚠️", label: "কম স্টক" },
  baki: { emoji: "📒", label: "বাকি" },
  cashbox: { emoji: "💰", label: "ক্যাশ" },
  reports: { emoji: "📊", label: "রিপোর্ট" },
  offline: { emoji: "📵", label: "অফলাইন" },
  open: { emoji: "🌅", label: "খোলা" },
  close: { emoji: "🌙", label: "বন্ধ" },
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
interface ChouFloatingWidgetProps {
  /** Called when user taps the mic — delegates to existing voice engine */
  onMicClick?: () => void
  /** Language context from LanguageProvider */
  language?: "bn" | "en"
}

export function ChouFloatingWidget({ onMicClick, language = "bn" }: ChouFloatingWidgetProps) {
  const [location, setLocation] = useLocation()
  const { user } = useUser()
  const displayName = (user?.unsafeMetadata as any)?.displayName || user?.firstName || "মামা"

  const { pose, mood, bubble, isMinimized, position, speak, setPose, silence, setMinimized, setPosition } =
    useChouPresence()

  const { pendingCount } = useOfflineSync()

  // Default coordinate computation based on viewport size
  const getDefaultCoords = useCallback(() => {
    if (typeof window === "undefined") return { x: 300, y: 500 }
    const defaultX = Math.max(16, window.innerWidth - 90)
    const defaultY = Math.max(16, window.innerHeight - 150)
    return { x: defaultX, y: defaultY }
  }, [])

  // Local position state for 100% fluid dragging
  const [coords, setCoords] = useState<{ x: number; y: number }>(() => {
    if (position && (position.x > 0 || position.y > 0)) {
      // Bounds check stored position against current window
      if (typeof window !== "undefined") {
        const clampedX = Math.max(12, Math.min(window.innerWidth - 88, position.x))
        const clampedY = Math.max(12, Math.min(window.innerHeight - 110, position.y))
        return { x: clampedX, y: clampedY }
      }
      return position
    }
    return getDefaultCoords()
  })

  // Keep coords clamped if window resizes
  useEffect(() => {
    const handleResize = () => {
      setCoords((prev) => {
        const clampedX = Math.max(12, Math.min(window.innerWidth - 88, prev.x))
        const clampedY = Math.max(12, Math.min(window.innerHeight - 110, prev.y))
        return { x: clampedX, y: clampedY }
      })
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Check for low stock on inventory page and upgrade pose
  const { data: products } = useListProducts()
  useEffect(() => {
    if (location.includes("/inventory") && products) {
      const lowCount = products.filter((p: any) => Number(p.stock) <= Number(p.lowStockThreshold ?? 5)).length
      if (lowCount > 0) {
        setPose("low_stock", "concerned")
        speak(
          language === "bn"
            ? `মামা! ${lowCount} টি পণ্যের স্টক কম। এখনই দেখুন।`
            : `${lowCount} products running low on stock!`,
          5000
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, products])

  // Contextual greeting on page navigation
  const lastRouteRef = useRef(location)
  useEffect(() => {
    if (lastRouteRef.current === location) return
    lastRouteRef.current = location
    const msg = contextBubbleForRoute(location, mood, displayName)
    let t: ReturnType<typeof setTimeout> | undefined
    if (msg && !isMinimized) {
      t = setTimeout(() => speak(msg, 3500), 400)
    }
    return () => {
      if (t) clearTimeout(t)
    }
  }, [location, mood, displayName, isMinimized, speak])

  // Quick-action menu
  const [menuOpen, setMenuOpen] = useState(false)
  const quickActions = useMemo(() => quickActionsForRoute(location), [location])

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // Drag tracking to distinguish click vs drag
  const isDraggingRef = useRef(false)
  const dragDistanceRef = useRef(0)

  const handleDragStart = () => {
    isDraggingRef.current = true
    dragDistanceRef.current = 0
  }

  const handleDrag = (_: any, info: PanInfo) => {
    dragDistanceRef.current = Math.hypot(info.offset.x, info.offset.y)
  }

  const handleDragEnd = (_: any, info: PanInfo) => {
    setTimeout(() => {
      isDraggingRef.current = false
    }, 50)

    const finalX = Math.max(12, Math.min(window.innerWidth - 88, coords.x + info.offset.x))
    const finalY = Math.max(12, Math.min(window.innerHeight - 110, coords.y + info.offset.y))
    const newPos = { x: finalX, y: finalY }
    setCoords(newPos)
    setPosition(newPos)
  }

  const handleAvatarTap = () => {
    // If the user was dragging, do not open menu
    if (dragDistanceRef.current > 6) return
    setMenuOpen((prev) => !prev)
  }

  // Minimized pill at edge
  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-20 right-4 z-[90] w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center text-white text-2xl hover:scale-105 active:scale-95 transition-transform"
        onClick={() => setMinimized(false)}
        aria-label="ছোটু খুলুন"
      >
        👦🏽
      </motion.button>
    )
  }

  const avatarState = poseToAvatarState(pose, mood)
  const prop = POSE_PROPS[pose] || POSE_PROPS.idle

  // Adaptive positioning for menu & speech bubble based on quadrant
  const isTopHalf = coords.y < 260
  const isLeftHalf = coords.x < 220

  const popupPlacementClass = cn(
    "absolute",
    isTopHalf ? "top-full mt-2" : "bottom-full mb-2",
    isLeftHalf ? "left-0" : "right-0"
  )

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.06}
      dragConstraints={{
        left: 12,
        right: typeof window !== "undefined" ? window.innerWidth - 88 : 300,
        top: 12,
        bottom: typeof window !== "undefined" ? window.innerHeight - 110 : 500,
      }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{
        x: coords.x,
        y: coords.y,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 90,
        touchAction: "none",
      }}
      className="select-none"
    >
      {/* Quick Action Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: isTopHalf ? -10 : 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: isTopHalf ? -10 : 10 }}
            transition={{ duration: prefersReducedMotion ? 0.05 : 0.18, ease: "easeOut" }}
            className={cn(
              popupPlacementClass,
              "w-52 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-primary/20 overflow-hidden"
            )}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Chotu mini header */}
            <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border-b border-primary/20">
              <span className="text-xs font-black text-primary">ছোটু বলছে:</span>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
                aria-label="বন্ধ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speech copy */}
            {bubble && (
              <div className="px-3 pt-2.5 pb-1.5 text-[11px] text-zinc-700 dark:text-zinc-300 font-medium leading-snug">
                {bubble}
              </div>
            )}

            {/* Quick actions */}
            <div className="py-1">
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    if (qa.href) setLocation(qa.href)
                    if (qa.action) window.dispatchEvent(new CustomEvent(`chotu:action:${qa.action}`))
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
                >
                  <qa.icon className="w-4 h-4 text-primary shrink-0" />
                  <span>{language === "bn" ? qa.labelBn : qa.labelEn}</span>
                  <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* Mic shortcut */}
            <div className="border-t border-border mx-3" />
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(false)
                if (onMicClick) {
                  onMicClick()
                } else {
                  window.dispatchEvent(new CustomEvent("chotu:open_panel"))
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("chotu:toggle_voice"))
                  }, 80)
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
            >
              <Mic className="w-4 h-4 shrink-0" />
              <span>বলুন, ছোটু আছি!</span>
              <Zap className="w-3.5 h-3.5 ml-auto text-amber-500" />
            </button>

            {/* Minimize + Offline pill */}
            <div className="px-3 pb-2.5 pt-1 flex items-center justify-between border-t border-border/40">
              {pendingCount > 0 && (
                <span className="text-[10px] text-amber-600 font-bold">
                  📵 {pendingCount} অপেক্ষমাণ
                </span>
              )}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setMinimized(true) }}
                className="text-[10px] text-muted-foreground hover:text-foreground ml-auto"
              >
                ছোট করুন ↘
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Bubble — floats adaptively above or below avatar */}
      <AnimatePresence>
        {bubble && !menuOpen && (
          <motion.div
            key={bubble}
            initial={{ scale: 0.8, opacity: 0, y: isTopHalf ? -6 : 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: isTopHalf ? -6 : 6 }}
            transition={{ duration: prefersReducedMotion ? 0.05 : 0.2 }}
            className={cn(
              popupPlacementClass,
              "max-w-[210px] bg-white dark:bg-zinc-900 rounded-2xl px-3 py-2 shadow-xl border border-primary/20",
              isTopHalf
                ? (isLeftHalf ? "rounded-tl-none" : "rounded-tr-none")
                : (isLeftHalf ? "rounded-bl-none" : "rounded-br-none")
            )}
            style={{ pointerEvents: "none" }}
          >
            <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
              {bubble}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chotu Avatar Container */}
      <div
        className="relative cursor-grab active:cursor-grabbing"
        onClick={handleAvatarTap}
      >
        {/* Pose prop badge */}
        <motion.div
          key={pose}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0.05 : 0.25, type: "spring", bounce: 0.4 }}
          className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-base border border-primary/20"
          title={prop.label}
        >
          {prop.emoji}
        </motion.div>

        {/* Gentle floating animation */}
        <motion.div
          animate={prefersReducedMotion ? {} : {
            y: avatarState === "idle" ? [0, -6, 0] : 0,
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChotuAvatar
            state={avatarState}
            pose={pose}
            className="w-16 h-20"
            showAura
            interactive={false}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
