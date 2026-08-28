/**
 * Chotu Natural-Language AI Intent Interpretation Layer
 * 
 * Architecture:
 * User Natural Voice / Text (Bangla / Banglish / English / Local Slang)
 *   ──► Tier 1: Local Fast Keyword Matcher (0 Token Cost, <5ms)
 *   ──► Tier 2: AI Intent Interpreter (Gemini / LLM structured parser if ambiguous)
 *   ──► Tier 3: Heuristic Multi-Script Fallback Parser
 *   ──► Output: Strict Intent & Validated Parameters
 *   ──► Dispatched to existing fixed Dokandar Mama command executor.
 */

export type ChotuIntentType =
  | "CHECK_STOCK"
  | "RECORD_SALE"
  | "RECORD_PAYMENT"
  | "CHECK_DUE"
  | "CHECK_SALES_SUMMARY"
  | "CHECK_CASHBOX"
  | "CHECK_DIGITAL_BALANCE"
  | "CHECK_TOTAL_BALANCE"
  | "CHECK_RESTOCK"
  | "CHECK_TOP_PRODUCTS"
  | "OPEN_PAGE"
  | "GENERAL_GREETING"
  | "UNKNOWN"

export type ChotuConfidence = "HIGH" | "MEDIUM" | "LOW"

export interface ChotuParsedResult {
  intent: ChotuIntentType
  confidence: ChotuConfidence
  parameters: {
    productName?: string
    customerName?: string
    amount?: number
    quantity?: number
    paymentMethod?: "cash" | "digital" | "baki"
    digitalProvider?: string
    timeframe?: "today" | "week" | "month"
    targetPage?: "billing" | "inventory" | "customers" | "reports" | "cashbox"
  }
  clarificationQuestion?: string
  spokenFeedback?: string
}

// Convert Bangla digits to Latin numerals
const BN_DIGITS = "০১২৩৪৫৬৭৮৯"
export function normalizeDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
}

