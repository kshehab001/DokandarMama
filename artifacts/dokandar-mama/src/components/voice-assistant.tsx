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
import { useLanguage } from "@/context/language-context"
import { useChouPresence } from "@/context/chou-presence-context"
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
import {
  interpretNaturalLanguageWithAI,
  type ChotuParsedResult,
} from "@/lib/chotu-ai-interpreter"
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

const HELP_TEXT_BN =
  "মামা, আপনি জিজ্ঞেস করতে পারেন: 'আজকের বিক্রি কত', 'মোট বাকি কত', '[নাম] এর বাকি কত', '[প্রোডাক্ট] এর স্টক কত', 'কোন প্রোডাক্ট স্টকে কম আছে', 'সবচেয়ে বেশি বিক্রি হওয়া প্রোডাক্ট'। এছাড়া বলতে পারেন: 'বিলিং পেজ খোল', অথবা 'রহিম ৫০০ টাকা দিলো'।"
const HELP_TEXT_EN =
  "Ask me: 'today's sales', 'total due', 'stock of [product]', 'low stock products', 'top selling products', 'open billing', 'open inventory', or 'Rahim paid 500'."

export function VoiceAssistant() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { category, role, isOwner, isManager, isShopkeeper } = useShopTheme()
  const { language } = useLanguage()
  const { position, setPosition, setPose } = useChouPresence()

  // Dragging refs
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ clientX: 0, clientY: 0, posX: 0, posY: 0 })

  // Chotu configuration and state
  const [chotuConfig, setChotuConfig] = useState<ChotuConfig>(() => loadSavedChotuConfig())
  const [chotuState, setChotuState] = useState<ChotuState>("idle")
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

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
  const { data: cashbox } = useGetCashboxState()
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

  // Cleanly start speech recognition with permission check and fresh instance
  const startListening = async () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setNotSupported(true)
      toast({
        title: language === "en" ? "Speech recognition not supported" : "ব্রাউজারে ভয়েস সাপোর্ট নেই",
        description: language === "en" ? "Please use Google Chrome or Edge, or type your query below." : "Google Chrome বা Edge ব্যবহার করুন, অথবা নিচে লিখে প্রশ্ন করুন।",
      })
      return
    }

    // Request mic access first to trigger browser permission modal if not allowed yet
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((t) => t.stop())
      } catch (err: any) {
        console.warn("Microphone access prompt error:", err)
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          toast({
            title: language === "en" ? "Microphone permission required" : "মাইক্রোফোন পারমিশন এলাও করুন",
            description: language === "en" ? "Please enable microphone permission in your browser address bar." : "ব্রাউজারের অ্যাড্রেস বার থেকে মাইক্রোফোন পারমিশন চালু করুন।",
            variant: "destructive",
          })
          return
        }
      }
    }

    // Clean up any ongoing recognition or speech
    window.speechSynthesis.cancel()
    stopKeepAlive()
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {}
      recognitionRef.current = null
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = language === "en" ? "en-US" : "bn-BD"
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 3

    setTranscript("")
    setResponse("")
    setIsOpen(true)
    setIsListening(true)
    setChotuState("listening")
    setPose("listening", "curious")

    recognition.onstart = () => {
      setIsListening(true)
      setChotuState("listening")
      setPose("listening", "curious")
    }

    recognition.onresult = (event: any) => {
      const current = event.resultIndex
      const result = event.results[current][0].transcript
      setTranscript(result)
      if (event.results[current].isFinal) {
        try {
          recognition.stop()
        } catch {}
        void processCommand(result)
      }
    }

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error)
      setIsListening(false)
      if (event.error === "no-speech") {
        setChotuState("idle")
        setPose("idle", "happy")
        return
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast({
          title: language === "en" ? "Microphone blocked" : "মাইক্রোফোন বন্ধ আছে",
          description: language === "en" ? "Please allow microphone access to talk to Chotu." : "ছোটুর সাথে কথা বলতে মাইক্রোফোন পারমিশন অন করুন।",
          variant: "destructive",
        })
      } else if (event.error === "language-not-supported" || event.error === "network") {
        // Retry once with en-US if bn-BD package is missing on Windows
        if (!langFallbackRef.current) {
          langFallbackRef.current = true
          recognition.lang = "en-US"
          try {
            recognition.start()
            return
          } catch {}
        }
      }
      triggerErrorState()
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (e) {
      console.error("Failed to start speech recognition:", e)
      setIsListening(false)
      recognitionRef.current = null
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
    setChotuState("idle")
    setPose("idle", "happy")
  }

  useEffect(() => {
    const handleToggleVoice = () => {
      if (isListening) {
        stopListening()
      } else {
        void startListening()
      }
    }
    const handleOpenPanel = () => {
      setIsOpen(true)
    }
    window.addEventListener("chotu:toggle_voice", handleToggleVoice)
    window.addEventListener("chotu:open_panel", handleOpenPanel)
    return () => {
      window.removeEventListener("chotu:toggle_voice", handleToggleVoice)
      window.removeEventListener("chotu:open_panel", handleOpenPanel)
    }
  }, [notSupported, isListening, language])

  const triggerSuccessState = () => {
    setChotuState("success")
    setPose("sale_done", "excited")
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    successTimerRef.current = window.setTimeout(() => {
      setChotuState("idle")
      setPose("idle", "happy")
    }, 2800)
  }

  const triggerErrorState = () => {
    setChotuState("error")
    setPose("low_stock", "concerned")
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
    successTimerRef.current = window.setTimeout(() => {
      setChotuState("idle")
      setPose("idle", "happy")
    }, 3000)
  }

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
    utterance.lang = language === "en" ? "en-US" : "bn-BD"
    utterance.rate = 0.95
    if (voice && language === "bn") utterance.voice = voice

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
    if (language === "en") {
      switch (chotuConfig.personality) {
        case "funny":
          return "Hey Boss! "
        case "helpful":
          return "I'm checking! "
        case "smart":
          return "According to real-time data, "
        case "friendly":
        default:
          return "Boss, "
      }
    }
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

  // Command Processing Logic via Modular AI Interpretation Layer
  const processCommand = async (rawText: string) => {
    setIsActing(true)
    setChotuState("thinking")

    let reply = ""
    let success = false

    try {
      // 1. Pass to Modular AI Interpreter (Tier 1 Fast Matcher -> Tier 2 AI -> Tier 3 Heuristic)
      const parsed: ChotuParsedResult = await interpretNaturalLanguageWithAI(
        rawText,
        {
          availableProducts: products?.map((p: any) => p.name) || [],
          availableCustomers: customers?.map((c: any) => c.name) || [],
        },
        import.meta.env.VITE_GEMINI_API_KEY
      )

      // 2. Handle Low Confidence (Politely ask user to rephrase)
      if (parsed.confidence === "LOW") {
        reply = parsed.clarificationQuestion || (language === "en" ? "Sorry, I couldn't understand that. Please say it clearly." : "মামা, কথাটা বুঝতে পারিনি। অনুগ্রহ করে আরেকটু স্পষ্ট করে বলুন।")
        triggerErrorState()
      }
      // 3. Handle Medium Confidence (Ask specific clarification question)
      else if (parsed.confidence === "MEDIUM") {
        reply = parsed.clarificationQuestion || (language === "en" ? "Please specify what you want to check." : "মামা, একটু নির্দিষ্ট করে বলুন কী দেখতে চান।")
      }
      // 4. Handle High Confidence - Dispatch to Fixed Predefined Dokandar Mama Command
      else {
        switch (parsed.intent) {
          case "GENERAL_GREETING": {
            reply = language === "en"
              ? `${getPersonalityGreeting()}I'm here to help! Ask me about today's sales, stock, baki, or cashbox.`
              : `${getPersonalityGreeting()}আমি আপনার সাথে আছি। আজকের বিক্রি, স্টক, বাকি বা ক্যাশ বক্স সম্পর্কে জিজ্ঞেস করতে পারেন।`
            success = true
            break
          }

          case "CHECK_SALES_SUMMARY": {
            const total = dashboard?.todaySalesTotal ?? 0
            const count = dashboard?.todayTransactionCount ?? 0
            reply = language === "en"
              ? `${getPersonalityGreeting()}Today's sales: ৳${total} from ${count} transactions.`
              : `${getPersonalityGreeting()}আজকে মোট ${count} টি বিক্রয়ে ৳${total} টাকা বিক্রি হয়েছে।`
            success = true
            break
          }

          case "CHECK_CASHBOX": {
            const balance = (dashboard as any)?.cashBalance ?? cashbox?.expectedClosing ?? cashbox?.session?.openingBalance ?? 0
            reply = language === "en"
              ? `${getPersonalityGreeting()}Current cash in drawer is ৳${balance}.`
              : `${getPersonalityGreeting()}ক্যাশ বাক্সে বর্তমানে ৳${balance} টাকা আছে।`
            success = true
            break
          }

          case "CHECK_DIGITAL_BALANCE": {
            const provider = parsed.parameters.digitalProvider || "all"
            const breakdown = (dashboard as any)?.digitalBreakdown || {}
            if (provider === "bkash") {
              const amount = breakdown.bkash ?? 0
              reply = language === "en" ? `${getPersonalityGreeting()}bKash balance is ৳${amount}.` : `${getPersonalityGreeting()}বিকাশে মোট ৳${amount} টাকা ডিজিটাল পেমেন্ট জমা আছে।`
            } else if (provider === "nagad") {
              const amount = breakdown.nagad ?? 0
              reply = language === "en" ? `${getPersonalityGreeting()}Nagad balance is ৳${amount}.` : `${getPersonalityGreeting()}নগদে মোট ৳${amount} টাকা ডিজিটাল পেমেন্ট জমা আছে।`
            } else if (provider === "rocket") {
              const amount = breakdown.rocket ?? 0
              reply = language === "en" ? `${getPersonalityGreeting()}Rocket balance is ৳${amount}.` : `${getPersonalityGreeting()}রকেটে মোট ৳${amount} টাকা ডিজিটাল পেমেন্ট জমা আছে।`
            } else if (provider === "upay") {
              const amount = breakdown.upay ?? 0
              reply = language === "en" ? `${getPersonalityGreeting()}Upay balance is ৳${amount}.` : `${getPersonalityGreeting()}উপায়ে মোট ৳${amount} টাকা ডিজিটাল পেমেন্ট জমা আছে।`
            } else {
              const totalDigital = (dashboard as any)?.digitalBalance ?? 0
              reply = language === "en"
                ? `${getPersonalityGreeting()}Total digital balance is ৳${totalDigital} (bKash: ৳${breakdown.bkash ?? 0}, Nagad: ৳${breakdown.nagad ?? 0}).`
                : `${getPersonalityGreeting()}মোট ডিজিটাল ব্যালেন্স ৳${totalDigital} টাকা (বিকাশ: ৳${breakdown.bkash ?? 0}, নগদ: ৳${breakdown.nagad ?? 0})।`
            }
            success = true
            break
          }

          case "CHECK_TOTAL_BALANCE": {
            const totalBalance = (dashboard as any)?.totalCurrentBalance ?? 0
            const cash = (dashboard as any)?.cashBalance ?? 0
            const digital = (dashboard as any)?.digitalBalance ?? 0
            reply = language === "en"
              ? `${getPersonalityGreeting()}Total shop balance is ৳${totalBalance} (Cash: ৳${cash}, Digital: ৳${digital}).`
              : `${getPersonalityGreeting()}দোকানে বর্তমানে মোট ৳${totalBalance} টাকা ব্যালেন্স আছে (ক্যাশ: ৳${cash}, ডিজিটাল: ৳${digital})।`
            success = true
            break
          }

          case "CHECK_RESTOCK": {
            const lowCount = dashboard?.lowStockCount ?? 0
            const lowItems = products?.filter((p: any) => p.stock <= p.lowStockThreshold) || []
            if (lowItems.length > 0) {
              const names = lowItems.slice(0, 3).map((p: any) => p.name).join(", ")
              reply = language === "en"
                ? `${getPersonalityGreeting()}${lowCount} products low on stock: ${names}${lowItems.length > 3 ? " etc." : ""}.`
                : `${getPersonalityGreeting()}${lowCount} টি পণ্যের স্টক কম: ${names}${lowItems.length > 3 ? " ইত্যাদি" : ""}।`
            } else {
              reply = language === "en"
                ? `${getPersonalityGreeting()}All products have sufficient stock!`
                : `${getPersonalityGreeting()}সব পণ্যের পর্যাপ্ত স্টক আছে, কোনো ঘাটতি নেই।`
            }
            success = true
            break
          }

          case "CHECK_TOP_PRODUCTS": {
            if (topProducts && topProducts.length > 0) {
              const topName = topProducts[0].productName
              const topSold = topProducts[0].quantitySold
              reply = language === "en"
                ? `${getPersonalityGreeting()}Top selling item is ${topName} (${topSold} sold).`
                : `${getPersonalityGreeting()}সবচেয়ে বেশি বিক্রি হয়েছে ${topName} (${topSold} টি)।`
            } else {
              reply = language === "en"
                ? `${getPersonalityGreeting()}No top product data available right now.`
                : `${getPersonalityGreeting()}এই মুহূর্তে টপ বিক্রির ডাটা পাওয়া যায়নি।`
            }
            success = true
            break
          }

          case "CHECK_STOCK": {
            const target = parsed.parameters.productName?.toLowerCase() || ""
            if (!target) {
              reply = language === "en" ? "Which product's stock would you like to check?" : "মামা, কোন পণ্যের স্টক জানতে চান?"
              break
            }
            const matched = products?.find(
              (p: any) => p.name.toLowerCase().includes(target) || target.includes(p.name.toLowerCase())
            )
            if (matched) {
              const currentStock = Number(matched.stock)
              const threshold = Number(matched.lowStockThreshold ?? 5)
              let stockWarning = ""
              if (currentStock <= threshold) {
                stockWarning = language === "en" ? " Stock is low, reorder soon." : " স্টক শেষের দিকে, দ্রুত কিনতে হবে।"
              } else if (currentStock - threshold <= 3) {
                const diff = currentStock - threshold
                stockWarning = language === "en" ? ` Only ${diff} ${matched.unit} left before low stock.` : ` আর ${diff} ${matched.unit} বিক্রি হলেই স্টক কমে যাবে।`
              }
              reply = language === "en"
                ? `${getPersonalityGreeting()}${matched.name} has ${matched.stock} ${matched.unit} in stock.${stockWarning}`
                : `${getPersonalityGreeting()}${matched.name} ${matched.stock} ${matched.unit} আছে।${stockWarning}`
              success = true
            } else {
              reply = language === "en"
                ? `No product named "${parsed.parameters.productName}" found in stock.`
                : `মামা, "${parsed.parameters.productName}" নামের কোনো পণ্য দোকানে পাওয়া যায়নি।`
            }
            break
          }

          case "CHECK_DUE": {
            const target = parsed.parameters.customerName?.toLowerCase() || ""
            if (!target) {
              const totalDue = dashboard?.totalDue ?? 0
              reply = language === "en"
                ? `${getPersonalityGreeting()}Total customer due (baki) is ৳${totalDue}.`
                : `${getPersonalityGreeting()}দোকানের মোট বকেয়া বাকি ৳${totalDue} টাকা।`
              success = true
              break
            }
            const matched = customers?.find(
              (c: any) => c.name.toLowerCase().includes(target) || target.includes(c.name.toLowerCase())
            )
            if (matched) {
              reply = language === "en"
                ? `${getPersonalityGreeting()}${matched.name} owes ৳${matched.bakiBalance}.`
                : `${getPersonalityGreeting()}${matched.name}-এর বাকি আছে ৳${matched.bakiBalance} টাকা।`
              success = true
            } else {
              reply = language === "en"
                ? `No customer named "${parsed.parameters.customerName}" found.`
                : `মামা, "${parsed.parameters.customerName}" নামের কোনো কাস্টমার তালিকায় নেই।`
            }
            break
          }

          case "RECORD_PAYMENT": {
            const target = parsed.parameters.customerName?.toLowerCase() || ""
            const amount = parsed.parameters.amount || 0
            if (amount > 0 && customers && customers.length > 0) {
              const matched = customers.find(
                (c: any) => c.name.toLowerCase().includes(target) || target.includes(c.name.toLowerCase())
              )
              if (matched) {
                await recordPayment.mutateAsync({
                  id: matched.id,
                  data: { amount, note: "ছোটু ভয়েস এন্ট্রি" },
                })
                invalidateShopData()
                reply = language === "en"
                  ? `${getPersonalityGreeting()}Recorded ৳${amount} payment for ${matched.name}.`
                  : `${getPersonalityGreeting()}${matched.name}-এর ৳${amount} টাকা জমা নেওয়া হয়েছে।`
                success = true
              } else {
                reply = language === "en"
                  ? `Customer "${parsed.parameters.customerName}" was not found.`
                  : `মামা, "${parsed.parameters.customerName}" নামের কাস্টমার পাওয়া যায়নি।`
              }
            } else {
              reply = language === "en"
                ? "Please clearly say the customer name and payment amount."
                : "মামা, কাস্টমারের নাম এবং টাকার পরিমাণ পরিষ্কার করে বলুন।"
            }
            break
          }

          case "OPEN_PAGE": {
            const page = parsed.parameters.targetPage
            if (page === "billing") {
              setLocation("/app/billing")
              reply = language === "en" ? `${getPersonalityGreeting()}Opened billing page.` : `${getPersonalityGreeting()}বিলিং পেজ ওপেন করেছি।`
            } else if (page === "inventory") {
              setLocation("/app/inventory")
              reply = language === "en" ? `${getPersonalityGreeting()}Opened inventory page.` : `${getPersonalityGreeting()}ইনভেন্টরি পেজ ওপেন করেছি।`
            } else if (page === "customers") {
              setLocation("/app/customers")
              reply = language === "en" ? `${getPersonalityGreeting()}Opened customer list.` : `${getPersonalityGreeting()}কাস্টমার তালিকা ওপেন করেছি।`
            } else if (page === "reports") {
              if (isShopkeeper) {
                reply = language === "en" ? "Reports are restricted to Managers and Owners." : "মামা, রিপোর্ট দেখার অনুমতি শুধুমাত্র ম্যানেজার বা মালিকের আছে।"
              } else {
                setLocation("/app/reports")
                reply = language === "en" ? `${getPersonalityGreeting()}Opened reports page.` : `${getPersonalityGreeting()}রিপোর্ট পেজ ওপেন করেছি।`
              }
            } else if (page === "cashbox") {
              setLocation("/app/cashbox")
              reply = language === "en" ? `${getPersonalityGreeting()}Opened cashbox.` : `${getPersonalityGreeting()}ক্যাশ বক্স পেজ ওপেন করেছি।`
            } else {
              setLocation("/app")
              reply = language === "en" ? `${getPersonalityGreeting()}Opened dashboard.` : `${getPersonalityGreeting()}ড্যাশবোর্ড ওপেন করেছি।`
            }
            success = true
            break
          }

          default: {
            reply = language === "en"
              ? `${getPersonalityGreeting()}I heard: "${rawText}". You can ask about today's sales, due, or stock.`
              : `${getPersonalityGreeting()}আমি আপনার কথা শুনেছি ("${rawText}")। আজকের বিক্রি, মোট বাকি বা স্টক সম্পর্কে জানতে পারেন।`
            success = true
          }
        }
      }
    } catch (e) {
      console.error("Command execution error", e)
      reply = language === "en" ? "Sorry, there was an error processing that request." : "মামা, কাজটি সম্পন্ন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।"
      triggerErrorState()
    }

    setIsActing(false)
    setResponse(reply)
    if (success) triggerSuccessState()
    void speak(reply)
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      void startListening()
    }
  }

  const [textInput, setTextInput] = useState("")

  const handleTextSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!textInput.trim() || isActing) return
    const q = textInput.trim()
    setTextInput("")
    setTranscript(q)
    void processCommand(q)
  }

  const closePanel = () => {
    setIsOpen(false)
    stopListening()
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
      {/* Chotu Interactive Speech Bubble & Action Panel (Triggered from ChouFloatingWidget) */}
      {isOpen && (
        <div
          style={{
            right: `${Math.min(window.innerWidth - 340, Math.max(16, position.x))}px`,
            bottom: `${Math.min(window.innerHeight - 440, Math.max(80, position.y + 70))}px`,
          }}
          className="fixed w-80 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary/20 p-4 z-[95] animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
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
          <div className="min-h-[70px] max-h-44 overflow-y-auto bg-muted/40 rounded-2xl p-3 mb-2.5 text-xs flex flex-col justify-end border border-border/50">
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
                <p>{language === "en" ? HELP_TEXT_EN : HELP_TEXT_BN}</p>
                <div className="pt-2 border-t border-border/40">
                  <p className="text-[11px] font-bold text-primary mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> দ্রুত প্রশ্ন করুন:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {category.suggestedChotuQueries.slice(0, 3).map((q) => (
                      <button
                        key={q}
                        onClick={() => void processCommand(q)}
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

          {/* Text Input Option for quick typing */}
          <form onSubmit={handleTextSubmit} className="flex items-center gap-1.5 mb-2.5">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={language === "en" ? "Ask Chotu or type command..." : "ছোটুকে লিখেও জিজ্ঞেস করতে পারেন..."}
              className="flex-1 h-9 px-3 rounded-xl bg-muted/60 border border-border/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={isActing}
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 px-3 rounded-xl text-xs font-bold"
              disabled={!textInput.trim() || isActing}
            >
              পাঠান
            </Button>
          </form>

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
              <MicOff className="h-4 w-4 animate-pulse" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {isActing ? "ছোটু কাজ করছে..." : isListening ? "কথা বলা শেষ (ট্যাপ করুন)" : "ভয়েসে কথা বলুন"}
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
