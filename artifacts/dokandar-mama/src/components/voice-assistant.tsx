import { useState, useEffect, useRef } from "react"
import {
  Mic,
  MicOff,
  X,
  Loader2,
  Sparkles,
  Camera,
  PlusCircle,
  Receipt,
  Package,
  Wand2,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { useShopTheme } from "@/context/shop-theme-context"
import { useLocation } from "wouter"
import {
  useGetDashboardOverview,
  useListCustomers,
  useListProducts,
  useGetSalesSummary,
  useGetTopProducts,
  useGetRestockSuggestions,
  useGetCashboxState,
  useCreateSale,
  useRecordCustomerPayment,
  getListProductsQueryKey,
  getListCustomersQueryKey,
  getGetDashboardOverviewQueryKey,
  getGetSalesSummaryQueryKey,
  getGetTopProductsQueryKey,
  getGetRestockSuggestionsQueryKey,
  getGetCashboxStateQueryKey,
  getProductByBarcode,
} from "@workspace/api-client-react"
import {
  type ChotuConfig,
  type ChotuState,
  loadSavedChotuConfig,
  saveChotuConfig,
  DEFAULT_CHOTU_CONFIG,
} from "@/lib/chotu-config"
import { ChotuAvatar } from "./chotu-avatar"
import { ChotuCustomizerDialog } from "./chotu-customizer-dialog"
import { BarcodeScannerDialog } from "./barcode-scanner-dialog"
import { useToast } from "@/hooks/use-toast"

// Bangla digits <-> Latin digits, so spoken/typed numerals of either script work.
const BN_DIGITS = "০১২৩৪৫৬৭৮৯"
function normalizeDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
}