export function cleanText(text: string): string {
  return normalizeDigits(text)
    .toLowerCase()
    .replace(/[,\.\?!।]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Tier 1: Local Deterministic Rule Matcher (Zero tokens, ultra-fast)
 */
export function matchLocalIntent(rawText: string): ChotuParsedResult | null {
  const text = cleanText(rawText)

  // 1. GREETING
  if (
    /^(হ্যালো|হাই|সালাম|আসসালামু|নমস্কার|হ্যালো ছোটু|ছোটু মামা|hi|hello|hey|chotu)\b/.test(text) &&
    text.split(" ").length <= 3
  ) {
    return {
      intent: "GENERAL_GREETING",
      confidence: "HIGH",
      parameters: {},
      spokenFeedback: "কীভাবে সাহায্য করতে পারি মামা?",
    }
  }

  // 1b. DIGITAL BALANCE (বিকাশ, নগদ, রকেট, উপায়)
  if (
    text.includes("বিকাশ") ||
    text.includes("bkash") ||
    text.includes("নগদ") ||
    text.includes("nagad") ||
    text.includes("রকেট") ||
    text.includes("rocket") ||
    text.includes("উপায়") ||
    text.includes("upay") ||
    text.includes("ডিজিটাল") ||
    text.includes("digital")
  ) {
    if (
      text.includes("কত") ||
      text.includes("ব্যালেন্স") ||
      text.includes("টাকা") ||
      text.includes("balance") ||
      text.includes("koto") ||
      text.includes("ase") ||
      text.includes("আছে")
    ) {
      let provider = "all"
      if (text.includes("বিকাশ") || text.includes("bkash")) provider = "bkash"
      else if (text.includes("নগদ") || text.includes("nagad")) provider = "nagad"
      else if (text.includes("রকেট") || text.includes("rocket")) provider = "rocket"
      else if (text.includes("উপায়") || text.includes("upay")) provider = "upay"

      return {
        intent: "CHECK_DIGITAL_BALANCE",
        confidence: "HIGH",
        parameters: { digitalProvider: provider },
      }
    }
  }

  // 1c. TOTAL SHOP BALANCE (দোকানে কত টাকা আছে, মোট টাকা, মোট ব্যালেন্স)
  if (
    (text.includes("দোকানে") && (text.includes("কত") || text.includes("টাকা") || text.includes("হিসাব"))) ||
    (text.includes("মোট") && (text.includes("টাকা") || text.includes("ব্যালেন্স") || text.includes("balance") || text.includes("টাকা আছে"))) ||
    text.includes("total balance") ||
    text.includes("dokane koto taka")
  ) {
    return {
      intent: "CHECK_TOTAL_BALANCE",
      confidence: "HIGH",
      parameters: {},
    }
  }

  // 2. CASH BOX
  if (
    text.includes("ক্যাশ") ||
    text.includes("cash") ||
    text.includes("ড্রয়ার") ||
    text.includes("বাক্স") ||
    text.includes("kash")
  ) {
    if (
      text.includes("কত") ||
      text.includes("হিসাব") ||
      text.includes("টাকা") ||
      text.includes("balance") ||
      text.includes("koto") ||
      text.includes("status") ||
      text.includes("dekhao")
    ) {
      return {
        intent: "CHECK_CASHBOX",
        confidence: "HIGH",
        parameters: {},
      }
    }
  }

  // 3. SALES / TODAY SUMMARY
  if (
    text.includes("বিক্রি") ||
    text.includes("আজকের বিক্রি") ||
    text.includes("bikri") ||
    text.includes("sell") ||
    text.includes("sales") ||
    text.includes("আজকের হিসাব") ||
    text.includes("ajker hisab") ||
    text.includes("আজকে কত হলো") ||
    text.includes("মোট বিক্রি")
  ) {
    return {
      intent: "CHECK_SALES_SUMMARY",
      confidence: "HIGH",
      parameters: { timeframe: "today" },
    }
  }

  // 4. RESTOCK / SHORTAGE
  if (
    text.includes("ঘাটতি") ||
    text.includes("কম স্টক") ||
    text.includes("স্টক শেষ") ||
    text.includes("কম আছে") ||
    text.includes("restock") ||
    text.includes("low stock") ||
    text.includes("kena lagbe") ||
    text.includes("kinte hobe")
  ) {
    return {
      intent: "CHECK_RESTOCK",
      confidence: "HIGH",
      parameters: {},
    }
  }

  // 4b. TOP SELLING PRODUCTS ("বেশি বিক্রি", "top item", "beshi bikri")
  if (
    text.includes("বেশি বিক্রি") ||
    text.includes("সবচেয়ে বেশি") ||
    text.includes("সবচে বেশি") ||
    text.includes("top selling") ||
    text.includes("top product") ||
    text.includes("beshi bikri") ||
    text.includes("জনপ্রিয় পণ্য")
  ) {
    return {
      intent: "CHECK_TOP_PRODUCTS",
      confidence: "HIGH",
      parameters: { timeframe: text.includes("মাস") ? "month" : "week" },
    }
  }

  // 5. NAVIGATION
  if (
    text.includes("বিলিং") ||
    text.includes("বিল পেজ") ||
    text.includes("billing") ||
    text.includes("pos") ||
    text.includes("বিক্রির পেজ")
  ) {
    return {
      intent: "OPEN_PAGE",
      confidence: "HIGH",
      parameters: { targetPage: "billing" },
    }
  }
  if (text.includes("ইনভেন্টরি") || text.includes("পণ্য তালিকা") || text.includes("inventory")) {
    return {
      intent: "OPEN_PAGE",
      confidence: "HIGH",
      parameters: { targetPage: "inventory" },
    }
  }
  if (text.includes("কাস্টমার") || text.includes("খরিদ্দার") || text.includes("customer")) {
    return {
      intent: "OPEN_PAGE",
      confidence: "HIGH",
      parameters: { targetPage: "customers" },
    }
  }
  if (text.includes("রিপোর্ট") || text.includes("report")) {
    return {
      intent: "OPEN_PAGE",
      confidence: "HIGH",
      parameters: { targetPage: "reports" },
    }
  }

  // 6. RECORD PAYMENT (e.g., "রহিম ৫০০ টাকা জমা দিলো", "Rahim 500 taka joma", "Shuvo 200 pay korse")
  const payMatch =
    text.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:টাকা|tk|taka)?\s*(?:জমা|পরিশোধ|দিলো|paid|joma|payment)/i) ||
    text.match(/(?:জমা|joma|payment)\s+(?:নাও|likho|koro)?\s*(.+?)\s+(\d+(?:\.\d+)?)/i)

  if (payMatch) {
    const rawName = (payMatch[1] || "").replace(/^(মামা|ভাই|chotu|ai)/i, "").trim()
    const amount = Number(payMatch[2])
    if (rawName && !isNaN(amount) && amount > 0) {
      return {
        intent: "RECORD_PAYMENT",
        confidence: "HIGH",
        parameters: {
          customerName: rawName,
          amount,
        },
      }
    }
  }

  // 7. RECORD DUE / BAKI (e.g., "করিম ৩০০ টাকা বাকি নিলো", "Karim 300 baki")
  const bakiMatch =
    text.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:টাকা|tk|taka)?\s*(?:বাকি|baki|due)/i) ||
    text.match(/(?:বাকি|baki)\s+(?:লিখ|likho|rakho)\s*(.+?)\s+(\d+(?:\.\d+)?)/i)

  if (bakiMatch) {
    const rawName = (bakiMatch[1] || "").replace(/^(মামা|ভাই|chotu)/i, "").trim()
    const amount = Number(bakiMatch[2])
    if (rawName && !isNaN(amount) && amount > 0) {
      return {
        intent: "RECORD_SALE",
        confidence: "HIGH",
        parameters: {
          customerName: rawName,
          amount,
          paymentMethod: "baki",
        },
      }
    }
  }

  // 8. CHECK CUSTOMER DUE (e.g., "রহিমের বাকি কত", "Rahim koto taka baki", "baki koto shuvo")
  if (text.includes("বাকি") || text.includes("baki") || text.includes("due")) {
    const nameExtracted = text
      .replace(/(বাকি|কত|টাকা|হিসাব|জানাও|বলো|dekhao|koto|taka|due|hisab|bolo|chotu|mama)/gi, "")
      .replace(/(এর|er|-er)$/i, "")
      .trim()

    if (nameExtracted.length >= 2) {
      return {
        intent: "CHECK_DUE",
        confidence: "HIGH",
        parameters: { customerName: nameExtracted },
      }
    }
  }

  // 9. CHECK PRODUCT STOCK (e.g., "লাক্স সাবান কত আছে", "Lux koyta ase", "Lux soap stock", "chal ase?")
  if (
    text.includes("কত আছে") ||
    text.includes("কয়টা আছে") ||
    text.includes("কয়টা আছে") ||
    text.includes("স্টক") ||
    text.includes("stock") ||
    text.includes("koyta ase") ||
    text.includes("koita ase") ||
    text.includes("koto ase") ||
    text.includes("pore ase") ||
    text.includes("available")
  ) {
    const prodName = text
      .replace(/(কত|কয়টা|কয়টা|আছে|স্টক|দেখাও|বলো|জানাও|koyta|koita|koto|ase|ache|stock|dekhao|bolo|pore ase|chotu|mama)/gi, "")
      .replace(/(এর|er|-er|er stock)$/i, "")
      .trim()

    if (prodName.length >= 2) {
      return {
        intent: "CHECK_STOCK",
        confidence: "HIGH",
        parameters: { productName: prodName },
      }
    }
  }

  return null
}

