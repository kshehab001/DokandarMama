// A realistic starter catalog of products a typical Bangladeshi small/micro
// retail shop (mudi dokan) stocks, grouped by category. Used by the
// "স্টার্টার ক্যাটালগ আমদানি করুন" (Import starter catalog) button on the
// Inventory page so a brand-new shopkeeper isn't starting from a blank list.
//
// Prices are indicative average retail prices in BDT (subject to change) —
// shopkeepers are expected to adjust them to their actual supplier costs
// after import via the normal edit-product flow.

export type StarterCatalogItem = {
  name: string
  category: string
  unit: string
  price: number
  costPrice: number
  stock: number
  lowStockThreshold: number
}

export const STARTER_CATALOG: StarterCatalogItem[] = [
  // চাল, ডাল ও প্রধান খাদ্যশস্য (Rice, lentils & staples)
  { name: "মিনিকেট চাল", category: "চাল ও ডাল", unit: "কেজি", price: 78, costPrice: 72, stock: 100, lowStockThreshold: 15 },
  { name: "নাজিরশাইল চাল", category: "চাল ও ডাল", unit: "কেজি", price: 68, costPrice: 62, stock: 100, lowStockThreshold: 15 },
  { name: "মোটা চাল (স্বর্ণা)", category: "চাল ও ডাল", unit: "কেজি", price: 54, costPrice: 49, stock: 80, lowStockThreshold: 15 },
  { name: "মসুর ডাল (দেশি)", category: "চাল ও ডাল", unit: "কেজি", price: 135, costPrice: 122, stock: 40, lowStockThreshold: 8 },
  { name: "মুগ ডাল", category: "চাল ও ডাল", unit: "কেজি", price: 145, costPrice: 130, stock: 25, lowStockThreshold: 5 },
  { name: "ছোলার ডাল", category: "চাল ও ডাল", unit: "কেজি", price: 115, costPrice: 104, stock: 30, lowStockThreshold: 5 },
  { name: "আটা (প্যাকেট)", category: "চাল ও ডাল", unit: "কেজি", price: 62, costPrice: 56, stock: 50, lowStockThreshold: 10 },
  { name: "ময়দা", category: "চাল ও ডাল", unit: "কেজি", price: 65, costPrice: 58, stock: 40, lowStockThreshold: 10 },
  { name: "সুজি", category: "চাল ও ডাল", unit: "কেজি", price: 75, costPrice: 68, stock: 20, lowStockThreshold: 5 },

  // তেল ও ঘি (Oil & ghee)
  { name: "সয়াবিন তেল (বোতল)", category: "তেল ও ঘি", unit: "লিটার", price: 189, costPrice: 178, stock: 50, lowStockThreshold: 10 },
  { name: "সয়াবিন তেল (পাঁচ লিটার)", category: "তেল ও ঘি", unit: "পিস", price: 890, costPrice: 850, stock: 15, lowStockThreshold: 3 },
  { name: "সরিষার তেল", category: "তেল ও ঘি", unit: "লিটার", price: 220, costPrice: 205, stock: 20, lowStockThreshold: 5 },
  { name: "ঘি (গুঁড়া দুধ কোম্পানি)", category: "তেল ও ঘি", unit: "কেজি", price: 850, costPrice: 800, stock: 8, lowStockThreshold: 2 },

  // মসলা (Spices)
  { name: "হলুদ গুঁড়া", category: "মসলা", unit: "কেজি", price: 320, costPrice: 290, stock: 15, lowStockThreshold: 3 },
  { name: "মরিচ গুঁড়া", category: "মসলা", unit: "কেজি", price: 380, costPrice: 345, stock: 15, lowStockThreshold: 3 },
  { name: "জিরা গুঁড়া", category: "মসলা", unit: "কেজি", price: 620, costPrice: 570, stock: 8, lowStockThreshold: 2 },
  { name: "ধনিয়া গুঁড়া", category: "মসলা", unit: "কেজি", price: 280, costPrice: 255, stock: 10, lowStockThreshold: 2 },
  { name: "গরম মসলা", category: "মসলা", unit: "কেজি", price: 950, costPrice: 880, stock: 5, lowStockThreshold: 1 },
  { name: "লবণ (আয়োডিনযুক্ত)", category: "মসলা", unit: "কেজি", price: 40, costPrice: 35, stock: 60, lowStockThreshold: 10 },
  { name: "চিনি", category: "মসলা", unit: "কেজি", price: 132, costPrice: 122, stock: 60, lowStockThreshold: 15 },
  { name: "রসুন", category: "মসলা", unit: "কেজি", price: 180, costPrice: 155, stock: 15, lowStockThreshold: 3 },
  { name: "পেঁয়াজ", category: "মসলা", unit: "কেজি", price: 75, costPrice: 62, stock: 40, lowStockThreshold: 8 },
  { name: "আদা", category: "মসলা", unit: "কেজি", price: 220, costPrice: 190, stock: 12, lowStockThreshold: 3 },

  // দুধ ও দুগ্ধজাত পণ্য (Dairy)
  { name: "গুঁড়া দুধ (ডানো)", category: "দুগ্ধজাত পণ্য", unit: "কেজি", price: 780, costPrice: 730, stock: 15, lowStockThreshold: 3 },
  { name: "তরল দুধ (প্যাকেট)", category: "দুগ্ধজাত পণ্য", unit: "পিস", price: 90, costPrice: 82, stock: 25, lowStockThreshold: 5 },
  { name: "কনডেন্সড মিল্ক", category: "দুগ্ধজাত পণ্য", unit: "পিস", price: 145, costPrice: 132, stock: 20, lowStockThreshold: 4 },
  { name: "মাখন", category: "দুগ্ধজাত পণ্য", unit: "পিস", price: 95, costPrice: 85, stock: 10, lowStockThreshold: 2 },

  // বিস্কুট, চানাচুর ও নাস্তা (Snacks & biscuits)
  { name: "লাচ্ছি সেমাই", category: "নাস্তা", unit: "প্যাকেট", price: 60, costPrice: 52, stock: 20, lowStockThreshold: 4 },
  { name: "টোস্ট বিস্কুট", category: "নাস্তা", unit: "প্যাকেট", price: 40, costPrice: 34, stock: 40, lowStockThreshold: 8 },
  { name: "গ্লুকোজ বিস্কুট", category: "নাস্তা", unit: "প্যাকেট", price: 15, costPrice: 12, stock: 60, lowStockThreshold: 12 },
  { name: "চানাচুর", category: "নাস্তা", unit: "প্যাকেট", price: 20, costPrice: 16, stock: 50, lowStockThreshold: 10 },
  { name: "চিপস (লেইজ)", category: "নাস্তা", unit: "প্যাকেট", price: 20, costPrice: 17, stock: 40, lowStockThreshold: 8 },
  { name: "নুডলস (ম্যাগি)", category: "নাস্তা", unit: "প্যাকেট", price: 20, costPrice: 17, stock: 60, lowStockThreshold: 12 },
  { name: "চকলেট (ড্যারি মিল্ক)", category: "নাস্তা", unit: "পিস", price: 60, costPrice: 52, stock: 30, lowStockThreshold: 6 },
  { name: "চুইংগাম", category: "নাস্তা", unit: "পিস", price: 5, costPrice: 3, stock: 100, lowStockThreshold: 20 },

  // পানীয় (Beverages)
  { name: "কোকা-কোলা (বোতল)", category: "পানীয়", unit: "পিস", price: 40, costPrice: 34, stock: 40, lowStockThreshold: 8 },
  { name: "মিনারেল ওয়াটার (বোতল)", category: "পানীয়", unit: "পিস", price: 20, costPrice: 16, stock: 60, lowStockThreshold: 12 },
  { name: "চা পাতা", category: "পানীয়", unit: "কেজি", price: 420, costPrice: 385, stock: 15, lowStockThreshold: 3 },
  { name: "কফি (ইনস্ট্যান্ট)", category: "পানীয়", unit: "পিস", price: 130, costPrice: 115, stock: 10, lowStockThreshold: 2 },
  { name: "হরলিক্স", category: "পানীয়", unit: "পিস", price: 480, costPrice: 445, stock: 8, lowStockThreshold: 2 },
  { name: "লেবু (এনার্জি ড্রিংক)", category: "পানীয়", unit: "পিস", price: 25, costPrice: 20, stock: 30, lowStockThreshold: 6 },

  // ব্যক্তিগত পরিচর্যা (Personal care)
  { name: "সাবান (লাক্স)", category: "ব্যক্তিগত পরিচর্যা", unit: "পিস", price: 45, costPrice: 39, stock: 40, lowStockThreshold: 8 },
  { name: "শ্যাম্পু (স্যাশে)", category: "ব্যক্তিগত পরিচর্যা", unit: "পিস", price: 10, costPrice: 8, stock: 100, lowStockThreshold: 20 },
  { name: "টুথপেস্ট", category: "ব্যক্তিগত পরিচর্যা", unit: "পিস", price: 75, costPrice: 65, stock: 30, lowStockThreshold: 6 },
  { name: "টুথব্রাশ", category: "ব্যক্তিগত পরিচর্যা", unit: "পিস", price: 25, costPrice: 20, stock: 40, lowStockThreshold: 8 },
  { name: "নারিকেল তেল (চুলের)", category: "ব্যক্তিগত পরিচর্যা", unit: "পিস", price: 90, costPrice: 78, stock: 20, lowStockThreshold: 4 },
  { name: "পাউডার (ট্যালকম)", category: "ব্যক্তিগত পরিচর্যা", unit: "পিস", price: 110, costPrice: 96, stock: 15, lowStockThreshold: 3 },
  { name: "রেজার (ডিসপোজেবল)", category: "ব্যক্তিগত পরিচর্যা", unit: "পিস", price: 20, costPrice: 15, stock: 30, lowStockThreshold: 6 },
  { name: "স্যানিটারি ন্যাপকিন", category: "ব্যক্তিগত পরিচর্যা", unit: "প্যাকেট", price: 65, costPrice: 55, stock: 20, lowStockThreshold: 4 },

  // গৃহস্থালি ও পরিষ্কারক (Household & cleaning)
  { name: "ডিটারজেন্ট পাউডার", category: "গৃহস্থালি", unit: "কেজি", price: 160, costPrice: 142, stock: 25, lowStockThreshold: 5 },
  { name: "ডিশ ওয়াশিং বার", category: "গৃহস্থালি", unit: "পিস", price: 25, costPrice: 20, stock: 30, lowStockThreshold: 6 },
  { name: "ব্লিচিং পাউডার", category: "গৃহস্থালি", unit: "পিস", price: 45, costPrice: 38, stock: 15, lowStockThreshold: 3 },
  { name: "মোমবাতি", category: "গৃহস্থালি", unit: "পিস", price: 10, costPrice: 7, stock: 60, lowStockThreshold: 12 },
  { name: "দেশলাই", category: "গৃহস্থালি", unit: "পিস", price: 2, costPrice: 1, stock: 200, lowStockThreshold: 40 },
  { name: "মশার কয়েল", category: "গৃহস্থালি", unit: "পিস", price: 45, costPrice: 38, stock: 25, lowStockThreshold: 5 },
  { name: "এলুমিনিয়াম ফয়েল", category: "গৃহস্থালি", unit: "পিস", price: 90, costPrice: 78, stock: 10, lowStockThreshold: 2 },
  { name: "পলিথিন ব্যাগ (প্যাকেট)", category: "গৃহস্থালি", unit: "প্যাকেট", price: 60, costPrice: 50, stock: 20, lowStockThreshold: 4 },

  // ডিম, শুকনা খাবার (Eggs & dry goods)
  { name: "ডিম (ফার্মের)", category: "ডিম ও শুকনা খাবার", unit: "পিস", price: 12, costPrice: 10, stock: 200, lowStockThreshold: 40 },
  { name: "আলু", category: "ডিম ও শুকনা খাবার", unit: "কেজি", price: 30, costPrice: 24, stock: 60, lowStockThreshold: 10 },
  { name: "শুকনা মরিচ", category: "ডিম ও শুকনা খাবার", unit: "কেজি", price: 340, costPrice: 305, stock: 8, lowStockThreshold: 2 },

  // স্টেশনারি (Stationery)
  { name: "খাতা (৮০ পৃষ্ঠা)", category: "স্টেশনারি", unit: "পিস", price: 35, costPrice: 28, stock: 30, lowStockThreshold: 6 },
  { name: "কলম (বল পয়েন্ট)", category: "স্টেশনারি", unit: "পিস", price: 8, costPrice: 5, stock: 100, lowStockThreshold: 20 },
  { name: "পেন্সিল", category: "স্টেশনারি", unit: "পিস", price: 5, costPrice: 3, stock: 100, lowStockThreshold: 20 },

  // মোবাইল রিচার্জ ও অন্যান্য (Mobile/misc)
  { name: "মোবাইল ব্যাটারি চার্জার", category: "অন্যান্য", unit: "পিস", price: 250, costPrice: 210, stock: 5, lowStockThreshold: 1 },
  { name: "ইয়ারফোন", category: "অন্যান্য", unit: "পিস", price: 150, costPrice: 120, stock: 10, lowStockThreshold: 2 },
]
