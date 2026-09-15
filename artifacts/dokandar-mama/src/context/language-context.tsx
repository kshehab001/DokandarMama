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
    "nav.dashboard": "হোম",
    "nav.billing": "বিলিং",
    "nav.inventory": "ইনভেন্টরি",
    "nav.customers": "কাস্টমার ও বাকি",
    "nav.cashbox": "ক্যাশ বক্স",
    "nav.reports": "রিপোর্ট",
    "nav.management": "শপ ম্যানেজমেন্ট",
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

    // Management Hub
    "mgnt.title": "দোকান ও ব্যবসা ব্যবস্থাপনা",
    "mgnt.subtitle": "দোকান সেটিংস, টিম, বেচাকেনার রিপোর্ট ও সাবস্ক্রিপশন নিয়ন্ত্রণ করুন",
    "mgnt.tab.overview": "দোকান ওভারভিউ",
    "mgnt.tab.shops": "শাখা ও নতুন দোকান",
    "mgnt.tab.team": "টিম ও রোল",
    "mgnt.tab.reports": "রিপোর্ট ও অ্যানালিটিক্স",
    "mgnt.tab.subscription": "সাবস্ক্রিপশন ও ফিচার",
    "mgnt.addShop": "+ নতুন দোকান তৈরি করুন",
    "mgnt.switchShop": "দোকান পরিবর্তন করুন",
    "mgnt.inviteStaff": "কর্মী বা ম্যানেজার যুক্ত করুন",
    "mgnt.staffRole": "রোল বা ক্ষমতা",
    "mgnt.owner": "মালিক (Owner)",
    "mgnt.manager": "ম্যানেজার (Manager)",
    "mgnt.shopkeeper": "বিক্রেতা / ক্যাশিয়ার (Shopkeeper)",

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

    // Reports
    "reports.title": "রিপোর্ট ও বিশ্লেষণ",
    "reports.subtitle": "দোকানের বেচাকেনা ও আর্থিক খতিয়ান",
    "reports.export": "রিপোর্ট ডাউনলোড (CSV)",
    "reports.print": "প্রিন্ট",
    "reports.today": "আজকে",
    "reports.week": "এই সপ্তাহ",
    "reports.month": "এই মাস",

    // General & Network
    "status.online": "অনলাইন",
    "status.offline": "অফলাইন মোড",
    "status.syncing": "সিঙ্ক হচ্ছে...",
    "btn.save": "সংরক্ষণ",
    "btn.cancel": "বাতিল",
    "btn.confirm": "কনফার্ম",
    "btn.add": "যোগ করুন",
    "btn.delete": "মুছুন",
    "btn.edit": "সম্পাদনা",
    "btn.export": "ডাউনলোড",
  },
  en: {
    // Navigation
    "nav.dashboard": "Home",
    "nav.billing": "Billing",
    "nav.inventory": "Inventory",
    "nav.customers": "Customers & Due",
    "nav.cashbox": "Cash Box",
    "nav.reports": "Reports",
    "nav.management": "Shop Management",
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

    // Management Hub
    "mgnt.title": "Shop & Business Hub",
    "mgnt.subtitle": "Manage shop profile, team members, financial reports & subscription plans",
    "mgnt.tab.overview": "Shop Overview",
    "mgnt.tab.shops": "Shops & Branches",
    "mgnt.tab.team": "Team & Roles",
    "mgnt.tab.reports": "Reports & Analytics",
    "mgnt.tab.subscription": "Subscription & Features",
    "mgnt.addShop": "+ Add New Shop",
    "mgnt.switchShop": "Switch Active Shop",
    "mgnt.inviteStaff": "Invite Staff / Manager",
    "mgnt.staffRole": "Role / Access Level",
    "mgnt.owner": "Owner",
    "mgnt.manager": "Manager",
    "mgnt.shopkeeper": "Shopkeeper / Cashier",

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

    // Reports
    "reports.title": "Reports & Analytics",
    "reports.subtitle": "Business performance and financial insights",
    "reports.export": "Export CSV",
    "reports.print": "Print",
    "reports.today": "Today",
    "reports.week": "This Week",
    "reports.month": "This Month",

    // General & Network
    "status.online": "Online",
    "status.offline": "Offline Mode",
    "status.syncing": "Syncing...",
    "btn.save": "Save",
    "btn.cancel": "Cancel",
    "btn.confirm": "Confirm",
    "btn.add": "Add",
    "btn.delete": "Delete",
    "btn.edit": "Edit",
    "btn.export": "Export",
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