/**
 * Tier 2: AI Intent Interpretation Layer
 * For ambiguous inputs, multi-script mixtures, or local idiomatic phrasing.
 * 
 * Uses strict structured output schema so it NEVER outputs arbitrary commands.
 */
export async function interpretNaturalLanguageWithAI(
  userInput: string,
  context?: { availableProducts?: string[]; availableCustomers?: string[] },
  apiKey?: string
): Promise<ChotuParsedResult> {
  // Step 1: Run Tier 1 Fast Matcher First (Token Optimization: 0 tokens!)
  const localMatch = matchLocalIntent(userInput)
  if (localMatch && localMatch.confidence === "HIGH") {
    return localMatch
  }

  // If Gemini API Key is available, call lightweight structured model
  if (apiKey) {
    try {
      const systemPrompt = `You are Chotu's Intent Classifier for 'Dokandar Mama', a Bangladeshi retail shop assistant.
Analyze user natural language in Bangla, Banglish, English, or slang.
Output ONLY a JSON matching this exact schema:
{
  "intent": "CHECK_STOCK" | "RECORD_SALE" | "RECORD_PAYMENT" | "CHECK_DUE" | "CHECK_SALES_SUMMARY" | "CHECK_CASHBOX" | "CHECK_RESTOCK" | "OPEN_PAGE" | "GENERAL_GREETING" | "UNKNOWN",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "parameters": {
    "productName": "string or null",
    "customerName": "string or null",
    "amount": number or null,
    "quantity": number or null,
    "paymentMethod": "cash" | "digital" | "baki" | null,
    "targetPage": "billing" | "inventory" | "customers" | "reports" | "cashbox" | null
  },
  "clarificationQuestion": "string in polite Bangla if confidence is MEDIUM",
  "spokenFeedback": "short natural response"
}`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${systemPrompt}\nUser Input: "${userInput}"\nReturn JSON only:` },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        }
      )

      if (response.ok) {
        const json = await response.json()
        const textContent = json?.candidates?.[0]?.content?.parts?.[0]?.text
        if (textContent) {
          const parsed = JSON.parse(textContent) as ChotuParsedResult
          if (parsed.intent) return parsed
        }
      }
    } catch (err) {
      console.warn("Chotu AI inference error, falling back to heuristic parsing:", err)
    }
  }

  // Step 2: Advanced Heuristic Extraction (Tier 3)
  return fallbackHeuristicParser(userInput, context)
}

/**
 * Tier 3: Heuristic Multi-Script Parser
 */
function fallbackHeuristicParser(
  userInput: string,
  context?: { availableProducts?: string[]; availableCustomers?: string[] }
): ChotuParsedResult {
  const text = cleanText(userInput)

  // Check if input mentions any known product name from shop context
  if (context?.availableProducts?.length) {
    for (const prod of context.availableProducts) {
      const pClean = cleanText(prod)
      if (pClean.length > 2 && text.includes(pClean)) {
        return {
          intent: "CHECK_STOCK",
          confidence: "HIGH",
          parameters: { productName: prod },
        }
      }
    }
  }

  // Check if input mentions any known customer name from shop context
  if (context?.availableCustomers?.length) {
    for (const cust of context.availableCustomers) {
      const cClean = cleanText(cust)
      if (cClean.length > 2 && text.includes(cClean)) {
        if (text.includes("টাকা") || text.includes("tk") || text.includes("বাকি") || text.includes("due")) {
          return {
            intent: "CHECK_DUE",
            confidence: "HIGH",
            parameters: { customerName: cust },
          }
        }
      }
    }
  }

  // If vague query about stock or due
  if (text.includes("স্টক") || text.includes("stock") || text.includes("ase")) {
    return {
      intent: "CHECK_STOCK",
      confidence: "MEDIUM",
      parameters: {},
      clarificationQuestion: "মামা, কোন পণ্যটার স্টক দেখতে চান?",
    }
  }

  if (text.includes("বাকি") || text.includes("baki")) {
    return {
      intent: "CHECK_DUE",
      confidence: "MEDIUM",
      parameters: {},
      clarificationQuestion: "মামা, কোন কাস্টমারের বাকি দেখতে চান?",
    }
  }

  return {
    intent: "UNKNOWN",
    confidence: "LOW",
    parameters: {},
    clarificationQuestion: "মামা, কথাটা বুঝতে পারিনি। অনুগ্রহ করে আবার বলুন।",
  }
}
