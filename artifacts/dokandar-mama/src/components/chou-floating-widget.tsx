/**
 * ChouFloatingWidget
 *
 * The single, persistent Chotu widget mounted ONCE at the app root.
 * It is draggable, minimizable, and carries page-contextual poses,
 * quick actions, speech bubbles, and the existing voice/NLP engine.
 *
 * PERFORMANCE RULES (hard):
 * - Only transform/opacity are animated. No width/height/top/left.
 * - Drag uses pointer capture + requestAnimationFrame.
 * - All poses are pure SVG/CSS — zero image loads per page change.
 * - Respects prefers-reduced-motion.
 */
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
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
// Contextual speech bubble copy per pose/mood
// ---------------------------------------------------------------------------
function contextBubble(pose: ChouPose, mood: ChouMood, name: string): string | null {
  const map: Partial<Record<ChouPose, string>> = {
    billing: mood === "excited"
      ? `বাহ্ ${name}! বিক্রি ভালোই চলছে আজ! 🎉`
      : "পণ্য স্ক্যান করুন বা নাম লিখুন — বিল রেডি হয়ে যাবে!",
    sale_done: `দারুণ! বিল সফল হয়েছে ${name}! আরও আসুক! 💰`,
    inventory: mood === "concerned"
      ? "কিছু পণ্যের স্টক কম হয়ে গেছে মামা! দেখে নিন।"
      : "সব স্টক ঠিকঠাক আছে মামা! দোকান সাজানো আছে। 🧹",
    low_stock: "মামা! এই পণ্যগুলো কম হয়ে গেছে — আজই অর্ডার দিন!",
    baki: "বাকি খাতা হালনাগাদ রাখুন মামা। পাওনা টাকা মনে রাখা জরুরি!",
    cashbox: "আজকের ক্যাশ মিলিয়ে দেখুন — সব ঠিক থাকলে বন্ধ করুন।",
    reports: "আজকের বিক্রির পুরো চিত্র এখানে আছে মামা! দেখুন।",
    offline: "নেট নেই — চিন্তা নেই! বিক্রি চলবে, নেট আসলে সিঙ্ক হবে।",
  }
  return map[pose] ?? null
}

// Map ChouPose → ChotuState for the existing avatar
function poseToAvatarState(pose: ChouPose, mood: ChouMood): ChotuState {
  if (mood === "excited" || pose === "sale_done") return "success"
  if (mood === "concerned" || pose === "low_stock" || pose === "offline") return "thinking"
  return "idle"
}

