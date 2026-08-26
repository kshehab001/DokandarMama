import type { ShopCategoryId } from "./theme-config"

export type StarterCatalogItem = {
  name: string
  category: string
  unit: string
  price: number
  costPrice: number
  stock: number
  lowStockThreshold: number
}

// 1. মুদি ও ডিপার্টমেন্টাল (Grocery / Mudi)
const MUDI_CATALOG: StarterCatalogItem[] = [
  { name: "মিনিকেট চাল", category: "চাল ও ডাল", unit: "কেজি", price: 78, costPrice: 72, stock: 100, lowStockThreshold: 15 },
  { name: "নাজিরশাইল চাল", category: "চাল ও ডাল", unit: "কেজি", price: 68, costPrice: 62, stock: 100, lowStockThreshold: 15 },
  { name: "মসুর ডাল (দেশি)", category: "চাল ও ডাল", unit: "কেজি", price: 135, costPrice: 122, stock: 40, lowStockThreshold: 8 },
  { name: "সয়াবিন তেল (১ লিটার)", category: "তেল ও ঘি", unit: "লিটার", price: 189, costPrice: 178, stock: 50, lowStockThreshold: 10 },
  { name: "সয়াবিন তেল (৫ লিটার)", category: "তেল ও ঘি", unit: "পিস", price: 890, costPrice: 850, stock: 15, lowStockThreshold: 3 },
  { name: "হলুদ গুঁড়া", category: "মসলা", unit: "কেজি", price: 320, costPrice: 290, stock: 15, lowStockThreshold: 3 },
  { name: "মরিচ গুঁড়া", category: "মসলা", unit: "কেজি", price: 380, costPrice: 345, stock: 15, lowStockThreshold: 3 },
  { name: "লবণ (আয়োডিনযুক্ত)", category: "মসলা", unit: "কেজি", price: 40, costPrice: 35, stock: 60, lowStockThreshold: 10 },
  { name: "চিনি", category: "মসলা", unit: "কেজি", price: 132, costPrice: 122, stock: 60, lowStockThreshold: 15 },
  { name: "গুঁড়া দুধ (ডানো ৫০০ গ্রাম)", category: "দুগ্ধজাত পণ্য", unit: "প্যাকেট", price: 430, costPrice: 395, stock: 20, lowStockThreshold: 4 },
  { name: "টোস্ট বিস্কুট", category: "নাস্তা", unit: "প্যাকেট", price: 40, costPrice: 34, stock: 40, lowStockThreshold: 8 },
  { name: "লাক্স সাবান (১০০ গ্রাম)", category: "প্রসাধন ও টয়লেট্রিজ", unit: "পিস", price: 60, costPrice: 52, stock: 40, lowStockThreshold: 8 },
  { name: "হুইল ওয়াশিং পাউডার (৫০০ গ্রাম)", category: "পরিচ্ছন্নতা সামগ্রী", unit: "প্যাকেট", price: 65, costPrice: 58, stock: 35, lowStockThreshold: 6 },
  { name: "ক্লোজআপ টুথপেস্ট (১০০ গ্রাম)", category: "প্রসাধন ও টয়লেট্রিজ", unit: "পিস", price: 95, costPrice: 84, stock: 30, lowStockThreshold: 5 },
]

// 2. ফার্মেসি ও ঔষধ (Pharmacy)
const PHARMACY_CATALOG: StarterCatalogItem[] = [
  { name: "Napa Extra 500mg (প্যারাসিটামল)", category: "পেইন কিলার", unit: "পাতা", price: 30, costPrice: 24, stock: 100, lowStockThreshold: 20 },
  { name: "Ace Plus 500mg", category: "পেইন কিলার", unit: "পাতা", price: 30, costPrice: 24, stock: 80, lowStockThreshold: 15 },
  { name: "Seclo 20mg (অমিপ্রাজল)", category: "গ্যাস্ট্রিক", unit: "পাতা", price: 60, costPrice: 48, stock: 120, lowStockThreshold: 25 },
  { name: "Losectil 20mg", category: "গ্যাস্ট্রিক", unit: "পাতা", price: 60, costPrice: 48, stock: 100, lowStockThreshold: 20 },
  { name: "Alatrol 10mg (অ্যালার্জি)", category: "অ্যালার্জি", unit: "পাতা", price: 35, costPrice: 28, stock: 60, lowStockThreshold: 12 },
  { name: "Histacin (অ্যালার্জি)", category: "অ্যালার্জি", unit: "পাতা", price: 10, costPrice: 7, stock: 100, lowStockThreshold: 20 },
  { name: "ORSaline-N (খাবার স্যালাইন)", category: "স্যালাইন", unit: "প্যাকেট", price: 6, costPrice: 4.5, stock: 200, lowStockThreshold: 40 },
  { name: "Tasty Saline", category: "স্যালাইন", unit: "প্যাকেট", price: 8, costPrice: 6, stock: 150, lowStockThreshold: 30 },
  { name: "Handiplast (ব্যান্ডেজ)", category: "ফার্স্ট এইড", unit: "পিস", price: 5, costPrice: 3, stock: 100, lowStockThreshold: 25 },
  { name: "Savlon Antiseptic (100ml)", category: "ফার্স্ট এইড", unit: "বোতল", price: 55, costPrice: 45, stock: 30, lowStockThreshold: 6 },
  { name: "Tusca Cough Syrup (100ml)", category: "কাশি ও ঠান্ডা", unit: "বোতল", price: 90, costPrice: 75, stock: 25, lowStockThreshold: 5 },
]

