export type ChotuOutfit =
  | "traditional" // Panjabi with Gamcha (Grocery / Mudi)
  | "pharmacy"    // White Lab Coat & Stethoscope (Pharmacy)
  | "electronics" // Tech Vest & Smart Glasses (Electronics)
  | "clothing"    // Trendy Scarf & Denim (Fashion)
  | "apron"       // Green / Blue Store Apron (General Retail)
  | "genie"       // Classic Golden Magic Genie

export type ChotuPersonality =
  | "friendly"    // বন্ধুত্বপূর্ণ
  | "funny"       // রসিক
  | "helpful"     // সহায়তাকারী
  | "local_vibe"  // দেশি আমেজ
  | "smart"       // চালাক / শার্প

export type ChotuSize = "small" | "medium" | "large"
export type ChotuAnimationIntensity = "minimal" | "normal" | "expressive"
export type ChotuLanguage = "bn" | "en" | "banglish"

export type ChotuState = "idle" | "listening" | "thinking" | "speaking" | "success" | "error"

export interface ChotuConfig {
  outfit: ChotuOutfit
  capColor: string
  vestColor: string
  personality: ChotuPersonality
  language: ChotuLanguage
  size: ChotuSize
  animationIntensity: ChotuAnimationIntensity
  customGreeting?: string
  position?: { x: number; y: number }
  isMuted?: boolean
}

export const DEFAULT_CHOTU_CONFIG: ChotuConfig = {
  outfit: "traditional",
  capColor: "#2563eb", // Dokandar Blue
  vestColor: "#1d4ed8",
  personality: "friendly",
  language: "bn",
  size: "medium",
  animationIntensity: "normal",
  customGreeting: "কি লাগবে মামা? বলুন, আমি আছি!",
}

export const OUTFIT_OPTIONS: Array<{
  id: ChotuOutfit
  nameBn: string
  nameEn: string
  descBn: string
  badgeColor: string
}> = [
  {
    id: "traditional",
    nameBn: "দেশি পাঞ্জাবি ও গামছা",
    nameEn: "Traditional Panjabi",
    descBn: "মুদি ও সাধারণ দোকানের জন্য পারফেক্ট দেশি লুক",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    id: "pharmacy",
    nameBn: "ফার্মাসিস্ট কোট ও স্টেথো",
    nameEn: "Pharmacist Doctor",
    descBn: "ফার্মেসি ও হেলথকেয়ার দোকানের জন্য প্রফেশনাল লুক",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    id: "electronics",
    nameBn: "টেক ভেস্ট ও স্মার্ট গ্লাস",
    nameEn: "Tech Pro",
    descBn: "ইলেকট্রনিক্স ও হার্ডওয়্যার শপের জন্য আধুনিক স্মার্ট লুক",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    id: "clothing",
    nameBn: "ফ্যাশন মাফলার ও ডেনিম",
    nameEn: "Stylist Fashion",
    descBn: "গার্মেন্টস ও ফ্যাশন বুটিকের জন্য স্টাইলিশ লুক",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    id: "apron",
    nameBn: "শপকিপার এপ্রন",
    nameEn: "Store Apron",
    descBn: "সুপারশপ ও ডিপার্টমেন্টাল স্টোরের এপ্রন লুক",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    id: "genie",
    nameBn: "জাদুকরী জিনি (Classic)",
    nameEn: "Magic Genie",
    descBn: "আলাদিনের চেরাগের মতো সর্বজ্ঞানী সহকারী লুক",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-400",
  },
]

export const PERSONALITY_OPTIONS: Array<{
  id: ChotuPersonality
  nameBn: string
  descBn: string
  samplePhrase: string
  icon: string
}> = [
  {
    id: "friendly",
    nameBn: "বন্ধুত্বপূর্ণ (Friendly)",
    descBn: "সবসময় হাসি-খুশি ও আন্তরিক ব্যবহার",
    samplePhrase: "মামা, কি খবর? আজকের বেচাকেনা কেমন চলছে?",
    icon: "💙",
  },
  {
    id: "funny",
    nameBn: "রসিক (Funny)",
    descBn: "মজাদার কথা ও দোকানদার আড্ডার আমেজ",
    samplePhrase: "আরে মামা! টাকা আসছে তো নাকি শুধু চা খাওয়াচ্ছেন?",
    icon: "😄",
  },
  {
    id: "helpful",
    nameBn: "সহায়তাকারী (Helpful)",
    descBn: "দ্রুত কাজে সাহায্য ও সঠিক পরামর্শ",
    samplePhrase: "মামা, চিন্তা নেই! স্টক ও বাকির হিসাব আমি রাখছি।",
    icon: "🤝",
  },
  {
    id: "local_vibe",
    nameBn: "দেশি আমেজ (Local Vibe)",
    descBn: "খাটি বাংলা বাজার ও দোকানিদের নিজস্ব ঢং",
    samplePhrase: "মামা! খতিয়ান সব রেডি, শুধু হুকুম করেন!",
    icon: "🇧🇩",
  },
  {
    id: "smart",
    nameBn: "চালাক / শার্প (Smart JARVIS)",
    descBn: "রিয়েল-টাইম ডাটা ও স্মার্ট প্রেডিকশন",
    samplePhrase: "মামা, আজকের বিক্রি গত সপ্তাহের চেয়ে ১৮% বেশি!",
    icon: "⚡",
  },
]

export const COLOR_PRESETS = [
  { label: "ডলার ব্লু", cap: "#2563eb", vest: "#1d4ed8" },
  { label: "লিপ গ্রিন", cap: "#059669", vest: "#047857" },
  { label: "সানশাইন অরেঞ্জ", cap: "#ea580c", vest: "#c2410c" },
  { label: "রয়েল পার্পল", cap: "#7c3aed", vest: "#6d28d9" },
  { label: "ম্যাজিক সিয়ান", cap: "#0891b2", vest: "#0e7490" },
  { label: "গোল্ডেন ইয়েলো", cap: "#d97706", vest: "#b45309" },
  { label: "স্লিক ডার্ক", cap: "#1e293b", vest: "#0f172a" },
]

export function loadSavedChotuConfig(): ChotuConfig {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_CHOTU_CONFIG
  }
  try {
    const raw = localStorage.getItem("dokandar_chotu_config")
    if (raw) {
      return { ...DEFAULT_CHOTU_CONFIG, ...JSON.parse(raw) }
    }
  } catch (e) {
    console.error("Failed to load Chotu config", e)
  }
  return DEFAULT_CHOTU_CONFIG
}

export function saveChotuConfig(config: ChotuConfig): void {
  if (typeof window === "undefined" || !window.localStorage) return
  try {
    localStorage.setItem("dokandar_chotu_config", JSON.stringify(config))
  } catch (e) {
    console.error("Failed to save Chotu config", e)
  }
}