// ---------------------------------------------------------------------------
// Pose emoji / prop overlay for the SVG (rendered atop the avatar)
// ---------------------------------------------------------------------------
const POSE_PROPS: Record<ChouPose, { emoji: string; label: string }> = {
  idle: { emoji: "✨", label: "" },
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

  // Check for low stock on inventory page and upgrade pose
  const { data: products } = useListProducts()
  useEffect(() => {
    if (location.includes("/inventory") && products) {
      const lowCount = products.filter((p) => Number(p.stock) <= Number(p.lowStockThreshold ?? 5)).length
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

  // Contextual greeting on page enter (only for first 5s)
  const lastRouteRef = useRef(location)
  useEffect(() => {
    if (lastRouteRef.current === location) return
    lastRouteRef.current = location
    const msg = contextBubble(pose, mood, displayName)
    let t: ReturnType<typeof setTimeout> | undefined
    if (msg && !isMinimized) {
      // Delay so it doesn't pop up mid-transition
      t = setTimeout(() => speak(msg, 3500), 600)
    }
    return () => {
      if (t) clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  // Quick-action menu
  const [menuOpen, setMenuOpen] = useState(false)
  const quickActions = useMemo(() => quickActionsForRoute(location), [location])

  // Drag logic — pointer capture only, transform-only (no reflows)
  const widgetRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const dragStart = useRef({ px: 0, py: 0, ox: 0, oy: 0 })
  const rafRef = useRef<number | null>(null)
  const tapThreshold = 8 // px moved = drag vs tap
  const movedRef = useRef(false)

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return
      draggingRef.current = true
      movedRef.current = false
      dragStart.current = { px: e.clientX, py: e.clientY, ox: position.x, oy: position.y }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    },
    [position]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return
      const dx = e.clientX - dragStart.current.px
      const dy = e.clientY - dragStart.current.py
      if (Math.abs(dx) > tapThreshold || Math.abs(dy) > tapThreshold) {
        movedRef.current = true
      }
      if (!movedRef.current) return
      const newX = Math.max(0, Math.min(window.innerWidth - 80, dragStart.current.ox + dx))
      const newY = Math.max(0, Math.min(window.innerHeight - 120, dragStart.current.oy + dy))

      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        if (widgetRef.current) {
          widgetRef.current.style.transform = `translate(${newX}px, ${newY}px)`
        }
      })

      // Debounce persist
      dragStart.current.ox = newX
      dragStart.current.oy = newY
    },
    []
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return
      draggingRef.current = false
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)

      const dx = e.clientX - dragStart.current.px + (dragStart.current.ox - position.x)
      const dy = e.clientY - dragStart.current.py + (dragStart.current.oy - position.y)
      const newX = Math.max(0, Math.min(window.innerWidth - 80, position.x + dx + (dragStart.current.ox - position.x)))
      const newY = Math.max(0, Math.min(window.innerHeight - 120, position.y + dy + (dragStart.current.oy - position.y)))

      // Snap read from current transform
      const el = widgetRef.current
      if (el) {
        const m = new DOMMatrix(getComputedStyle(el).transform)
        setPosition({ x: m.m41, y: m.m42 })
      }

      if (!movedRef.current) {
        // It was a tap — toggle menu
        setMenuOpen((v) => !v)
      }
    },
    [position, setPosition]
  )

  // Minimized pill at edge
  if (isMinimized) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-20 right-4 z-[90] w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center text-white text-2xl"
        style={{ touchAction: "none" }}
        onClick={() => setMinimized(false)}
        aria-label="ছোটু খুলুন"
      >
        👦🏽
      </motion.button>
    )
  }

  const avatarState = poseToAvatarState(pose, mood)
  const prop = POSE_PROPS[pose]

  return (
    <div
      ref={widgetRef}
      className="fixed z-[90] select-none"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: "none",
        willChange: "transform",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Quick Action Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 10 }}
            transition={{ duration: prefersReducedMotion ? 0.05 : 0.18, ease: "easeOut" }}
            className="absolute bottom-full mb-2 right-0 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-primary/20 overflow-hidden"
            // Prevent drag on the menu itself
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Chotu mini header */}
            <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border-b border-primary/20">
              <span className="text-xs font-black text-primary">ছোটু বলছে:</span>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="বন্ধ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speech copy */}
            {bubble && (
              <div className="px-3 pt-2 pb-1 text-[11px] text-zinc-700 dark:text-zinc-300 font-medium leading-snug">
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
                    // Emit custom event for page-level handlers (add product, scan, etc.)
                    if (qa.action) window.dispatchEvent(new CustomEvent(`chotu:action:${qa.action}`))
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
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
                  window.dispatchEvent(new CustomEvent("chotu:toggle_voice"))
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
            >
              <Mic className="w-4 h-4 shrink-0" />
              <span>বলুন, ছোটু আছি!</span>
              <Zap className="w-3.5 h-3.5 ml-auto text-amber-500" />
            </button>

            {/* Minimize + Offline pill */}
            <div className="px-3 pb-2.5 pt-1 flex items-center justify-between">
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

      {/* Speech Bubble — floats above avatar, never covers nav */}
      <AnimatePresence>
        {bubble && !menuOpen && (
          <motion.div
            key={bubble}
            initial={{ scale: 0.8, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 6 }}
            transition={{ duration: prefersReducedMotion ? 0.05 : 0.2 }}
            className="absolute bottom-full mb-1.5 right-0 max-w-[200px] bg-white dark:bg-zinc-900 rounded-2xl rounded-br-none px-3 py-2 shadow-xl border border-primary/20"
            style={{ pointerEvents: "none" }}
          >
            <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
              {bubble}
            </p>
            {/* Tail */}
            <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[0] border-t-[8px] border-t-white dark:border-t-zinc-900" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chotu Avatar */}
      <div className="relative">
        {/* Pose prop badge */}
        <motion.div
          key={pose}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0.05 : 0.25, type: "spring", bounce: 0.4 }}
          className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-base border border-primary/20"
          title={prop.label}
        >
          {prop.emoji}
        </motion.div>

        {/* Idle float animation via CSS class — only translateY, 60fps */}
        <motion.div
          animate={prefersReducedMotion ? {} : {
            y: avatarState === "idle" ? [0, -6, 0] : 0,
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChotuAvatar
            state={avatarState}
            className="w-16 h-20 cursor-grab active:cursor-grabbing"
            showAura
            interactive={false}
          />
        </motion.div>

        {/* Tap hint pulse ring (shown briefly on first load) */}
        <div className="absolute inset-0 rounded-full animate-ping bg-primary/10 pointer-events-none opacity-0 [animation-iteration-count:2]" />
      </div>
    </div>
  )
}