// 3. পোশাক ও ফ্যাশন (Clothing)
const CLOTHING_CATALOG: StarterCatalogItem[] = [
  { name: "পুরুষ সুতি পাঞ্জাবি (L)", category: "পাঞ্জাবি", unit: "পিস", price: 1250, costPrice: 850, stock: 20, lowStockThreshold: 4 },
  { name: "পুরুষ ক্যাজুয়াল শার্ট (M)", category: "শার্ট", unit: "পিস", price: 850, costPrice: 550, stock: 30, lowStockThreshold: 6 },
  { name: "পুরুষ ডেনিম জিন্স প্যান্ট (32)", category: "প্যান্ট", unit: "পিস", price: 1100, costPrice: 750, stock: 25, lowStockThreshold: 5 },
  { name: "প্রিন্টেড কটন টি-শার্ট (L)", category: "টি-শার্ট", unit: "পিস", price: 350, costPrice: 200, stock: 50, lowStockThreshold: 10 },
  { name: "সুতি থ্রি-পিস (আনস্টিচড)", category: "থ্রি-পিস", unit: "সেট", price: 1450, costPrice: 950, stock: 15, lowStockThreshold: 3 },
  { name: "টাঙ্গাইল সুতি শাড়ি", category: "শাড়ি", unit: "পিস", price: 950, costPrice: 650, stock: 18, lowStockThreshold: 4 },
  { name: "ছোটদের সুতি ফ্রক (২-৪ বছর)", category: "কিডস ওয়্যার", unit: "পিস", price: 450, costPrice: 280, stock: 20, lowStockThreshold: 5 },
  { name: "লুঙ্গি (আমানত শাহ ৫ হাত)", category: "হোমওয়্যার", unit: "পিস", price: 420, costPrice: 320, stock: 30, lowStockThreshold: 6 },
]

// 4. ইলেকট্রনিক্স ও গ্যাজেট (Electronics)
const ELECTRONICS_CATALOG: StarterCatalogItem[] = [
  { name: "Type-C Fast Charging Cable (1m)", category: "ক্যাবল ও চার্জার", unit: "পিস", price: 180, costPrice: 90, stock: 40, lowStockThreshold: 8 },
  { name: "20W PD Fast Charger Adapter", category: "ক্যাবল ও চার্জার", unit: "পিস", price: 450, costPrice: 260, stock: 25, lowStockThreshold: 5 },
  { name: "In-Ear 3.5mm Earphone (Bass)", category: "অডিও ও হেডফোন", unit: "পিস", price: 220, costPrice: 110, stock: 30, lowStockThreshold: 6 },
  { name: "TWS Wireless Bluetooth Earbuds", category: "অডিও ও হেডফোন", unit: "পিস", price: 850, costPrice: 520, stock: 15, lowStockThreshold: 3 },
  { name: "10000mAh Power Bank (Fast Charge)", category: "পাওয়ার ব্যাংক", unit: "পিস", price: 1250, costPrice: 850, stock: 12, lowStockThreshold: 3 },
  { name: "Multi-plug Extension Socket (4 port)", category: "ইলেকট্রিক্যাল", unit: "পিস", price: 380, costPrice: 240, stock: 20, lowStockThreshold: 4 },
  { name: "32GB MicroSD Memory Card (Class 10)", category: "মেমোরি কার্ড", unit: "পিস", price: 420, costPrice: 280, stock: 25, lowStockThreshold: 5 },
]

