import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import {
  useGetDashboardOverview,
  useListCustomers,
  useListProducts,
  useGetSalesSummary,
  useGetTopProducts,
  useGetRestockSuggestions,
  useCreateSale,
  useRecordCustomerPayment,
  getListProductsQueryKey,
  getListCustomersQueryKey,
  getGetDashboardOverviewQueryKey,
  getGetSalesSummaryQueryKey,
  getGetTopProductsQueryKey,
  getGetRestockSuggestionsQueryKey,
} from "@workspace/api-client-react"

// Bangla digits <-> Latin digits, so spoken/typed numerals of either script work.
const BN_DIGITS = "০১২৩৪৫৬৭৮৯"
function normalizeDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
}

// Strip punctuation/diacritics noise the recognizer sometimes injects (।, ,, ?, !, extra spaces)
// and normalize digits + whitespace so command matching is forgiving of small variations.
function normalize(text: string): string {
  return normalizeDigits(text)
    .toLowerCase()
    .replace(/[।,.?!""''"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Loose containment check: true if `needle`'s normalized form appears in `haystack`,
// tolerant of minor recognizer spelling drift by also checking without spaces.
function looseIncludes(haystack: string, needle: string): boolean {
  const h = haystack.replace(/\s+/g, "")
  const n = needle.replace(/\s+/g, "")
  return n.length > 0 && h.includes(n)
}

const HELP_TEXT =
  "আপনি জিজ্ঞেস করতে পারেন: 'আজকের বিক্রি কত', 'মোট বাকি কত', '[নাম] এর বাকি কত', '[প্রোডাক্ট] এর স্টক কত', 'কোন প্রোডাক্ট স্টকে কম আছে', 'সবচেয়ে বেশি বিক্রি হওয়া প্রোডাক্ট', 'কোনটা আবার কিনতে হবে', 'কতজন কাস্টমার আছে'। এছাড়া কাজও করাতে পারেন: '২ কেজি চাল বিক্রি করলাম নগদে', অথবা 'রহিম ৫০০ টাকা দিলো'।"

export function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
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

  const queryClient = useQueryClient()

  // Fetch contextual data so we can answer questions without a round trip per query.
  const { data: dashboard } = useGetDashboardOverview()
  const { data: customers } = useListCustomers()
  const { data: products } = useListProducts()
  const { data: weekSummary } = useGetSalesSummary({ range: "week" })
  const { data: topProducts } = useGetTopProducts({ range: "week" })
  const { data: restockSuggestions } = useGetRestockSuggestions()

  const createSale = useCreateSale()
  const recordPayment = useRecordCustomerPayment()

  // After a voice-driven action actually changes data, refresh every view the
  // assistant itself reads from (and the dashboard/inventory/customer pages),
  // so the UI doesn't show stale numbers until the next manual refetch.
  const invalidateShopData = () => {
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() })
    queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetSalesSummaryQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetTopProductsQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetRestockSuggestionsQueryKey() })
  }

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setNotSupported(true)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'bn-BD'
    recognition.continuous = false
    recognition.interimResults = true
    // Offer a few alternative transcriptions so we can try to match each one —
    // Bangla ASR often mis-hears numbers/product names on the first pass.
    recognition.maxAlternatives = 3

    recognition.onresult = (event: any) => {
      const current = event.resultIndex
      const result = event.results[current][0].transcript
      setTranscript(result)
      // Stash all alternatives for command matching without re-rendering on each one.
      const alternatives: string[] = []
      for (let i = 0; i < event.results[current].length; i++) {
        alternatives.push(event.results[current][i].transcript)
      }
      ;(recognition as any)._lastAlternatives = alternatives
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error)
      setIsListening(false)
      if (event.error === 'not-allowed') {
        setResponse("মাইক্রোফোনের পারমিশন দেওয়া হয়নি। ব্রাউজার সেটিংসে মাইক্রোফোন অনুমতি দিন।")
      } else if (event.error === 'no-speech') {
        setResponse("কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন।")
      } else if (event.error === 'network') {
        setResponse("ইন্টারনেট সংযোগ পরীক্ষা করুন।")
      }
    }

    recognitionRef.current = recognition

    return () => {
      stopKeepAlive()
    }
  }, [])

  useEffect(() => {
    if (!isListening && transcript && isOpen) {
      const alternatives: string[] = recognitionRef.current?._lastAlternatives ?? [transcript]
      void processCommand(transcript, alternatives)
    }
  }, [isListening])

  const findCustomerByName = (query: string) => {
    if (!customers) return undefined
    return customers.find((c) => looseIncludes(query, normalize(c.name)))
  }

  const findProductByName = (query: string) => {
    if (!products) return undefined
    // Prefer the longest matching product name to avoid short substrings
    // ("চাল") accidentally matching a longer unrelated product first.
    const matches = products.filter((p) => looseIncludes(query, normalize(p.name)))
    if (matches.length === 0) return undefined
    return matches.reduce((a, b) => (a.name.length >= b.name.length ? a : b))
  }

  // --- Action commands: things the assistant DOES, not just answers. ---
  // Each returns null if this candidate text isn't this kind of command at
  // all, or a result describing either the parsed action or a specific
  // reason it couldn't be carried out (so the user gets a useful spoken
  // correction instead of a generic "didn't understand").
  type SaleAction =
    | { kind: "sale"; product: NonNullable<ReturnType<typeof findProductByName>>; quantity: number; customerId?: number; customerName?: string; isBaki: boolean }
    | { kind: "sale-error"; message: string }

  const trySaleAction = (query: string): SaleAction | null => {
    const saleVerbs = ["বিক্রি করলাম", "বিক্রি করেছি", "বিক্রি হয়েছে", "বিক্রি হলো"]
    if (!saleVerbs.some((v) => query.includes(v))) return null

    const product = findProductByName(query)
    if (!product) {
      return { kind: "sale-error", message: "কোন প্রোডাক্ট বিক্রি হয়েছে বুঝতে পারিনি। প্রোডাক্টের নাম স্পষ্ট করে বলুন।" }
    }

    const qtyMatch = query.match(/(\d+(?:\.\d+)?)/)
    const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1
    if (!quantity || quantity <= 0) {
      return { kind: "sale-error", message: "কত পরিমাণ বিক্রি হয়েছে বুঝতে পারিনি। যেমন বলুন: '২ কেজি চাল বিক্রি করলাম'।" }
    }
    if (quantity > Number(product.stock)) {
      return { kind: "sale-error", message: `${product.name}-এর স্টকে আছে মাত্র ${product.stock} ${product.unit}, এত বিক্রি করা যাবে না।` }
    }

    const isBaki = query.includes("বাকি") || query.includes("ধারে")
    let customer: ReturnType<typeof findCustomerByName>
    if (isBaki) {
      customer = findCustomerByName(query)
      if (!customer) {
        return { kind: "sale-error", message: "বাকিতে বিক্রির জন্য কাস্টমারের নাম বলুন, যেমন 'রহিমকে ২ কেজি চাল বাকিতে বিক্রি করলাম'।" }
      }
    }

    return { kind: "sale", product, quantity, customerId: customer?.id, customerName: customer?.name, isBaki }
  }

  type PaymentAction =
    | { kind: "payment"; customer: NonNullable<ReturnType<typeof findCustomerByName>>; amount: number }
    | { kind: "payment-error"; message: string }

  const tryPaymentAction = (query: string): PaymentAction | null => {
    const paymentVerbs = ["টাকা দিলো", "টাকা দিয়েছে", "টাকা দিছে", "জমা দিলো", "জমা করলো", "পরিশোধ করলো", "শোধ করলো"]
    if (!paymentVerbs.some((v) => query.includes(v))) return null

    const amountMatch = query.match(/(\d+(?:\.\d+)?)\s*টাকা/)
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null
    if (!amount || amount <= 0) {
      return { kind: "payment-error", message: "কত টাকা জমা হয়েছে বুঝতে পারিনি। যেমন বলুন: 'রহিম ৫০০ টাকা দিলো'।" }
    }

    const customer = findCustomerByName(query)
    if (!customer) {
      return { kind: "payment-error", message: "কোন কাস্টমারের কথা বলছেন বুঝতে পারিনি। নাম স্পষ্ট করে বলুন।" }
    }
    if (Number(customer.bakiBalance) <= 0) {
      return { kind: "payment-error", message: `${customer.name}-এর কোনো বাকি নেই।` }
    }
    if (amount > Number(customer.bakiBalance)) {
      return { kind: "payment-error", message: `${customer.name}-এর বাকি আছে মাত্র ৳${customer.bakiBalance}, এত টাকা জমা নেওয়া যাবে না।` }
    }

    return { kind: "payment", customer, amount }
  }

  const executeSaleAction = (action: Extract<SaleAction, { kind: "sale" }>) => {
    setIsActing(true)
    const total = Number(action.product.price) * action.quantity
    createSale.mutate(
      {
        data: {
          customerId: action.customerId,
          items: [{ productId: action.product.id, quantity: action.quantity, unitPrice: Number(action.product.price) }],
          paidAmount: action.isBaki ? 0 : total,
          paymentMethod: action.isBaki ? "baki" : "cash",
        },
      },
      {
        onSuccess: () => {
          setIsActing(false)
          invalidateShopData()
          const confirmation = action.isBaki
            ? `${action.customerName} এর কাছে ${action.quantity} ${action.product.unit} ${action.product.name} বাকিতে বিক্রি করা হয়েছে, মোট ${total} টাকা।`
            : `${action.quantity} ${action.product.unit} ${action.product.name} নগদে বিক্রি করা হয়েছে, মোট ${total} টাকা।`
          setResponse(confirmation)
          speak(confirmation)
        },
        onError: () => {
          setIsActing(false)
          const message = "বিক্রি রেকর্ড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
          setResponse(message)
          speak(message)
        },
      },
    )
  }

  const executePaymentAction = (action: Extract<PaymentAction, { kind: "payment" }>) => {
    setIsActing(true)
    recordPayment.mutate(
      {
        id: action.customer.id,
        data: { amount: action.amount, note: "ভয়েস কমান্ড দিয়ে যোগ করা হয়েছে" },
      },
      {
        onSuccess: (updatedCustomer) => {
          setIsActing(false)
          invalidateShopData()
          const remaining = Number(updatedCustomer.bakiBalance)
          const confirmation =
            remaining > 0
              ? `${action.customer.name} এর কাছ থেকে ${action.amount} টাকা জমা নেওয়া হয়েছে। বাকি আছে আরও ${remaining} টাকা।`
              : `${action.customer.name} এর কাছ থেকে ${action.amount} টাকা জমা নেওয়া হয়েছে। এখন আর কোনো বাকি নেই।`
          setResponse(confirmation)
          speak(confirmation)
        },
        onError: () => {
          setIsActing(false)
          const message = "জমা রেকর্ড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
          setResponse(message)
          speak(message)
        },
      },
    )
  }

  // Tries each candidate transcript (the primary + ASR alternatives) against
  // action commands first (they have distinct trigger phrases), then Q&A
  // intents, so a mis-heard word in one alternative doesn't sink the command.
  const processCommand = async (primaryText: string, alternatives: string[]) => {
    const candidates = Array.from(new Set([primaryText, ...alternatives])).map(normalize)

    for (const query of candidates) {
      const sale = trySaleAction(query)
      if (sale) {
        if (sale.kind === "sale-error") {
          setResponse(sale.message)
          speak(sale.message)
          return
        }
        const busyMsg = "একটু অপেক্ষা করুন, বিক্রি যোগ করা হচ্ছে..."
        setResponse(busyMsg)
        speak(busyMsg)
        executeSaleAction(sale)
        return
      }

      const payment = tryPaymentAction(query)
      if (payment) {
        if (payment.kind === "payment-error") {
          setResponse(payment.message)
          speak(payment.message)
          return
        }
        const busyMsg = "একটু অপেক্ষা করুন, জমা যোগ করা হচ্ছে..."
        setResponse(busyMsg)
        speak(busyMsg)
        executePaymentAction(payment)
        return
      }
    }

    for (const query of candidates) {
      const answer = matchIntent(query)
      if (answer) {
        setResponse(answer)
        speak(answer)
        return
      }
    }

    const fallback = "আমি বুঝতে পারিনি। আবার বলুন, অথবা 'সাহায্য' বলুন কমান্ডের তালিকার জন্য।"
    setResponse(fallback)
    speak(fallback)
  }

  const matchIntent = (query: string): string | null => {
    // Greeting
    if (/^(হ্যালো|হাই|আসসালামু আলাইকুম|সালাম)/.test(query)) {
      return "হ্যালো! আমি আপনার দোকানের হিসাব রাখতে সাহায্য করব। কী জানতে চান?"
    }

    // Help / command list
    if (query.includes("সাহায্য") || query.includes("হেল্প") || query.includes("কী কী বলতে পারি") || query.includes("কমান্ড")) {
      return HELP_TEXT
    }

    // Today's total sales
    if (
      query.includes("আজকের বিক্রি") ||
      query.includes("আজকে কত বিক্রি") ||
      query.includes("আজ কত টাকা বিক্রি") ||
      query.includes("আজকের হিসাব")
    ) {
      if (dashboard) {
        return `আজকে মোট বিক্রি হয়েছে ${dashboard.todaySalesTotal} টাকা, মোট ${dashboard.todayTransactionCount} টা ক্যাশমেমো।`
      }
      return "বিক্রির তথ্য এখন পাওয়া যাচ্ছে না।"
    }

    // Best-selling product (checked before the generic weekly-summary phrase below,
    // since both can contain "সপ্তাহে" but this one is more specific)
    if (query.includes("সবচেয়ে বেশি বিক্রি") || query.includes("বেস্ট সেলিং") || query.includes("কোন প্রোডাক্ট বেশি বিক্রি")) {
      if (topProducts && topProducts.length > 0) {
        const top = topProducts[0]
        return `এই সপ্তাহে সবচেয়ে বেশি বিক্রি হয়েছে ${top.productName}, মোট ${top.quantitySold} টি।`
      }
      return "বিক্রির তথ্য এখনো যথেষ্ট নেই।"
    }

    // Low stock / restock suggestions (checked before the generic stock-lookup phrase below)
    if (
      query.includes("কোন প্রোডাক্ট স্টকে কম") ||
      query.includes("কী কী কিনতে হবে") ||
      query.includes("কোনটা আবার কিনতে হবে") ||
      query.includes("স্টক শেষ") ||
      query.includes("রিস্টক")
    ) {
      if (restockSuggestions && restockSuggestions.length > 0) {
        const names = restockSuggestions.slice(0, 3).map((s) => s.productName).join(", ")
        return `এই প্রোডাক্টগুলো আবার কিনতে হবে: ${names}।`
      }
      return "এখন কোনো প্রোডাক্ট রিস্টক করার দরকার নেই।"
    }

    // Weekly sales summary
    if (query.includes("এই সপ্তাহে") || query.includes("সাপ্তাহিক বিক্রি") || query.includes("সপ্তাহের বিক্রি")) {
      if (weekSummary) {
        return `এই সপ্তাহে মোট বিক্রি হয়েছে ${weekSummary.totalSales} টাকা।`
      }
      return "সাপ্তাহিক বিক্রির তথ্য এখন পাওয়া যাচ্ছে না।"
    }

    // Generic "total due" question (checked before the per-customer lookup so it
    // answers straight from dashboard totals even if the customer list hasn't loaded)
    if (query.includes("মোট বাকি") || query.includes("সবার বাকি") || query.includes("দোকানের বাকি")) {
      if (dashboard) {
        return `দোকানে মোট বাকির পরিমাণ ${dashboard.totalDue} টাকা।`
      }
    }

    // Specific customer's baki
    if (query.includes("বাকি") && customers && customers.length > 0) {
      const foundCustomer = findCustomerByName(query)
      if (foundCustomer) {
        if (Number(foundCustomer.bakiBalance) > 0) {
          return `${foundCustomer.name} এর বাকি আছে ${foundCustomer.bakiBalance} টাকা।`
        }
        return `${foundCustomer.name} এর কোনো বাকি নেই।`
      }
      if (query.includes("কত বাকি") && dashboard) {
        return `দোকানে মোট বাকির পরিমাণ ${dashboard.totalDue} টাকা।`
      }
    }

    // Total customer count
    if (query.includes("কতজন কাস্টমার") || query.includes("মোট কাস্টমার")) {
      if (dashboard) {
        return `আপনার দোকানে মোট ${dashboard.customerCount ?? customers?.length ?? 0} জন কাস্টমার আছে।`
      }
    }

    // Specific product's stock (check last since it's the most generic "product name" match)
    if (query.includes("স্টক") || query.includes("কয়টা আছে") || query.includes("কত আছে")) {
      const foundProduct = findProductByName(query)
      if (foundProduct) {
        return `${foundProduct.name} এর স্টক আছে ${foundProduct.stock} ${foundProduct.unit}।`
      }
      if (query.includes("স্টক")) {
        return "কোন প্রোডাক্টের কথা বলছেন বুঝতে পারিনি। প্রোডাক্টের নাম স্পষ্ট করে বলুন।"
      }
    }

    return null
  }

  // Chrome (desktop and Android) has a long-standing bug where speechSynthesis
  // silently stops mid-utterance after ~15s unless something keeps nudging it;
  // pause()/resume() is the standard workaround.
  const startKeepAlive = () => {
    stopKeepAlive()
    keepAliveRef.current = window.setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 4000)
  }
  const stopKeepAlive = () => {
    if (keepAliveRef.current !== null) {
      window.clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }
  }

  // Picks the best available Bangla voice once, caching the result. Voices
  // load asynchronously in most browsers (empty on first call), so this
  // waits for the 'voiceschanged' event rather than assuming getVoices() is
  // populated immediately — a common cause of TTS silently doing nothing.
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
      // Some browsers never fire voiceschanged if there simply are no voices;
      // fall back after a short timeout so speak() doesn't hang forever.
      const timeout = window.setTimeout(() => resolve(pick()), 800)
      window.speechSynthesis.onvoiceschanged = () => {
        window.clearTimeout(timeout)
        resolve(pick())
      }
    })
  }

  const speak = async (text: string) => {
    if (!("speechSynthesis" in window)) {
      console.warn("speechSynthesis not supported in this browser")
      return
    }

    window.speechSynthesis.cancel()
    stopKeepAlive()

    const voice = await resolveVoice()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "bn-BD"
    utterance.rate = 0.9
    if (voice) {
      utterance.voice = voice
    }
    utterance.onstart = () => startKeepAlive()
    utterance.onend = () => stopKeepAlive()
    utterance.onerror = (event) => {
      stopKeepAlive()
      console.error("Speech synthesis error", event.error)
      // Don't overwrite the on-screen response text (it's already visible);
      // audio failing shouldn't hide the answer the user can still read.
    }

    window.speechSynthesis.speak(utterance)
    synthesisRef.current = utterance
  }

  const toggleListening = () => {
    if (notSupported) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setTranscript("")
      setResponse("")
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

  if (notSupported) return null

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-8 md:bottom-8 w-72 md:w-80 bg-card rounded-2xl shadow-xl border border-border p-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-primary">ভয়েস অ্যাসিস্ট্যান্ট</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={closePanel}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="min-h-[80px] max-h-48 overflow-y-auto bg-muted/50 rounded-xl p-3 mb-4 text-sm flex flex-col justify-end">
            {transcript && (
              <p className="text-muted-foreground text-right mb-2 italic">"{transcript}"</p>
            )}
            {response && (
              <p className="text-foreground font-medium">{response}</p>
            )}
            {isListening && !transcript && (
              <div className="flex items-center text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>শুনছি...</span>
              </div>
            )}
            {!isListening && !transcript && !response && (
              <p className="text-muted-foreground">{HELP_TEXT}</p>
            )}
          </div>

          <Button
            variant={isListening ? "destructive" : "default"}
            className="w-full rounded-xl h-12 text-base gap-2"
            onClick={toggleListening}
            disabled={isActing}
          >
            {isActing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            {isActing ? "কাজ করা হচ্ছে..." : isListening ? "থামুন" : "আবার বলুন"}
          </Button>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={toggleListening}
          className={cn(
            "fixed bottom-20 right-4 md:right-8 md:bottom-8 h-16 w-16 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95 z-40"
          )}
        >
          <Mic className="h-8 w-8" />
        </button>
      )}
    </>
  )
}