function normalize(text: string): string {
  return normalizeDigits(text)
    .toLowerCase()
    .replace(/[।,.?!""''"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function looseIncludes(haystack: string, needle: string): boolean {
  const h = haystack.replace(/\s+/g, "")
  const n = needle.replace(/\s+/g, "")
  return n.length > 0 && h.includes(n)
}

const HELP_TEXT =
  "মামা, আপনি জিজ্ঞেস করতে পারেন: 'আজকের বিক্রি কত', 'মোট বাকি কত', '[নাম] এর বাকি কত', '[প্রোডাক্ট] এর স্টক কত', 'কোন প্রোডাক্ট স্টকে কম আছে', 'সবচেয়ে বেশি বিক্রি হওয়া প্রোডাক্ট'। এছাড়া বলতে পারেন: '২ কেজি চাল বিক্রি করলাম নগদে', অথবা 'রহিম ৫০০ টাকা দিলো'।"

export function VoiceAssistant() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { category } = useShopTheme()

  // Chotu configuration and state
  const [chotuConfig, setChotuConfig] = useState<ChotuConfig>(() => loadSavedChotuConfig())
  const [chotuState, setChotuState] = useState<ChotuState>("idle")
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // Floating Position & Drag State
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem("dokandar_chotu_position")
      if (saved) return JSON.parse(saved)
    } catch {}
    return { x: 24, y: 32 } // Offset from bottom-right in px
  })
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef<{ clientX: number; clientY: number; posX: number; posY: number }>({
    clientX: 0,
    clientY: 0,
    posX: 24,
    posY: 32,
  })

  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [notSupported, setNotSupported] = useState(false)
  const [isActing, setIsActing] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const keepAliveRef = useRef<number | null>(null)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const voicesReadyRef = useRef(false)
  const processedRef = useRef(false)
  const langFallbackRef = useRef(false)
  const successTimerRef = useRef<number | null>(null)

  // Fetch contextual data so we can answer questions without a round trip per query.
  const { data: dashboard } = useGetDashboardOverview()
  const { data: customers } = useListCustomers()
  const { data: products } = useListProducts()
  const { data: weekSummary } = useGetSalesSummary({ range: "week" })
  const { data: topProducts } = useGetTopProducts({ range: "week" })
  const { data: restockSuggestions } = useGetRestockSuggestions()
  const { data: cashboxState } = useGetCashboxState()

  const createSale = useCreateSale()
  const recordPayment = useRecordCustomerPayment()

  const invalidateShopData = () => {
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() })
    queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetSalesSummaryQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetTopProductsQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetRestockSuggestionsQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetCashboxStateQueryKey() })
  }

  // Update Chotu visual state based on active events
  useEffect(() => {
    if (isActing) {
      setChotuState("thinking")
    } else if (isListening) {
      setChotuState("listening")
    } else if (isSpeaking) {
      setChotuState("speaking")
    } else {
      setChotuState("idle")
    }
  }, [isActing, isListening, isSpeaking])

  const triggerSuccessState = () => {
    setChotuState("success")
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    successTimerRef.current = window.setTimeout(() => {
      setChotuState("idle")
    }, 2800)
  }

  const triggerErrorState = () => {
    setChotuState("error")
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    successTimerRef.current = window.setTimeout(() => {
      setChotuState("idle")
    }, 3000)
  }

  // Voice Recognition Setup
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setNotSupported(true)
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = chotuConfig.language === "en" ? "en-US" : "bn-BD"
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 3

    recognition.onresult = (event: any) => {
      const current = event.resultIndex
      const result = event.results[current][0].transcript
      setTranscript(result)
      const alternatives: string[] = []
      for (let i = 0; i < event.results[current].length; i++) {
        alternatives.push(event.results[current][i].transcript)
      }
      if (event.results[current].isFinal) {
        processedRef.current = true
        void processCommand(result, alternatives)
      }
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error)
      if (event.error === "no-speech") {
        setIsListening(false)
        return
      }
      if (event.error === "language-not-supported" && !langFallbackRef.current) {
        langFallbackRef.current = true
        recognition.lang = "en-US"
        try {
          recognition.start()
          return
        } catch {}
      }
      setIsListening(false)
      triggerErrorState()
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [chotuConfig.language])

  // Dragging Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on left click / single touch
    if (e.button !== 0) return
    isDraggingRef.current = false
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: position.x,
      posY: position.y,
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = dragStartRef.current.clientX - moveEvent.clientX
      const deltaY = dragStartRef.current.clientY - moveEvent.clientY
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        isDraggingRef.current = true
      }
      if (isDraggingRef.current) {
        const newX = Math.max(12, Math.min(window.innerWidth - 80, dragStartRef.current.posX + deltaX))
        const newY = Math.max(12, Math.min(window.innerHeight - 100, dragStartRef.current.posY + deltaY))
        setPosition({ x: newX, y: newY })
      }
    }

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      if (isDraggingRef.current) {
        try {
          localStorage.setItem("dokandar_chotu_position", JSON.stringify(position))
        } catch {}
      }
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  // Text-To-Speech
  const startKeepAlive = () => {
    stopKeepAlive()
    keepAliveRef.current = window.setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 3500)
  }

  const stopKeepAlive = () => {
    if (keepAliveRef.current !== null) {
      window.clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }
  }

  const resolveVoice = (): Promise<SpeechSynthesisVoice | null> => {
    return new Promise((resolve) => {
      if (voicesReadyRef.current) {
        resolve(voiceRef.current)
        return
      }
      const pick = () => {
        const voices = window.speechSynthesis.getVoices()
        const banglaVoice =
          voices.find((v) => v.lang?.toLowerCase() === "bn-bd") ??
          voices.find((v) => v.lang?.toLowerCase().startsWith("bn")) ??
          null
        voiceRef.current = banglaVoice
        voicesReadyRef.current = true
        return banglaVoice
      }
      const existing = window.speechSynthesis.getVoices()
      if (existing.length > 0) {
        resolve(pick())
        return
      }
      const timeout = window.setTimeout(() => resolve(pick()), 800)
      window.speechSynthesis.onvoiceschanged = () => {
        window.clearTimeout(timeout)
        resolve(pick())
      }
    })
  }

  const speak = async (text: string) => {
    if (!("speechSynthesis" in window) || chotuConfig.isMuted) return

    window.speechSynthesis.cancel()
    stopKeepAlive()

    const voice = await resolveVoice()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "bn-BD"
    utterance.rate = 0.95
    if (voice) utterance.voice = voice

    utterance.onstart = () => {
      setIsSpeaking(true)
      startKeepAlive()
    }
    utterance.onend = () => {
      setIsSpeaking(false)
      stopKeepAlive()
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      stopKeepAlive()
    }

    window.speechSynthesis.speak(utterance)
    synthesisRef.current = utterance
  }

  // Personality Prefix / Salutation
  const getPersonalityGreeting = (): string => {
    switch (chotuConfig.personality) {
      case "funny":
        return "আরে মামা! "
      case "helpful":
        return "মামা, আমি দেখছি! "
      case "local_vibe":
        return "হুকুম মামা! "
      case "smart":
        return "রিয়েল-টাইম ডাটা অনুযায়ী, "
      case "friendly":
      default:
        return "মামা, "
    }
  }

  // Command Processing Logic
  const processCommand = async (rawText: string, alternatives: string[] = []) => {
    setIsActing(true)
    const candidates = [rawText, ...alternatives].map(normalize)
    const has = (...needles: string[]) =>
      candidates.some((c) => needles.some((n) => looseIncludes(c, normalize(n))))

    let reply = ""
    let success = false

    try {
      // 1. Dashboard Overview Queries
      if (has("আজকের বিক্রি", "আজকে কত বিক্রি", "আজকের বেচাকেনা", "আজকে কত টাকা বেচা")) {
        const total = dashboard?.todaySalesTotal ?? 0
        const count = dashboard?.todayTransactionCount ?? 0
        reply = `${getPersonalityGreeting()}আজকে মোট ${count} টি বিক্রয়ে ৳${total} টাকা বিক্রি হয়েছে।`
        success = true
      } else if (has("মোট বাকি", "দোকানের মোট বাকি", "সব বাকি কত", "কাস্টমারের বাকি")) {
        const totalDue = dashboard?.totalDue ?? 0
        reply = `${getPersonalityGreeting()}দোকানের বর্তমান মোট বাকি ৳${totalDue} টাকা।`
        success = true
      } else if (has("স্টকে কম", "কম স্টক", "কোন পণ্য কম", "কি কি শেষ")) {
        const lowCount = dashboard?.lowStockCount ?? 0
        reply = `${getPersonalityGreeting()}বর্তমানে ${lowCount} টি পণ্যের স্টক কম রয়েছে।`
        success = true
      } else if (has("কাস্টমার কতজন", "মোট কাস্টমার", "কাস্টমার সংখ্যা")) {
        const custCount = dashboard?.customerCount ?? 0
        reply = `${getPersonalityGreeting()}দোকানে মোট ${custCount} জন কাস্টমার নিবন্ধিত আছে।`
        success = true
      } else if (has("টাকা জমা", "নগদ দিলো", "বাকি দিলো", "পরিশোধ করলো")) {
        // e.g. "রহিম ৫০০ টাকা দিলো"
        const numMatch = candidates[0].match(/(\d+)/)
        const amount = numMatch ? Number(numMatch[1]) : null
        if (amount && customers && customers.length > 0) {
          const matchedCust = customers.find((c) => candidates[0].includes(c.name.toLowerCase()))
          if (matchedCust) {
            await recordPayment.mutateAsync({
              id: matchedCust.id,
              data: { amount, note: "ছোটু ভয়েস এন্ট্রি" },
            })
            invalidateShopData()
            reply = `${getPersonalityGreeting()}${matchedCust.name}-এর ৳${amount} টাকা জমা নেওয়া হয়েছে।`
            success = true
          } else {
            reply = "মামা, কাস্টমারের নাম বুঝতে পারিনি। অনুগ্রহ করে নাম ও পরিমাণ পরিষ্কার করে বলুন।"
          }
        } else {
          reply = "মামা, কাস্টমারের নাম এবং কত টাকা দিলো তা স্পষ্ট করে বলুন।"
        }
      } else {
        reply = `${getPersonalityGreeting()}আমি আপনার কথা শুনেছি ("${rawText}")। আজকের বিক্রি, মোট বাকি বা স্টক সম্পর্কে জানতে পারেন।`
        success = true
      }
    } catch (e) {
      console.error("Command execution error", e)
      reply = "মামা, কাজটি সম্পন্ন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।"
      triggerErrorState()
    }

    setIsActing(false)
    setResponse(reply)
    if (success) triggerSuccessState()
    void speak(reply)
  }

  const toggleListening = () => {
    if (notSupported) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setTranscript("")
      setResponse("")
      processedRef.current = false
      setIsOpen(true)
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (e) {
        console.error("Failed to start listening", e)
      }
    }
  }

  const closePanel = () => {
    setIsOpen(false)
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }
    window.speechSynthesis.cancel()
    stopKeepAlive()
  }

  const handleBarcodeScanned = async (code: string) => {
    setIsScannerOpen(false)
    try {
      const product = await getProductByBarcode(code)
      if (product) {
        const text = `${product.name} পাওয়া গেছে। দাম ৳${product.price} টাকা, স্টক ${product.stock} ${product.unit}।`
        setResponse(text)
        setIsOpen(true)
        void speak(text)
        triggerSuccessState()
      }
    } catch {
      toast({
        title: "এই বারকোডের পণ্য পাওয়া যায়নি",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Floating Draggable Chotu AI Companion */}
      <div
        style={{
          right: `${position.x}px`,
          bottom: `${position.y}px`,
        }}
        onPointerDown={handlePointerDown}
        className="fixed z-50 select-none touch-none group"
      >
        <div className="relative flex flex-col items-center">
          {/* Quick Tooltip speech on idle hover */}
          {!isOpen && (
            <div className="absolute -top-10 bg-card/95 backdrop-blur-md text-foreground text-[11px] font-bold px-3 py-1 rounded-full shadow-lg border border-primary/30 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity animate-in fade-in slide-in-from-bottom-2 flex items-center gap-1.5">
              <span>{chotuConfig.customGreeting || "বলুন মামা, আমি আছি!"}</span>
            </div>
          )}

          {/* Main Chotu Character Button */}
          <div
            onClick={(e) => {
              if (!isDraggingRef.current) {
                setIsOpen((prev) => !prev)
              }
            }}
            className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title="ছোটু - আপনার এআই দোকান সহকারী (ক্লিক করুন)"
          >
            <ChotuAvatar
              config={chotuConfig}
              state={chotuState}
              interactive={false}
              showAura={true}
            />
          </div>
        </div>
      </div>

      {/* Chotu Interactive Speech Bubble & Action Panel */}
      {isOpen && (
        <div
          style={{
            right: `${Math.min(window.innerWidth - 320, Math.max(16, position.x))}px`,
            bottom: `${position.y + 110}px`,
          }}
          className="fixed w-80 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary/20 p-4 z-50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1">
                দেশি এআই ছোটু
              </h3>
              <span className="text-[10px] text-primary font-semibold px-2 py-0.5 rounded-full bg-primary/10">
                JARVIS Vibe
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const updated = { ...chotuConfig, isMuted: !chotuConfig.isMuted }
                  setChotuConfig(updated)
                  saveChotuConfig(updated)
                }}
                title={chotuConfig.isMuted ? "ভয়েস চালু করুন" : "ভয়েস মিউট করুন"}
              >
                {chotuConfig.isMuted ? (
                  <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-primary" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setIsCustomizerOpen(true)}
                title="ছোটুকে সাজান"
              >
                <Wand2 className="h-3.5 w-3.5 text-primary" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                onClick={closePanel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Conversation Speech Area */}
          <div className="min-h-[70px] max-h-44 overflow-y-auto bg-muted/40 rounded-2xl p-3 mb-3 text-xs flex flex-col justify-end border border-border/50">
            {transcript && (
              <p className="text-muted-foreground text-right mb-1.5 italic font-medium">
                "{transcript}"
              </p>
            )}
            {response && (
              <p className="text-foreground font-semibold leading-relaxed animate-in fade-in">
                {response}
              </p>
            )}
            {isListening && !transcript && (
              <div className="flex items-center text-primary font-medium gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>মনোযোগ দিয়ে শুনছি, বলুন মামা...</span>
              </div>
            )}
            {!isListening && !transcript && !response && (
              <div className="space-y-2 text-muted-foreground">
                <p>{HELP_TEXT}</p>
                <div className="pt-2 border-t border-border/40">
                  <p className="text-[11px] font-bold text-primary mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> দ্রুত প্রশ্ন করুন:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {category.suggestedChotuQueries.slice(0, 3).map((q) => (
                      <button
                        key={q}
                        onClick={() => void processCommand(q, [])}
                        className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded-full text-left transition-colors border border-primary/20"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons Grid */}
          <div className="grid grid-cols-4 gap-1.5 mb-2.5">
            <button
              type="button"
              onClick={() => {
                closePanel()
                setIsScannerOpen(true)
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary transition-all border border-border/60 text-[10px] font-bold gap-1"
            >
              <Camera className="h-4 w-4" />
              <span>স্ক্যানার</span>
            </button>
            <button
              type="button"
              onClick={() => {
                closePanel()
                setLocation("/app/billing")
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary transition-all border border-border/60 text-[10px] font-bold gap-1"
            >
              <Receipt className="h-4 w-4" />
              <span>নতুন বিল</span>
            </button>
            <button
              type="button"
              onClick={() => {
                closePanel()
                setLocation("/app/inventory")
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary transition-all border border-border/60 text-[10px] font-bold gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span>পণ্য যোগ</span>
            </button>
            <button
              type="button"
              onClick={() => void processCommand("কোন পণ্য স্টকে কম আছে")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary transition-all border border-border/60 text-[10px] font-bold gap-1"
            >
              <Package className="h-4 w-4" />
              <span>স্টক চেক</span>
            </button>
          </div>

          {/* Main Voice Listening CTA Button */}
          <Button
            variant={isListening ? "destructive" : "default"}
            className="w-full rounded-2xl h-11 text-sm font-bold gap-2 shadow-md"
            onClick={toggleListening}
            disabled={isActing}
          >
            {isActing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {isActing ? "ছোটু কাজ করছে..." : isListening ? "কথা বলা শেষ" : "ভয়েসে কথা বলুন"}
          </Button>
        </div>
      )}

      {/* Customize Chotu Modal */}
      <ChotuCustomizerDialog
        open={isCustomizerOpen}
        onOpenChange={setIsCustomizerOpen}
        currentConfig={chotuConfig}
        onConfigChange={(newConfig) => setChotuConfig(newConfig)}
      />

      {/* Barcode Scanner Modal attached to Chotu */}
      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleBarcodeScanned}
        title="ছোটু বারকোড স্ক্যানার"
      />
    </>
  )
}