// 5. কসমেটিক্স ও বিউটি (Cosmetics)
const COSMETICS_CATALOG: StarterCatalogItem[] = [
  { name: "Fair & Lovely Face Cream (50g)", category: "স্কিন কেয়ার", unit: "পিস", price: 160, costPrice: 135, stock: 30, lowStockThreshold: 6 },
  { name: "Garnier Men Face Wash (100g)", category: "ফেসওয়াশ", unit: "পিস", price: 260, costPrice: 215, stock: 25, lowStockThreshold: 5 },
  { name: "Himalaya Neem Face Wash (150ml)", category: "ফেসওয়াশ", unit: "পিস", price: 280, costPrice: 230, stock: 20, lowStockThreshold: 4 },
  { name: "Sunsilk Black Shine Shampoo (180ml)", category: "হেয়ার কেয়ার", unit: "বোতল", price: 240, costPrice: 200, stock: 25, lowStockThreshold: 5 },
  { name: "Parachute Coconut Oil (200ml)", category: "হেয়ার কেয়ার", unit: "বোতল", price: 175, costPrice: 145, stock: 35, lowStockThreshold: 7 },
  { name: "Nivea Body Lotion (200ml)", category: "বডি কেয়ার", unit: "বোতল", price: 320, costPrice: 260, stock: 20, lowStockThreshold: 4 },
  { name: "Matte Lipstick (Red/Pink Shade)", category: "মেকআপ", unit: "পিস", price: 220, costPrice: 130, stock: 40, lowStockThreshold: 8 },
]

// 6. হার্ডওয়্যার ও স্যানিটারি (Hardware)
const HARDWARE_CATALOG: StarterCatalogItem[] = [
  { name: "PVC Water Tap (১/২ ইঞ্চি)", category: "প্লাম্বিং", unit: "পিস", price: 85, costPrice: 55, stock: 40, lowStockThreshold: 8 },
  { name: "G.I. Pipe Socket (৩/৪ ইঞ্চি)", category: "প্লাম্বিং", unit: "পিস", price: 45, costPrice: 30, stock: 60, lowStockThreshold: 12 },
  { name: "Paint Brush (৩ ইঞ্চি)", category: "পেইন্টিং", unit: "পিস", price: 110, costPrice: 70, stock: 30, lowStockThreshold: 6 },
  { name: "LED Energy Bulb (12W)", category: "ইলেকট্রিক্যাল", unit: "পিস", price: 160, costPrice: 110, stock: 50, lowStockThreshold: 10 },
  { name: "Steel Hammer (হ্যামার ৫০০ গ্রাম)", category: "টুলস", unit: "পিস", price: 280, costPrice: 180, stock: 15, lowStockThreshold: 3 },
  { name: "Measuring Tape (৫ মিটার)", category: "টুলস", unit: "পিস", price: 140, costPrice: 85, stock: 25, lowStockThreshold: 5 },
  { name: "Screw & Rawl Plug Set (১০০ পিস)", category: "ফিটিংস", unit: "প্যাকেট", price: 90, costPrice: 50, stock: 40, lowStockThreshold: 8 },
]

// 7. রেস্তোরাঁ ও ক্যাফে (Restaurant / Cafe)
const RESTAURANT_CATALOG: StarterCatalogItem[] = [
  { name: "স্পেশাল দুধ চা", category: "গরম পানীয়", unit: "কাপ", price: 15, costPrice: 7, stock: 200, lowStockThreshold: 30 },
  { name: "ব্ল্যাক কফি", category: "গরম পানীয়", unit: "কাপ", price: 30, costPrice: 12, stock: 100, lowStockThreshold: 20 },
  { name: "ডিম পরোটা", category: "নাস্তা", unit: "পিস", price: 35, costPrice: 18, stock: 80, lowStockThreshold: 15 },
  { name: "চিকেন রোল", category: "স্ন্যাকস", unit: "পিস", price: 50, costPrice: 28, stock: 40, lowStockThreshold: 10 },
  { name: "চিকেন সমুচা (৪ পিস)", category: "স্ন্যাকস", unit: "প্লেট", price: 40, costPrice: 22, stock: 50, lowStockThreshold: 10 },
  { name: "চিকেন বিরিয়ানি (হাফ)", category: "লাঞ্চ ও ডিনার", unit: "প্লেট", price: 160, costPrice: 95, stock: 35, lowStockThreshold: 8 },
  { name: "মিনারেল ওয়াটার (৫০০ মিলি)", category: "ঠান্ডা পানীয়", unit: "বোতল", price: 20, costPrice: 14, stock: 80, lowStockThreshold: 15 },
]

export const STARTER_CATALOG = MUDI_CATALOG

/**
 * Returns tailored starter product inventory based on the shop's chosen category
 */
export function getStarterCatalogForCategory(categoryId?: string): StarterCatalogItem[] {
  switch (categoryId) {
    case "pharmacy":
      return PHARMACY_CATALOG
    case "clothing":
    case "tailor":
      return CLOTHING_CATALOG
    case "electronics":
      return ELECTRONICS_CATALOG
    case "cosmetics":
      return COSMETICS_CATALOG
    case "hardware":
      return HARDWARE_CATALOG
    case "restaurant":
      return RESTAURANT_CATALOG
    case "supermarket":
      return [...MUDI_CATALOG, ...COSMETICS_CATALOG.slice(0, 4)]
    case "mudi":
    default:
      return MUDI_CATALOG
  }
}
