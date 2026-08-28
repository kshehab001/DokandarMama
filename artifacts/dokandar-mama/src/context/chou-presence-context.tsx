/**
 * Chotu Presence Context
 *
 * Manages Chotu's emotional state, page-contextual pose, and speech bubbles
 * as a PERSISTENT, LIVING presence across all navigation — not a per-page
 * re-instantiation. Emotion state persists briefly across page changes.
 *
 * Pose vocabulary matches the 10 reference images:
 *  billing     → counting cash / billing
 *  sale_done   → celebration (big sale variant)
 *  inventory   → dusting/tidying shelves
 *  low_stock   → concerned magnifying glass
 *  baki        → writing in ledger
 *  cashbox     → stacking coins
 *  reports     → pointing at chart
 *  offline     → waiting (hands crossed)
 *  open        → pulling up shutter (opening greeting)
 *  close       → waving sign-off (closing)
 *  idle        → gentle floating bob (default)
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import { useLocation } from "wouter"

export type ChouPose =
  | "idle"
  | "billing"
  | "sale_done"
  | "inventory"
  | "low_stock"
  | "baki"
  | "cashbox"
  | "reports"
  | "offline"
  | "open"
  | "close"

export type ChouMood = "happy" | "excited" | "concerned" | "thinking" | "waiting" | "proud" | "neutral"

export interface ChouPresence {
  pose: ChouPose
  mood: ChouMood
  /** Transient speech bubble text — null when silent */
  bubble: string | null
  /** Whether Chotu is minimized to edge icon */
  isMinimized: boolean
  /** Drag position relative to viewport bottom-right */
  position: { x: number; y: number }
  /** Set a speech bubble that auto-clears after ms (default 4000) */
  speak: (text: string, durationMs?: number) => void
  /** Trigger a non-blocking milestone callout */
  milestone: (text: string) => void
  /** Force pose (caller responsible for resetting) */
  setPose: (pose: ChouPose, mood?: ChouMood) => void
  /** Dismiss speech bubble immediately */
  silence: () => void
  setMinimized: (v: boolean) => void
  setPosition: (p: { x: number; y: number }) => void
}

const ChouPresenceContext = createContext<ChouPresence | null>(null)

/** Derive the best default pose+mood for a given route */
function poseMoodForRoute(
  pathname: string,
  isOffline: boolean
): { pose: ChouPose; mood: ChouMood } {
  if (isOffline) return { pose: "offline", mood: "waiting" }
  if (pathname.includes("/billing")) return { pose: "billing", mood: "happy" }
  if (pathname.includes("/inventory")) return { pose: "inventory", mood: "neutral" }
  if (pathname.includes("/customers")) return { pose: "baki", mood: "thinking" }
  if (pathname.includes("/cashbox")) return { pose: "cashbox", mood: "happy" }
  if (pathname.includes("/reports")) return { pose: "reports", mood: "proud" }
  return { pose: "idle", mood: "neutral" }
}

interface ChouProviderProps {
  children: ReactNode
  ownerName?: string
}

const POSITION_KEY = "dokandar_chotu_pos"
const MINIMIZED_KEY = "dokandar_chotu_minimized"

export function ChouPresenceProvider({ children, ownerName }: ChouProviderProps) {
  const [location] = useLocation()
  const [pose, setPoseState] = useState<ChouPose>("idle")
  const [mood, setMoodState] = useState<ChouMood>("neutral")
  const [bubble, setBubble] = useState<string | null>(null)
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isMinimized, setMinimized] = useState(() => {
    try { return localStorage.getItem(MINIMIZED_KEY) === "true" } catch { return false }
  })
  const [position, setPositionState] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true
  const [offline, setOffline] = useState(!isOnline)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off) }
  }, [])

  // Route-based pose — runs on every navigation, but respects
  // the "emotional hold" timer so a sale-complete pose persists briefly
  const poseHoldRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [poseHeld, setPoseHeld] = useState(false)

  useEffect(() => {
    if (poseHeld) return // A special event is holding the pose
    const { pose: p, mood: m } = poseMoodForRoute(location, offline)
    setPoseState(p)
    setMoodState(m)
  }, [location, offline, poseHeld])

  // When going offline, speak a helpful message
  useEffect(() => {
    if (offline) {
      speak("চিন্তা নেই মামা! অফলাইনেও বিক্রি চলবে — ডাটা সেভ থাকবে।", 5000)
    } else if (!offline) {
      // Only say back-online if we were previously offline (avoid on first render)
      speak("নেট ফিরে এসেছে! সব ডাটা সিঙ্ক হচ্ছে। 📡", 3500)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline])

  const speak = useCallback((text: string, durationMs = 4000) => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    setBubble(text)
    bubbleTimer.current = setTimeout(() => setBubble(null), durationMs)
  }, [])

  const silence = useCallback(() => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    setBubble(null)
  }, [])

  const milestone = useCallback((text: string) => {
    speak(`🎉 ${text}`, 6000)
    setMoodState("excited")
    // Reset mood after
    setTimeout(() => setMoodState("happy"), 6500)
  }, [speak])

  const setPose = useCallback((p: ChouPose, m?: ChouMood) => {
    setPoseState(p)
    if (m) setMoodState(m)
    // Hold this pose for 4 seconds before route-driven pose can override
    setPoseHeld(true)
    if (poseHoldRef.current) clearTimeout(poseHoldRef.current)
    poseHoldRef.current = setTimeout(() => setPoseHeld(false), 4000)
  }, [])

  const setMinimizedPersist = useCallback((v: boolean) => {
    setMinimized(v)
    try { localStorage.setItem(MINIMIZED_KEY, String(v)) } catch {}
  }, [])

  const setPosition = useCallback((p: { x: number; y: number }) => {
    setPositionState(p)
    try { localStorage.setItem(POSITION_KEY, JSON.stringify(p)) } catch {}
  }, [])

  return (
    <ChouPresenceContext.Provider
      value={{
        pose,
        mood,
        bubble,
        isMinimized,
        position,
        speak,
        milestone,
        setPose,
        silence,
        setMinimized: setMinimizedPersist,
        setPosition,
      }}
    >
      {children}
    </ChouPresenceContext.Provider>
  )
}

export function useChouPresence(): ChouPresence {
  const ctx = useContext(ChouPresenceContext)
  if (!ctx) throw new Error("useChouPresence must be inside ChouPresenceProvider")
  return ctx
}
