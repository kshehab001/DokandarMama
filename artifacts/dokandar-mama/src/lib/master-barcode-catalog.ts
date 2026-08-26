/**
 * Master Global Retail Product & Barcode Catalog for Bangladesh
 * 
 * Provides offline instant recognition for standard retail items,
 * and falls back to backend `/api/master-products/lookup`.
 */

export interface MasterCatalogProduct {
  barcode: string
  name: string
  nameBn: string
  brand: string
  category: string
  unit: string
  defaultPrice: number
  costPrice: number
}

export const BANGLADESH_MASTER_CATALOG: MasterCatalogProduct[] = [
  // Soap & Personal Care
  { barcode: "8941100520015", name: "Lux Velvet Touch Soap 100g", nameBn: "লাক্স সাবান (১০০ গ্রাম)", brand: "Unilever", category: "প্রসাধন ও টয়লেট্রিজ", unit: "পিস", defaultPrice: 60, costPrice: 52 },
  { barcode: "8941100520022", name: "Lifebuoy Total Soap 100g", nameBn: "লাইফবয় সাবান (১০০ গ্রাম)", brand: "Unilever", category: "প্রসাধন ও টয়লেট্রিজ", unit: "পিস", defaultPrice: 55, costPrice: 48 },
  { barcode: "8941100520039", name: "Dettol Original Soap 75g", nameBn: "ডেটোল সাবান (৭৫ গ্রাম)", brand: "Reckitt", category: "প্রসাধন ও টয়লেট্রিজ", unit: "পিস", defaultPrice: 58, costPrice: 50 },
  { barcode: "8941100520046", name: "Sunsilk Black Shine Shampoo 180ml", nameBn: "সানসিল্ক শ্যাম্পু (১৮০ মিলি)", brand: "Unilever", category: "হেয়ার কেয়ার", unit: "বোতল", defaultPrice: 240, costPrice: 205 },
  { barcode: "8941100520053", name: "Parachute Coconut Oil 200ml", nameBn: "প্যারাসুট নারিকেল তেল (২০০ মিলি)", brand: "Marico", category: "হেয়ার কেয়ার", unit: "বোতল", defaultPrice: 175, costPrice: 148 },
  { barcode: "8941100520060", name: "Closeup Deep Action Toothpaste 100g", nameBn: "ক্লোজআপ টুথপেস্ট (১০০ গ্রাম)", brand: "Unilever", category: "প্রসাধন ও টয়লেট্রিজ", unit: "পিস", defaultPrice: 95, costPrice: 82 },
  { barcode: "8941100520077", name: "Wheel Washing Powder 500g", nameBn: "হুইল পাউডার (৫০০ গ্রাম)", brand: "Unilever", category: "পরিচ্ছন্নতা সামগ্রী", unit: "প্যাকেট", defaultPrice: 65, costPrice: 57 },
  { barcode: "8941100520084", name: "Rin Advanced Detergent 500g", nameBn: "রিন পাউডার (৫০০ গ্রাম)", brand: "Unilever", category: "পরিচ্ছন্নতা সামগ্রী", unit: "প্যাকেট", defaultPrice: 85, costPrice: 74 },
  
  // Grocery & Staples
  { barcode: "8941100520107", name: "Radhuni Turmeric Powder 100g", nameBn: "রাঁধুনী হলুদ গুঁড়া (১০০ গ্রাম)", brand: "Square", category: "মসলা", unit: "প্যাকেট", defaultPrice: 45, costPrice: 38 },
  { barcode: "8941100520114", name: "Radhuni Chilli Powder 100g", nameBn: "রাঁধুনী মরিচ গুঁড়া (১০০ গ্রাম)", brand: "Square", category: "মসলা", unit: "প্যাকেট", defaultPrice: 55, costPrice: 47 },
  { barcode: "8941100520121", name: "Teer Fortified Soybean Oil 1L", nameBn: "তীর সয়াবিন তেল (১ লিটার)", brand: "City Group", category: "তেল ও ঘি", unit: "লিটার", defaultPrice: 189, costPrice: 178 },
  { barcode: "8941100520138", name: "Rupchanda Soybean Oil 1L", nameBn: "রূপচাঁদা সয়াবিন তেল (১ লিটার)", brand: "BEOL", category: "তেল ও ঘি", unit: "লিটার", defaultPrice: 189, costPrice: 178 },
  { barcode: "8941100520145", name: "Aci Pure Salt 1kg", nameBn: "এসিআই পিওর লবণ (১ কেজি)", brand: "ACI", category: "মসলা", unit: "কেজি", defaultPrice: 40, costPrice: 35 },
  { barcode: "8941100520152", name: "Dano Daily Pushti Milk Powder 500g", nameBn: "ডানো পুষ্টি গুঁড়া দুধ (৫০০ গ্রাম)", brand: "Arla", category: "দুগ্ধজাত পণ্য", unit: "প্যাকেট", defaultPrice: 430, costPrice: 395 },

  // Snacks & Beverages
  { barcode: "8941100520206", name: "Olympic Energy Plus Biscuit", nameBn: "অলিম্পিক এনার্জি প্লাস বিস্কুট", brand: "Olympic", category: "নাস্তা", unit: "প্যাকেট", defaultPrice: 35, costPrice: 30 },
  { barcode: "8941100520213", name: "Pran Chanachur Special 150g", nameBn: "প্রাণ চানাচুর (১৫০ গ্রাম)", brand: "PRAN", category: "নাস্তা", unit: "প্যাকেট", defaultPrice: 30, costPrice: 25 },
  { barcode: "8941100520220", name: "Ispahani Mirzapore Tea Bag 50pcs", nameBn: "ইস্পাহানি মির্জাপুর টি ব্যাগ (৫০টি)", brand: "Ispahani", category: "গরম পানীয়", unit: "বক্স", defaultPrice: 120, costPrice: 105 },
  { barcode: "8941100520237", name: "Mojo Cola 250ml", nameBn: "মোজো কোলা (২৫০ মিলি)", brand: "Akij", category: "ঠান্ডা পানীয়", unit: "বোতল", defaultPrice: 20, costPrice: 16 },
  { barcode: "8941100520244", name: "Mum Mineral Water 500ml", nameBn: "মাম মিনারেল ওয়াটার (৫০০ মিলি)", brand: "Partex", category: "ঠান্ডা পানীয়", unit: "বোতল", defaultPrice: 20, costPrice: 14 },

  // Pharmacy Essentials
  { barcode: "8941100520305", name: "Napa Extra Tablet (Paracetamol 500mg + Caffeine 65mg)", nameBn: "নাপা এক্সট্রা ট্যাবলেট", brand: "Beximco", category: "পেইন কিলার", unit: "পাতা", defaultPrice: 30, costPrice: 24 },
  { barcode: "8941100520312", name: "Seclo 20mg Capsule (Omeprazole)", nameBn: "সেকলো ২০ মিগ্রা ক্যাপসুল", brand: "Square", category: "গ্যাস্ট্রিক", unit: "পাতা", defaultPrice: 60, costPrice: 48 },
  { barcode: "8941100520329", name: "SMC ORSaline-N Packet", nameBn: "এসএমসি খাবার স্যালাইন-এন", brand: "SMC", category: "স্যালাইন", unit: "প্যাকেট", defaultPrice: 6, costPrice: 4.5 },
  { barcode: "8941100520336", name: "Savlon Liquid Antiseptic 100ml", nameBn: "স্যাভলন লিকুইড ১০০ মিলি", brand: "ACI", category: "ফার্স্ট এইড", unit: "বোতল", defaultPrice: 55, costPrice: 45 },
]

/**
 * Searches offline master barcode list or queries remote master catalog
 */
export async function lookupMasterBarcode(barcode: string): Promise<MasterCatalogProduct | null> {
  const clean = barcode.trim()
  if (!clean) return null

  // 1. Check local catalog
  const found = BANGLADESH_MASTER_CATALOG.find((p) => p.barcode === clean)
  if (found) return found

  // 2. Try fetching from backend /api/master-products/lookup
  try {
    const res = await fetch(`/api/master-products/lookup?barcode=${encodeURIComponent(clean)}`)
    if (res.ok) {
      const data = await res.json()
      if (data && data.name) {
        return {
          barcode: data.barcode,
          name: data.name,
          nameBn: data.nameBn || data.name,
          brand: data.brand || "",
          category: data.category || "সাধারণ",
          unit: data.unit || "পিস",
          defaultPrice: data.defaultPrice || 0,
          costPrice: Math.round((data.defaultPrice || 0) * 0.85),
        }
      }
    }
  } catch (err) {
    console.warn("Backend master barcode lookup offline:", err)
  }

  return null
}
