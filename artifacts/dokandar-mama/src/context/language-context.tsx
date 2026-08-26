import React, { createContext, useContext, useState, useEffect } from "react"

export type Language = "bn" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (key: string, defaultText?: string) => string
}

const DICTIONARY: Record<Language, Record<string, string>> = {
  bn: {
    // Navigation
    "nav.dashboard": "ড্যাশবোর্ড",
    "nav.billing": "বিলিং",
    "nav.inventory": "ইনভেন্টরি",
    "nav.customers": "কাস্টমার ও বাকি",
    "nav.cashbox": "ক্যাশ বক্স",
    "nav.reports": "রিপোর্ট",
    "nav.settings": "সেটিংস",
    "nav.assistant": "ছোটু মামা",

    // Dashboard Cards
    "dash.todaySales": "আজকের বিক্রি",
    "dash.cashbox": "ক্যাশ বক্স",
    "dash.totalDue": "মোট বকেয়া (বাকি)",
    "dash.lowStock": "কম স্টক",
    "dash.quickActions": "জরুরি বাটন",
    "dash.sellNow": "বিক্রি করুন",
    "dash.addProduct": "পণ্য যোগ",
    "dash.takePayment": "জমা নিন",
    "dash.closeDay": "দিন শেষ করুন",

    // Billing
    "billing.title": "দ্রুত ক্যাশমেমো ও বিক্রি",
    "billing.searchPlaceholder": "পণ্য খুঁজুন বা বারকোড স্ক্যান করুন...",
    "billing.cartEmpty": "কার্টে কোনো পণ্য যোগ করা হয়নি",
    "billing.total": "মোট বিল",
    "billing.discount": "ছাড়",
    "billing.payable": "প্রদেয় টাকা",
    "billing.cashPayment": "ক্যাশ / নগদ",
    "billing.digitalPayment": "ডিজিটাল (বিকাশ/নগদ)",
    "billing.bakiPayment": "বাকি / ধারে",
    "billing.customerGave": "কাস্টমার দিয়েছেন",
    "billing.changeDue": "কাস্টমারকে ফেরত দিন",
    "billing.completeSale": "বিক্রি সম্পন্ন করুন",

    // General & Network
    "status.online": "অনলাইন",
    "status.offline": "অফলাইন মোড",
    "status.syncing": "সিঙ্ক হচ্ছে...",
    "btn.save": "সংরক্ষণ",
    "btn.cancel": "বাতিল",
    "btn.confirm": "কনফার্ম",
  },
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.billing": "Billing",
    "nav.inventory": "Inventory",
    "nav.customers": "Customers & Due",
    "nav.cashbox": "Cash Box",
    "nav.reports": "Reports",
    "nav.settings": "Settings",
    "nav.assistant": "Chotu Assistant",

    // Dashboard Cards
    "dash.todaySales": "Today's Sales",
    "dash.cashbox": "Cash Box",
    "dash.totalDue": "Total Due (Baki)",
    "dash.lowStock": "Low Stock",
    "dash.quickActions": "Quick Actions",
    "dash.sellNow": "New Sale",
    "dash.addProduct": "Add Product",
    "dash.takePayment": "Record Payment",
    "dash.closeDay": "Close Day",

    // Billing
    "billing.title": "Fast POS & Billing",
    "billing.searchPlaceholder": "Search product or scan barcode...",
    "billing.cartEmpty": "No items added to cart",
    "billing.total": "Total",
    "billing.discount": "Discount",
    "billing.payable": "Payable Amount",
    "billing.cashPayment": "Cash",
    "billing.digitalPayment": "Digital (bKash/Nagad)",
    "billing.bakiPayment": "Due / Baki",
    "billing.customerGave": "Customer Paid",
    "billing.changeDue": "Return / Change Due",
    "billing.completeSale": "Complete Sale",

    // General & Network
    "status.online": "Online",
    "status.offline": "Offline Mode",
    "status.syncing": "Syncing...",
    "btn.save": "Save",
    "btn.cancel": "Cancel",
    "btn.confirm": "Confirm",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("dokandar_language") as Language) || "bn"
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("dokandar_language", lang)
  }

  const toggleLanguage = () => {
    const next = language === "bn" ? "en" : "bn"
    setLanguage(next)
  }

  const t = (key: string, defaultText?: string): string => {
    return DICTIONARY[language]?.[key] || defaultText || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    return {
      language: "bn" as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string, def?: string) => def || key,
    }
  }
  return context
}
