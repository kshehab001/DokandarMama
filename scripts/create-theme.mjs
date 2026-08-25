import fs from 'fs';

const content = `import {
  ShoppingBag,
  Pill,
  Sparkles,
  BookOpen,
  Shirt,
  Tv,
  Smartphone,
  Store,
  Layers,
  HelpCircle,
  type LucideIcon,
  ShoppingCart,
  PackagePlus,
  UserPlus,
  FileBarChart,
  CalendarDays,
  ShieldCheck,
  Tag,
} from "lucide-react"

export type ShopCategoryId =
  | "mudi"
  | "pharmacy"
  | "cosmetics"
  | "stationery"
  | "clothing"
  | "electronics"
  | "accessories"
  | "general"
  | "super_shop"
  | "other"

export type UserRole = "superadmin" | "owner" | "manager" | "shopkeeper"

export interface CategoryThemeConfig {
  id: ShopCategoryId
  name: string
  displayNameBn: string
  taglineBn: string
  icon: LucideIcon
  colorHsl: {
    primary: string
    primaryForeground: string
    accent: string
    accentForeground: string
    ring: string
  }
  badgeClass: string
  gradientClass: string
  terminology: {
    shopTypeLabel: string
    productLabel: string
    stockLabel: string
    bakiLabel: string
    billLabel: string
    expiryLabel: string
    unitDefault: string
    catalogPrompt: string
  }
  features: {
    hasBarcode: boolean
    hasExpiry: boolean
    hasBatchTracking: boolean
    hasVariants: boolean
    hasWarranty: boolean
    hasBrand: boolean
    hasBaki: boolean
    hasDepartments: boolean
  }
  quickActions: Array<{
    href: string
    label: string
    sublabel: string
    icon: LucideIcon
    className: string
  }>
  suggestedChotuQueries: string[]
}

export const CATEGORY_THEMES: Record<ShopCategoryId, CategoryThemeConfig> = {
  mudi: {
    id: "mudi",
    name: "Grocery / Mudi Dokan",
    displayNameBn: "মুদি দোকান",
    taglineBn: "চাল, ডাল, তেল, চিনি, মসলা ও নিত্যপ্রয়োজনীয় পণ্যের দোকান",
    icon: ShoppingBag,
    colorHsl: {
      primary: "15 85% 55%",
      primaryForeground: "0 0% 100%",
      accent: "35 90% 50%",
      accentForeground: "20 40% 15%",
      ring: "15 85% 55%",
    },
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    gradientClass: "from-amber-500/10 via-primary/5 to-transparent",
    terminology: {
      shopTypeLabel: "মুদি দোকান",
      productLabel: "পণ্য / মালামাল",
      stockLabel: "মজুদ / স্টক",
      bakiLabel: "বাকি খাতা",
      billLabel: "ক্যাশমেমো",
      expiryLabel: "মেয়াদ শেষ",
      unitDefault: "কেজি / প্যাকেট",
      catalogPrompt: "চাল, ডাল, তেল, মসলা দ্রুত যোগ করুন",
    },
    features: {
      hasBarcode: true,
      hasExpiry: true,
      hasBatchTracking: false,
      hasVariants: false,
      hasWarranty: false,
      hasBrand: true,
      hasBaki: true,
      hasDepartments: false,
    },
    quickActions: [
      { href: "/app/billing", label: "নতুন বিক্রি", sublabel: "দ্রুত বিলিং", icon: ShoppingCart, className: "bg-primary text-primary-foreground" },
      { href: "/app/inventory", label: "মালামাল যোগ", sublabel: "ইনভেন্টরি", icon: PackagePlus, className: "bg-amber-500 text-white" },
      { href: "/app/customers", label: "বাকি খাতা", sublabel: "কাস্টমার খতিয়ান", icon: UserPlus, className: "bg-rose-600 text-white" },
      { href: "/app/reports", label: "দৈনিক খতিয়ান", sublabel: "রিপোর্ট", icon: FileBarChart, className: "bg-slate-700 text-white" },
    ],
    suggestedChotuQueries: [
      "আজকে কত বিক্রি হয়েছে?",
      "কোন কোন পণ্য স্টকে কম আছে?",
      "মোট বাকি কত টাকা?",
      "চাল কত কেজি বাকি আছে?",
    ],
  },

  pharmacy: {
    id: "pharmacy",
    name: "Pharmacy / Medicine",
    displayNameBn: "ওষুধের ফার্মেসি",
    taglineBn: "ওষুধ, ফার্মা সামগ্রী, প্রেসক্রিপশন ও মেয়াদোত্তীর্ণ ট্র্যাকিং",
    icon: Pill,
    colorHsl: {
      primary: "168 76% 38%",
      primaryForeground: "0 0% 100%",
      accent: "185 70% 45%",
      accentForeground: "0 0% 100%",
      ring: "168 76% 38%",
    },
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    gradientClass: "from-emerald-500/10 via-teal-500/5 to-transparent",
    terminology: {
      shopTypeLabel: "ফার্মেসি",
      productLabel: "ওষুধের নাম (Generic / Brand)",
      stockLabel: "পাতা / বক্স স্টক",
      bakiLabel: "পাওনা হিসাব",
      billLabel: "প্রেসক্রিপশন ক্যাশমেমো",
      expiryLabel: "মেয়াদোত্তীর্ণ (Expiry)",
      unitDefault: "পাতা / বক্স",
      catalogPrompt: "প্যারাসিটামল, অ্যান্টিবায়োটিক, সিভার সিরাপ",
    },
    features: {
      hasBarcode: true,
      hasExpiry: true,
      hasBatchTracking: true,
      hasVariants: false,
      hasWarranty: false,
      hasBrand: true,
      hasBaki: true,
      hasDepartments: false,
    },
    quickActions: [
      { href: "/app/billing", label: "ওষুধ বিক্রি", sublabel: "প্রেসক্রিপশন বিলিং", icon: ShoppingCart, className: "bg-emerald-600 text-white" },
      { href: "/app/inventory", label: "নতুন ওষুধ যোগ", sublabel: "ব্যাচ ও মেয়াদ", icon: PackagePlus, className: "bg-teal-600 text-white" },
      { href: "/app/customers", label: "নিয়মিত রোগী", sublabel: "কাস্টমার হিসাব", icon: UserPlus, className: "bg-cyan-700 text-white" },
      { href: "/app/reports", label: "মেয়াদোত্তীর্ণ রিপোর্ট", sublabel: "Expiry Intelligence", icon: CalendarDays, className: "bg-emerald-800 text-white" },
    ],
    suggestedChotuQueries: [
      "কোন কোন ওষুধের মেয়াদ সামনে শেষ হবে?",
      "নাপা বা প্যারাসিটামলের স্টক কত পাতা আছে?",
      "আজকের ফার্মেসি বিক্রি কত?",
      "স্টক শেষ হওয়া ওষুধগুলোর তালিকা দাও",
    ],
  },

  cosmetics: {
    id: "cosmetics",
    name: "Cosmetics & Beauty",
    displayNameBn: "কসমেটিকস ও বিউটি",
    taglineBn: "স্কিনকেয়ার, মেকআপ, পারফিউম ও বিউটি প্রোডাক্টস",
    icon: Sparkles,
    colorHsl: {
      primary: "335 78% 55%",
      primaryForeground: "0 0% 100%",
      accent: "310 70% 50%",
      accentForeground: "0 0% 100%",
      ring: "335 78% 55%",
    },
    badgeClass: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    gradientClass: "from-pink-500/10 via-rose-500/5 to-transparent",
    terminology: {
      shopTypeLabel: "কসমেটিকস শপ",
      productLabel: "আইটেম ও ব্র্যান্ড",
      stockLabel: "স্টক পিস",
      bakiLabel: "কাস্টমার বাকি",
      billLabel: "ক্যাশ রসিদ",
      expiryLabel: "ব্যবহারের মেয়াদ (Expiry)",
      unitDefault: "পিস / সেট",
      catalogPrompt: "লোশন, ফেসওয়াশ, লিপস্টিক, পারফিউম",
    },
    features: {
      hasBarcode: true,
      hasExpiry: true,
      hasBatchTracking: false,
      hasVariants: true,
      hasWarranty: false,
      hasBrand: true,
      hasBaki: true,
      hasDepartments: false,
    },
    quickActions: [
      { href: "/app/billing", label: "কসমেটিকস বিল", sublabel: "রসিদ তৈরি", icon: ShoppingCart, className: "bg-pink-600 text-white" },
      { href: "/app/inventory", label: "আইটেম যোগ", sublabel: "শেড ও ব্র্যান্ড", icon: Tag, className: "bg-rose-500 text-white" },
      { href: "/app/customers", label: "কাস্টমার লিস্ট", sublabel: "মেম্বারশিপ", icon: UserPlus, className: "bg-purple-600 text-white" },
      { href: "/app/reports", label: "টপ ব্র্যান্ড রিপোর্ট", sublabel: "বিক্রির ট্রেন্ড", icon: FileBarChart, className: "bg-pink-800 text-white" },
    ],
    suggestedChotuQueries: [
      "সবচেয়ে বেশি বিক্রি হওয়া কসমেটিকস কোনটি?",
      "কোন ব্র্যান্ডের পণ্য স্টকে শেষ?",
      "আজকের মোট বিক্রি কত?",
    ],
  },

  clothing: {
    id: "clothing",
    name: "Clothing & Fashion",
    displayNameBn: "পোশাক ও ফ্যাশন",
    taglineBn: "গার্মেন্টস, শাড়ি, শার্ট-প্যান্ট ও ফ্যাশন ওয়্যার",
    icon: Shirt,
    colorHsl: {
      primary: "270 70% 52%",
      primaryForeground: "0 0% 100%",
      accent: "290 65% 48%",
      accentForeground: "0 0% 100%",
      ring: "270 70% 52%",
    },
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    gradientClass: "from-purple-500/10 via-violet-500/5 to-transparent",
    terminology: {
      shopTypeLabel: "ফ্যাশন শোরুম",
      productLabel: "পোশাক / ডিজাইন কোড",
      stockLabel: "সাইজ / কালার স্টক",
      bakiLabel: "বকেয়া খাতা",
      billLabel: "বিক্রয় বিল",
      expiryLabel: "সিজনাল কালেকশন",
      unitDefault: "পিস / সেট",
      catalogPrompt: "টি-শার্ট, জিন্স, পাঞ্জাবি, থ্রি-পিস",
    },
    features: {
      hasBarcode: true,
      hasExpiry: false,
      hasBatchTracking: false,
      hasVariants: true,
      hasWarranty: false,
      hasBrand: true,
      hasBaki: true,
      hasDepartments: false,
    },
    quickActions: [
      { href: "/app/billing", label: "পোশাক বিলিং", sublabel: "ট্যাগ স্ক্যান", icon: ShoppingCart, className: "bg-purple-600 text-white" },
      { href: "/app/inventory", label: "নতুন ডিজাইন যোগ", sublabel: "সাইজ ও কালার", icon: PackagePlus, className: "bg-violet-600 text-white" },
      { href: "/app/customers", label: "কাস্টমার হিসাব", sublabel: "রেগুলার বায়ার", icon: UserPlus, className: "bg-indigo-600 text-white" },
      { href: "/app/reports", label: "সাইজ ভিত্তিক সেলস", sublabel: "ফ্যাশন রিপোর্ট", icon: FileBarChart, className: "bg-purple-900 text-white" },
    ],
    suggestedChotuQueries: [
      "কোন সাইজের পোশাক সবচেয়ে বেশি বিক্রি হচ্ছে?",
      "কোন কালেকশনের স্টক কম?",
      "আজকের মোট বিক্রি কত টাকা?",
    ],
  },

  electronics: {
    id: "electronics",
    name: "Electronics & Appliances",
    displayNameBn: "ইলেকট্রনিক্স শপ",
    taglineBn: "টিভি, ফ্রিজ, ফ্যান, হোম অ্যাপ্লায়েন্স ও ওয়ারেন্টি",
    icon: Tv,
    colorHsl: {
      primary: "215 88% 48%",
      primaryForeground: "0 0% 100%",
      accent: "200 80% 45%",
      accentForeground: "0 0% 100%",
      ring: "215 88% 48%",
    },
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    gradientClass: "from-blue-500/10 via-sky-500/5 to-transparent",
    terminology: {
      shopTypeLabel: "ইলেকট্রনিক্স শোরুম",
      productLabel: "মডেল / ডিভাইস",
      stockLabel: "মডেল স্টক",
      bakiLabel: "কিস্তি ও বকেয়া",
      billLabel: "ওয়ারেন্টি ইনভয়েস",
      expiryLabel: "ওয়ারেন্টি মেয়াদ",
      unitDefault: "পিস / সেট",
      catalogPrompt: "রাইস কুকার, ব্লেন্ডার, আয়রন, ফ্যান",
    },
    features: {
      hasBarcode: true,
      hasExpiry: false,
      hasBatchTracking: false,
      hasVariants: false,
      hasWarranty: true,
      hasBrand: true,
      hasBaki: true,
      hasDepartments: false,
    },
    quickActions: [
      { href: "/app/billing", label: "ইনভয়েস তৈরি", sublabel: "ওয়ারেন্টি সহ বিল", icon: ShoppingCart, className: "bg-blue-600 text-white" },
      { href: "/app/inventory", label: "মডেল যোগ", sublabel: "সিরিয়াল ও ব্র্যান্ড", icon: PackagePlus, className: "bg-sky-600 text-white" },
      { href: "/app/customers", label: "ওয়ারেন্টি তালিকা", sublabel: "কাস্টমার খতিয়ান", icon: ShieldCheck, className: "bg-indigo-600 text-white" },
      { href: "/app/reports", label: "ইনভেন্টরি ভ্যালু", sublabel: "মূলধন ও স্টক", icon: FileBarChart, className: "bg-blue-900 text-white" },
    ],
    suggestedChotuQueries: [
      "দোকানের মোট ইনভেন্টরি ভ্যালু কত টাকা?",
      "কোন মডেলের স্টক দ্রুত শেষ হচ্ছে?",
      "আজকে কত টাকা বিক্রি ও ক্যাশ জমা হলো?",
    ],
  },

  accessories: {
    id: "accessories",
    name: "Mobile Accessories",
    displayNameBn: "মোবাইল অ্যাক্সেসরিজ",
    taglineBn: "চার্জার, ক্যাবল, ব্যাককভার, গ্লাস ও গ্যাজেট সামগ্রী",
    icon: Smartphone,
    colorHsl: {
      primary: "195 90% 42%",
      primaryForeground: "0 0% 100%",
      accent: "175 80% 40%",
      accentForeground: "0 0% 100%",
      ring: "195 90% 42%",
    },
    badgeClass: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    gradientClass: "from-cyan-500/10 via-teal-500/5 to-transparent",
    terminology: {
      shopTypeLabel: "মোবাইল অ্যাক্সেসরিজ",
      productLabel: "আইটেম / মডেল কম্প্যাটিবল",
      stockLabel: "স্টক সংখ্যা",
      bakiLabel: "বাকি খাতা",
      billLabel: "ক্যাশ রসিদ",
      expiryLabel: "গ্যারান্টি মেয়াদ",
      unitDefault: "পিস",
      catalogPrompt: "ক্যাবল, অ্যাডাপ্টার, হেডফোন, পাওয়ারব্যাংক",
    },
    features: {
      hasBarcode: true,
      hasExpiry: false,
      hasBatchTracking: false,
      hasVariants: true,
      hasWarranty: true,
      hasBrand: true,
      hasBaki: true,
      hasDepartments: false,
    },
    quickActions: [
      { href: "/app/billing", label: "দ্রুত বিক্রি", sublabel: "বারকোড স্ক্যান", icon: ShoppingCart, className: "bg-cyan-600 text-white" },
      { href: "/app/inventory", label: "গ্যাজেট যোগ", sublabel: "মডেল ও ব্রান্ড", icon: PackagePlus, className: "bg-teal-600 text-white" },
      { href: "/app/customers", label: "কাস্টমার হিসাব", sublabel: "বাকি খতিয়ান", icon: UserPlus, className: "bg-blue-600 text-white" },
      { href: "/app/reports", label: "টপ আইটেম", sublabel: "বেস্ট সেলিং", icon: FileBarChart, className: "bg-cyan-900 text-white" },
    ],
    suggestedChotuQueries: [
      "সবচেয়ে বেশি বিক্রি হওয়া অ্যাক্সেসরিজ কোনটি?",
      "কোন ক্যাবল বা চার্জারের স্টক শেষ?",
      "আজকের মোট বিক্রি কত টাকা?",
    ],
  },

  stationery: {
    id: "stationery",
    name: "Stationery & Books",
    displayNameBn: "স্টেশনারি ও বই-খাতা",
    taglineBn: "খাতা, কলম, বই, আর্ট পেপার ও অফিস স্টেশনারি",
    icon: BookOpen,
    colorHsl: {
      primary: "245 75% 58%",
      primaryForeground: "0 0% 100%",
      accent: "220 80% 55%",
      accentForeground: "0 0% 100%",
      ring: "245 75% 58%",
    },
    badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    gradientClass: "from-indigo-500/10 via-blue-500/5 to-transparent",
    terminology: {
      shopTypeLabel: "স্টেশনারি শপ",
      productLabel: "বই / খাতা / স্টেশনারি",
      stockLabel: "ডজন / পিস স্টক",
      bakiLabel: "বাকি খাতা",
      billLabel: "ক্যাশমেমো",
      expiryLabel: "শিক্ষাবর্ষ সিজন",
      unitDefault: "পিস / ডজন / বক্স",
      catalogPrompt: "কলম, খাতা, ফাইল, ক্যালকুলেটর",
    },
    features: {
      hasBarcode: true,
      hasExpiry: false,
      hasBatchTracking: false,
      hasVariants: false,
      hasWarranty: false,
      hasBrand: true,
      hasBaki: true,
      hasDepartments: false,
    },
    quickActions: [
      { href: "/app/billing", label: "স্টেশনারি বিক্রি", sublabel: "প্যাক/পিস বিল", icon: ShoppingCart, className: "bg-indigo-600 text-white" },
      { href: "/app/inventory", label: "নতুন আইটেম", sublabel: "বই ও স্টেশনারি", icon: PackagePlus, className: "bg-blue-600 text-white" },
      { href: "/app/customers", label: "স্কুল / অফিস ক্লায়েন্ট", sublabel: "রেগুলার কাস্টমার", icon: UserPlus, className: "bg-violet-600 text-white" },
      { href: "/app/reports", label: "সিজনাল রিপোর্ট", sublabel: "বিক্রির ট্রেন্ড", icon: FileBarChart, className: "bg-indigo-900 text-white" },
    ],
    suggestedChotuQueries: [
      "কোন কলম বা খাতার স্টক শেষের দিকে?",
      "এই সপ্তাহে সবচেয়ে বেশি বিক্রি হয়েছে কোনটা?",
      "আজকের মোট বিক্রি কত টাকা?",
    ],
  },

  super_shop: {
    id: "super_shop",
    name: "Super Shop & Chain",
    displayNameBn: "সুপার শপ / চেইন",
    taglineBn: "মাল্টি-ডিপার্টমেন্টাল স্টোর, বড় ইনভেন্টরি ও একাধিক কাউন্টার",
    icon: Layers,
    colorHsl: {
      primary: "152 75% 36%",
      primaryForeground: "0 0% 100%",
      accent: "45 95% 48%",
      accentForeground: "20 40% 15%",
      ring: "152 75% 36%",
    },
    badgeClass: "bg-emerald-600/10 text-emerald-700 border-emerald-600/20",
    gradientClass: "from-emerald-600/10 via-amber-500/5 to-transparent",
    terminology: {
      shopTypeLabel: "সুপার শপ",
      productLabel: "পণ্য (SKU / Barcode)",
      stockLabel: "ডিপার্টমেন্ট স্টক",
      bakiLabel: "কর্পোরেট বাকি ও মেম্বার",
      billLabel: "POS রসিদ",
      expiryLabel: "মেয়াদোত্তীর্ণ এলার্ট",
      unitDefault: "পিস / কেজি / প্যাক",
      catalogPrompt: "গ্রোসারি, বেকারি, বেভারেজ, হাউসহোল্ড",
    },
    features: {
      hasBarcode: true,
      hasExpiry: true,
      hasBatchTracking: true,
      hasVariants: true,
      hasWarranty: true,
      hasBrand: true,
      hasBaki: true,
      hasDepartments: true,
    },
    quickActions: [
      { href: "/app/billing", label: "সুপার POS বিলিং", sublabel: "হাই-স্পিড বারকোড", icon: ShoppingCart, className: "bg-emerald-700 text-white" },
      { href: "/app/inventory", label: "বাল্ক স্টক ম্যানেজমেন্ট", sublabel: "SKU ও ডিপার্টমেন্ট", icon: PackagePlus, className: "bg-amber-600 text-white" },
      { href: "/app/cashbox", label: "কাউন্টার ক্যাশ বক্স", sublabel: "শিফট হিসাব", icon: FileBarChart, className: "bg-teal-700 text-white" },
      { href: "/app/reports", label: "অ্যাডভান্সড অ্যানালিটিক্স", sublabel: "চেইন রিপোর্ট", icon: FileBarChart, className: "bg-emerald-950 text-white" },
    ],
    suggestedChotuQueries: [
      "আজকের সবগুলো কাউন্টারের মোট বিক্রি কত?",
      "কোন ডিপার্টমেন্টের বিক্রি সবচেয়ে বেশি?",
      "মেয়াদ শেষ হতে যাওয়া পণ্যগুলোর তালিকা দাও",
      "কাউন্টারের ড্রয়ারে কত টাকা থাকা উচিত?",
    ],
  },

  general: {
    id: "general",
    name: "General Store",
    displayNameBn: "জেনারেল স্টোর",
    taglineBn: "মিশ্র পণ্য ও সাধারণ খুচরা ব্যবসা",
    icon: Store,
    colorHsl: {
      primary: "220 70% 50%",
      primaryForeground: "0 0% 100%",
      accent: "25 90% 52%",
      accentForeground: "0 0% 100%",
      ring: "220 70% 50%",
    },
    badgeClass: "bg-slate-500/10 text-slate-700 border-slate-500/20",
    gradientClass: "from-slate-500/10 via-primary/5 to-transparent",
    terminology: {
      shopTypeLabel: "জেনারেল স্টোর",
      productLabel: "পণ্য / আইটেম",
      stockLabel: "বর্তমান স্টক",
      bakiLabel: "বাকি খাতা",
      billLabel: "ক্যাশমেমো",
      expiryLabel: "মেয়াদ শেষ",
      unitDefault: "পিস",
      catalogPrompt: "সাধারণ পণ্য ও নিত্যপ্রয়োজনীয় আইটেম",
    },
    features: {
      hasBarcode: true,
      hasExpiry: true,
      hasBatchTracking: false,
      hasVariants: false,
      hasWarranty: false,
      hasBrand: true,
      hasBaki: true,
      hasDepartments: false,
    },
    quickActions: [
      { href: "/app/billing", label: "নতুন বিল", sublabel: "বিক্রি করুন", icon: ShoppingCart, className: "bg-slate-800 text-white" },
      { href: "/app/inventory", label: "পণ্য যোগ", sublabel: "ইনভেন্টরি", icon: PackagePlus, className: "bg-blue-600 text-white" },
      { href: "/app/customers", label: "কাস্টমার খাতা", sublabel: "বাকি হিসাব", icon: UserPlus, className: "bg-amber-600 text-white" },
      { href: "/app/reports", label: "রিপোর্ট দেখুন", sublabel: "বিক্রির খতিয়ান", icon: FileBarChart, className: "bg-slate-700 text-white" },
    ],
    suggestedChotuQueries: [
      "আজকে মোট কত টাকা বিক্রি হলো?",
      "দোকানের মোট বাকি কত টাকা?",
      "কোন কোন পণ্য আবার কিনতে হবে?",
    ],
  },

  other: {
    id: "other",
    name: "Custom / Other Business",
    displayNameBn: "অন্যান্য ব্যবসা",
    taglineBn: "কাস্টম ব্যবসা, পাইকারি ও রিটেল সার্ভিস",
    icon: HelpCircle,
    colorHsl: {
      primary: "15 85% 55%",
      primaryForeground: "0 0% 100%",
      accent: "20 40% 15%",
      accentForeground: "0 0% 100%",
      ring: "15 85% 55%",
    },
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    gradientClass: "from-primary/10 via-accent/5 to-transparent",
    terminology: {
      shopTypeLabel: "ব্যবসা প্রতিষ্ঠান",
      productLabel: "পণ্য ও সেবা",
      stockLabel: "স্টক / ইনভেন্টরি",
      bakiLabel: "বাকি খাতা",
      billLabel: "ক্যাশমেমো",
      expiryLabel: "মেয়াদ",
      unitDefault: "পিস",
      catalogPrompt: "আপনার ব্যবসার মালামাল ও আইটেম",
    },
    features: {
      hasBarcode: true,
      hasExpiry: true,
      hasBatchTracking: false,
      hasVariants: true,
      hasWarranty: true,
      hasBrand: true,
      hasBaki: true,
      hasDepartments: false,
    },
    quickActions: [
      { href: "/app/billing", label: "নতুন বিল", sublabel: "বিক্রি করুন", icon: ShoppingCart, className: "bg-primary text-primary-foreground" },
      { href: "/app/inventory", label: "পণ্য যোগ", sublabel: "ইনভেন্টরি", icon: PackagePlus, className: "bg-accent/90 text-accent-foreground" },
      { href: "/app/customers", label: "কাস্টমার যোগ", sublabel: "বাকি হিসাব", icon: UserPlus, className: "bg-secondary text-secondary-foreground" },
      { href: "/app/reports", label: "রিপোর্ট দেখুন", sublabel: "বিক্রির খতিয়ান", icon: FileBarChart, className: "bg-muted text-foreground" },
    ],
    suggestedChotuQueries: [
      "আজকে কত বিক্রি হয়েছে?",
      "মোট বাকি কত টাকা?",
      "কোন পণ্য স্টকে কম আছে?",
    ],
  },
}

export const CATEGORY_LIST: CategoryThemeConfig[] = Object.values(CATEGORY_THEMES)

export function getCategoryTheme(categoryStr?: string | null): CategoryThemeConfig {
  if (!categoryStr) return CATEGORY_THEMES.mudi
  const key = categoryStr.toLowerCase().trim() as ShopCategoryId
  return CATEGORY_THEMES[key] || CATEGORY_THEMES.other
}
`

fs.writeFileSync('artifacts/dokandar-mama/src/lib/theme-config.ts', content, 'utf8');
console.log('theme-config.ts created successfully');
