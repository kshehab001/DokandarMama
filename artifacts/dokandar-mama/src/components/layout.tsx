import { Link, useLocation } from "wouter"
import { useState } from "react"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Wallet,
  LogOut,
  Building2,
  Layers,
  Crown,
  Briefcase,
  User,
  ShieldAlert,
  WifiOff,
  RefreshCw,
  Globe,
  CreditCard,
  ChevronDown,
  Check,
  PlusCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { VoiceAssistant } from "./voice-assistant"
import { ChouFloatingWidget } from "./chou-floating-widget"
import { useClerk, useUser } from "@clerk/react"
import { useShopTheme } from "@/context/shop-theme-context"
import { useLanguage } from "@/context/language-context"
import { useOfflineSync } from "@/lib/offline-sync"
import { ShopShutter } from "./shop-shutter"
import { ShopkeeperOnboardingModal } from "./shopkeeper-onboarding-modal"
import { type UserRole } from "@/lib/theme-config"

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")

const ROLE_LABELS: Record<UserRole, { labelBn: string; labelEn: string; icon: any; color: string }> = {
  superadmin: { labelBn: "সুপার অ্যাডমিন", labelEn: "Super Admin", icon: ShieldAlert, color: "bg-red-500/10 text-red-600 border-red-500/20" },
  owner: { labelBn: "মালিক (Owner)", labelEn: "Owner", icon: Crown, color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  manager: { labelBn: "ম্যানেজার", labelEn: "Manager", icon: Briefcase, color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  shopkeeper: { labelBn: "দোকানদার (POS)", labelEn: "Shopkeeper", icon: User, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { signOut } = useClerk()
  const { user } = useUser()
  const [shopSwitcherOpen, setShopSwitcherOpen] = useState(false)

  const {
    category,
    role,
    isSuperAdmin,
    isOwner,
    isManager,
    isShopkeeper,
    activeShop,
    allShops,
    switchShop,
  } = useShopTheme()

  const { language, toggleLanguage, t } = useLanguage()
  const { isOnline, isSyncing, pendingCount, runSync } = useOfflineSync()

  // Dynamically compute navigation items based on User Role & Category
  const navItems = (() => {
    if (isSuperAdmin) {
      return [
        { href: "/admin", label: t("nav.dashboard", "প্ল্যাটফর্ম হোম"), icon: ShieldAlert },
        { href: "/app", label: t("nav.dashboard", "শপ হোম"), icon: Home },
        { href: "/app/reports", label: t("nav.reports", "অ্যানালিটিক্স"), icon: BarChart3 },
        { href: "/app/customers", label: t("nav.customers", "ব্যবহারকারী"), icon: Users },
        { href: "/app/inventory", label: t("nav.inventory", "ক্যাটাগরি"), icon: Layers },
      ]
    }

    if (isShopkeeper) {
      return [
        { href: "/app", label: t("nav.dashboard", "আজকের শিফট"), icon: Home },
        { href: "/app/billing", label: t("nav.billing", "দ্রুত বিক্রি"), icon: ShoppingCart },
        { href: "/app/inventory", label: language === "en" ? "Products" : category.terminology.productLabel, icon: Package },
        { href: "/app/customers", label: language === "en" ? "Customers & Due" : category.terminology.bakiLabel, icon: Users },
        { href: "/app/cashbox", label: t("nav.cashbox", "ক্যাশ ড্রয়ার"), icon: Wallet },
      ]
    }

    if (isManager) {
      return [
        { href: "/app", label: t("nav.dashboard", "হোম"), icon: Home },
        { href: "/app/billing", label: t("nav.billing", "বিলিং"), icon: ShoppingCart },
        { href: "/app/inventory", label: language === "en" ? "Inventory" : category.terminology.stockLabel, icon: Package },
        { href: "/app/customers", label: language === "en" ? "Customers & Due" : category.terminology.bakiLabel, icon: Users },
        { href: "/app/management", label: t("nav.management", "শপ ম্যানেজমেন্ট"), icon: Crown },
      ]
    }

    // Default: Owner
    return [
      { href: "/app", label: t("nav.dashboard", "বিজনেস হোম"), icon: Home },
      { href: "/app/billing", label: t("nav.billing", "বিক্রি / POS"), icon: ShoppingCart },
      { href: "/app/inventory", label: language === "en" ? "Inventory" : category.terminology.stockLabel, icon: Package },
      { href: "/app/customers", label: language === "en" ? "Customers & Due" : category.terminology.bakiLabel, icon: Users },
      { href: "/app/management", label: t("nav.management", "শপ ম্যানেজমেন্ট"), icon: Crown },
    ]
  })()

  const RoleInfo = ROLE_LABELS[role] || ROLE_LABELS.owner
  const RoleIcon = RoleInfo.icon

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Daily Shop Opening Shutter Animation */}
      <ShopShutter shopName={activeShop?.name || "দোকানদার মামা"} ownerName={user?.firstName ?? undefined} />

      {/* First-run onboarding tutorial for new shopkeepers */}
      <ShopkeeperOnboardingModal />

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-3.5 bg-card border-b border-card-border sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {/* Official Logo — always visible */}
          <img src="/logo.png" alt="দোকানদার মামা" className="h-7 w-auto object-contain" />

          {/* Read-Only Role Badge */}
          <div
            className={cn("text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1", RoleInfo.color)}
          >
            <RoleIcon className="w-3 h-3" />
            <span>{language === "en" ? RoleInfo.labelEn : RoleInfo.labelBn}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="h-8 px-2 rounded-xl border bg-muted/30 text-[11px] font-extrabold text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1"
            title="ভাষা পরিবর্তন (Language)"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{language === "bn" ? "বাং" : "EN"}</span>
          </button>

          <button
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="text-muted-foreground hover:text-destructive p-1.5"
            aria-label="লগ আউট"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Offline Status Warning Bar */}
      {(!isOnline || pendingCount > 0) && (
        <div className="bg-amber-500 text-zinc-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-sm sticky top-14 md:top-0 z-30">
          <div className="flex items-center gap-2">
            {!isOnline ? <WifiOff className="w-4 h-4 shrink-0" /> : <RefreshCw className={cn("w-4 h-4 shrink-0", isSyncing && "animate-spin")} />}
            <span>
              {!isOnline
                ? language === "en"
                  ? `Offline Mode — No internet. Sales saved locally (${pendingCount} pending)`
                  : `অফলাইন মোড — নেট নেই। বিক্রয় ও হিসাব ফোনে সেভ হচ্ছে (${pendingCount} টি অপেক্ষমাণ)`
                : language === "en"
                  ? `${pendingCount} offline records syncing to server...`
                  : `${pendingCount} টি অফলাইন ডাটা সার্ভারে সিঙ্ক হচ্ছে...`}
            </span>
          </div>
          {isOnline && pendingCount > 0 && (
            <button
              onClick={runSync}
              disabled={isSyncing}
              className="bg-zinc-950 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold"
            >
              {isSyncing ? (language === "en" ? "Syncing..." : "সিঙ্ক হচ্ছে...") : (language === "en" ? "Sync Now" : "এখনই সিঙ্ক করুন")}
            </button>
          )}
        </div>
      )}

      {/* Sidebar for Desktop */}
      <aside className={cn(
        "hidden md:flex flex-col w-64 border-r border-border sticky top-0 h-[100dvh]",
        isSuperAdmin
          ? "bg-slate-900 border-slate-700 text-white"
          : "bg-card"
      )}>
        <div className="p-5 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="দোকানদার মামা"
                className="h-9 w-auto object-contain"
              />
            </div>
          </div>

          {/* Active shop — switcher when owner has >1 shop */}
          <div className="space-y-2">
            <div className="relative">
              <button
                onClick={() => isOwner && allShops.length > 1 ? setShopSwitcherOpen(o => !o) : undefined}
                className={cn(
                  "w-full flex items-center gap-2 p-2.5 rounded-xl border bg-muted/30 text-left",
                  isOwner && allShops.length > 1 ? "hover:bg-muted/60 cursor-pointer transition-colors" : "cursor-default"
                )}
              >
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs font-bold text-foreground truncate">
                  {activeShop?.name || (user?.unsafeMetadata as any)?.shopName || "আপনার দোকান"}
                </div>
                {isOwner && allShops.length > 1 && (
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform", shopSwitcherOpen && "rotate-180")} />
                )}
              </button>

              {/* Shop dropdown */}
              {shopSwitcherOpen && isOwner && allShops.length > 1 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card border rounded-xl shadow-lg z-50 overflow-hidden">
                  {allShops.map((shop) => (
                    <button
                      key={shop.id}
                      onClick={() => { switchShop(shop.id); setShopSwitcherOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-muted/60 transition-colors text-left"
                    >
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{shop.name}</span>
                      {shop.id === activeShop?.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  ))}
                  <Link
                    href="/app/management?tab=shop"
                    onClick={() => setShopSwitcherOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors border-t"
                  >
                    <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{language === "en" ? "Add New Shop" : "নতুন দোকান যোগ করুন"}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Read-Only Role Badge */}
            <div
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-semibold",
                RoleInfo.color,
              )}
            >
              <div className="flex items-center gap-1.5">
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{language === "en" ? RoleInfo.labelEn : RoleInfo.labelBn}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm font-bold"
                    : isSuperAdmin
                      ? "text-slate-300 hover:text-white hover:bg-slate-800"
                      : "text-foreground hover:bg-muted/70",
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Profile / Signout */}
        <div className="p-3 border-t space-y-2">
          <button
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {language === "en" ? "Log Out" : "লগ আউট"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 relative overflow-y-auto min-h-screen">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">{children}</div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around p-1.5 z-20 pb-safe shadow-lg">
        {navItems.map((item) => {
          const isActive = location === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-1 px-2 rounded-xl min-w-[3.5rem] transition-colors",
                isActive ? "text-primary font-bold" : "text-muted-foreground",
              )}
            >
              <item.icon className={cn("w-5 h-5 mb-0.5", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] leading-tight truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Single Persistent Chotu Genie Assistant mounted ONCE at app root */}
      <ChouFloatingWidget language={language} />
      <VoiceAssistant />

    </div>
  )
}
