import { useState } from "react"
import { Link, useLocation } from "wouter"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Wallet,
  LogOut,
  Building2,
  ChevronDown,
  Layers,
  Crown,
  Briefcase,
  User,
  ShieldAlert,
  Sparkles,
  Check,
  WifiOff,
  RefreshCw,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { VoiceAssistant } from "./voice-assistant"
import { useClerk, useUser } from "@clerk/react"
import { useShopTheme } from "@/context/shop-theme-context"
import { useLanguage } from "@/context/language-context"
import { useOfflineSync } from "@/lib/offline-sync"
import { ShopShutter } from "./shop-shutter"
import { CATEGORY_LIST, type ShopCategoryId, type UserRole } from "@/lib/theme-config"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")

const ROLE_LABELS: Record<UserRole, { labelBn: string; icon: any; color: string }> = {
  superadmin: { labelBn: "সুপার অ্যাডমিন", icon: ShieldAlert, color: "bg-red-500/10 text-red-600 border-red-500/20" },
  owner: { labelBn: "মালিক (Owner)", icon: Crown, color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  manager: { labelBn: "ম্যানেজার", icon: Briefcase, color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  shopkeeper: { labelBn: "দোকানদার (POS)", icon: User, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { signOut } = useClerk()
  const { user } = useUser()

  const {
    category,
    categoryId,
    role,
    isSuperAdmin,
    isOwner,
    isManager,
    isShopkeeper,
    setRoleOverride,
    changeShopCategory,
    activeShop,
    allShops,
    switchShop,
  } = useShopTheme()

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)

  const { language, toggleLanguage, t } = useLanguage()
  const { isOnline, isSyncing, pendingCount, runSync } = useOfflineSync()

  // Dynamically compute navigation items based on User Role & Category
  const navItems = (() => {
    if (isSuperAdmin) {
      return [
        { href: "/admin", label: t("nav.dashboard", "প্ল্যাটফর্ম হোম"), icon: ShieldAlert },
        { href: "/app", label: t("nav.dashboard", "শপ ড্যাশবোর্ড"), icon: Home },
        { href: "/app/reports", label: t("nav.reports", "অ্যানালিটিক্স"), icon: BarChart3 },
        { href: "/app/customers", label: t("nav.customers", "ব্যবহারকারী"), icon: Users },
        { href: "/app/inventory", label: t("nav.inventory", "ক্যাটাগরি"), icon: Layers },
      ]
    }

    if (isShopkeeper) {
      return [
        { href: "/app", label: t("nav.dashboard", "আজকের শিফট"), icon: Home },
        { href: "/app/billing", label: t("nav.billing", "দ্রুত বিক্রি"), icon: ShoppingCart },
        { href: "/app/inventory", label: category.terminology.productLabel, icon: Package },
        { href: "/app/customers", label: category.terminology.bakiLabel, icon: Users },
        { href: "/app/cashbox", label: t("nav.cashbox", "ক্যাশ ড্রয়ার"), icon: Wallet },
      ]
    }

    if (isManager) {
      return [
        { href: "/app", label: t("nav.dashboard", "ড্যাশবোর্ড"), icon: Home },
        { href: "/app/billing", label: t("nav.billing", "বিলিং"), icon: ShoppingCart },
        { href: "/app/inventory", label: category.terminology.stockLabel, icon: Package },
        { href: "/app/customers", label: category.terminology.bakiLabel, icon: Users },
        { href: "/app/cashbox", label: t("nav.cashbox", "ক্যাশ বক্স"), icon: Wallet },
        { href: "/app/reports", label: t("nav.reports", "রিপোর্ট"), icon: BarChart3 },
      ]
    }

    // Default: Owner
    return [
      { href: "/app", label: t("nav.dashboard", "বিজনেস হোম"), icon: Home },
      { href: "/app/billing", label: t("nav.billing", "বিক্রি / POS"), icon: ShoppingCart },
      { href: "/app/inventory", label: category.terminology.stockLabel, icon: Package },
      { href: "/app/customers", label: category.terminology.bakiLabel, icon: Users },
      { href: "/app/cashbox", label: t("nav.cashbox", "ক্যাশ বক্স"), icon: Wallet },
      { href: "/app/reports", label: t("nav.reports", "আর্থিক খতিয়ান"), icon: BarChart3 },
    ]
  })()

  const CategoryIcon = category.icon
  const RoleInfo = ROLE_LABELS[role]
  const RoleIcon = RoleInfo.icon

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Daily Shop Opening Shutter Animation */}
      <ShopShutter shopName={activeShop?.name || "দোকানদার মামা"} />

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-3.5 bg-card border-b border-card-border sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 p-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs"
            title="ক্যাটাগরি পরিবর্তন করুন"
          >
            <CategoryIcon className="w-4 h-4" />
            <span>{category.displayNameBn}</span>
          </button>

          <button
            onClick={() => setIsRoleModalOpen(true)}
            className={cn("text-[10px] font-semibold px-2 py-1 rounded-lg border", RoleInfo.color)}
            title="রোল পরিবর্তন বা টেস্ট করুন"
          >
            {RoleInfo.labelBn}
          </button>
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

          {/* Multi-Shop Branch Switcher for Owner */}
          {allShops.length > 1 && isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1 rounded-xl">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="max-w-[70px] truncate">{activeShop?.name || "দোকান"}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuLabel className="text-xs">আপনার শাখাসমূহ</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allShops.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => switchShop(s.id)}
                    className="text-xs flex items-center justify-between"
                  >
                    <span>{s.name}</span>
                    {s.id === activeShop?.id && <Check className="w-3.5 h-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
                ? `অফলাইন মোড — নেট নেই। বিক্রয় ও হিসাব ফোনে সেভ হচ্ছে (${pendingCount} টি অপেক্ষমাণ)`
                : `${pendingCount} টি অফলাইন ডাটা সার্ভারে সিঙ্ক হচ্ছে...`}
            </span>
          </div>
          {isOnline && pendingCount > 0 && (
            <button
              onClick={runSync}
              disabled={isSyncing}
              className="bg-zinc-950 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold"
            >
              {isSyncing ? "সিঙ্ক হচ্ছে..." : "এখনই সিঙ্ক করুন"}
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
            <h1 className="text-xl font-extrabold text-primary flex items-center gap-2">
              <CategoryIcon className="w-6 h-6" />
              দোকানদার মামা
            </h1>
          </div>

          {/* Shop Switcher & Category Badge */}
          <div className="space-y-2">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <CategoryIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {category.displayNameBn}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                    {activeShop?.name || (user?.unsafeMetadata as any)?.shopName || "আপনার দোকান"}
                  </div>
                </div>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
            </button>

            {/* Role Badge with Switcher for Pair Programming & Testing */}
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors",
                RoleInfo.color,
              )}
            >
              <div className="flex items-center gap-1.5">
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{RoleInfo.labelBn}</span>
              </div>
              <span className="text-[10px] opacity-75">রোল পরিবর্তন ▾</span>
            </button>
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
          {allShops.length > 1 && isOwner && (
            <div className="px-1 text-[11px] text-muted-foreground flex justify-between items-center">
              <span>মোট শাখা: {allShops.length} টি</span>
            </div>
          )}
          <button
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            লগ আউট
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

      {/* Floating Voice Assistant (Chotu) */}
      <VoiceAssistant />

      {/* 1. Category Switcher Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> দোকানের ধরন ও থিম পরিবর্তন করুন
            </DialogTitle>
            <DialogDescription>
              ক্যাটাগরি পরিবর্তন করলে থিম কালার, ড্যাশবোর্ড উইজেট ও টার্মিনোলজি সাথে সাথে পরিবর্তিত হবে। আপনার পণ্য বা বিক্রির কোনো তথ্য ডিলিট হবে না।
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-3 max-h-80 overflow-y-auto p-1">
            {CATEGORY_LIST.map((cat) => {
              const Icon = cat.icon
              const isSelected = categoryId === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    changeShopCategory(cat.id)
                    setIsCategoryModalOpen(false)
                  }}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-2xl border text-left transition-all relative hover:scale-[1.02]",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-sm font-bold ring-2 ring-primary/30"
                      : "border-border/70 hover:bg-muted/80 bg-card text-foreground",
                  )}
                >
                  {isSelected && <Check className="h-4 w-4 text-primary absolute top-2 right-2" />}
                  <Icon className={cn("h-5 w-5 mb-1.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs font-bold leading-tight">{cat.displayNameBn}</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{cat.name.split("/")[0]}</span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Role Switcher Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" /> ইউজার রোল নির্বাচন / টেস্ট করুন
            </DialogTitle>
            <DialogDescription>
              বিভিন্ন রোলের জন্য ইন্টারফেস কেমন দেখায় তা পরীক্ষা করুন।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {(["owner", "manager", "shopkeeper", "superadmin"] as UserRole[]).map((r) => {
              const info = ROLE_LABELS[r]
              const Icon = info.icon
              const isSelected = role === r
              return (
                <button
                  key={r}
                  onClick={() => {
                    setRoleOverride(r)
                    setIsRoleModalOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                      : "border-border hover:bg-muted text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl border", info.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{info.labelBn}</div>
                      <div className="text-xs text-muted-foreground">
                        {r === "superadmin" && "প্ল্যাটফর্ম ব্যবস্থাপনা ও সকল ব্যবসা"}
                        {r === "owner" && "সম্পূর্ণ বিজনেস, মাল্টি-শপ ও আর্থিক খতিয়ান"}
                        {r === "manager" && "দৈনিক পরিচালনা, ইনভেন্টরি ও ক্যাশ বক্স"}
                        {r === "shopkeeper" && "মোবাইল-ফার্স্ট দ্রুত বিলিং ও বারকোড"}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

