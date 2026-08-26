import { useState, useEffect } from "react"
import { Link } from "wouter"
import { useUser } from "@clerk/react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useGetDashboardOverview,
  useGetRestockSuggestions,
  useGetTopProducts,
  useListCustomers,
  useGetCashboxState,
  useOpenCashbox,
  useAddCashMovement,
  getGetCashboxStateQueryKey,
  getListCashSessionsQueryKey,
  getGetDashboardOverviewQueryKey,
} from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useShopTheme } from "@/context/shop-theme-context"
import {
  BarChart3,
  Package,
  Receipt,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Wallet,
  Unlock,
  MinusCircle,
  PlusCircle,
  ShoppingBag,
  Coffee,
  Zap,
  HeartHandshake,
  UserCheck,
  Building2,
  Crown,
  ChevronRight,
  Activity,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const EXPENSE_CATEGORIES = [
  { label: "মালামাল ক্রয় / সাপ্লায়ার", icon: ShoppingBag, notePrefix: "মালামাল ক্রয়: " },
  { label: "চা / নাস্তা / আপ্যায়ন", icon: Coffee, notePrefix: "চা-নাস্তা: " },
  { label: "দোকান ভাড়া / বিদ্যুৎ বিল", icon: Zap, notePrefix: "ভাড়া/বিদ্যুৎ: " },
  { label: "দান / সদকা", icon: HeartHandshake, notePrefix: "দান/সদকা: " },
  { label: "কর্মচারীর বেতন / মজুরি", icon: UserCheck, notePrefix: "বেতন/মজুরি: " },
  { label: "মালিকের ব্যক্তিগত উত্তোলন", icon: Wallet, notePrefix: "ব্যক্তিগত উত্তোলন: " },
  { label: "অন্যান্য খরচ", icon: MinusCircle, notePrefix: "" },
] as const

function greeting(name: string): string {
  const hour = new Date().getHours()
  const timeGreeting =
    hour < 12 ? "শুভ সকাল" : hour < 17 ? "শুভ দুপুর" : hour < 20 ? "শুভ সন্ধ্যা" : "শুভ রাত্রি"
  return `${timeGreeting}, ${name} মামা!`
}

export function OwnerDashboard() {
  const { user } = useUser()
  const { category, categoryId, activeShop, allShops, switchShop, isOwner } = useShopTheme()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const metadata = user?.unsafeMetadata as { displayName?: string; shopName?: string } | undefined
  const displayName = metadata?.displayName || user?.firstName || "মামা"

  const { data: overview, isLoading, error } = useGetDashboardOverview()
  const { data: restockSuggestions } = useGetRestockSuggestions()
  const { data: topProducts } = useGetTopProducts({ range: "week" })
  const { data: dueCustomers } = useListCustomers({ withDueOnly: true })
  const { data: cashboxState } = useGetCashboxState()

  const [isOpenCashboxModal, setIsOpenCashboxModal] = useState(false)
  const [openingBalance, setOpeningBalance] = useState("")
  const [openingNote, setOpeningNote] = useState("")
  const [isExpenseModal, setIsExpenseModal] = useState(false)
  const [expenseCategoryIdx, setExpenseCategoryIdx] = useState(0)
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseDetail, setExpenseDetail] = useState("")

  const refreshCashbox = () => {
    queryClient.invalidateQueries({ queryKey: getGetCashboxStateQueryKey() })
    queryClient.invalidateQueries({ queryKey: getListCashSessionsQueryKey() })
    queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() })
  }

  const openCashboxMutation = useOpenCashbox({
    mutation: {
      onSuccess: () => {
        setIsOpenCashboxModal(false)
        setOpeningBalance("")
        setOpeningNote("")
        refreshCashbox()
        toast({ title: "আজকের দোকান ও ক্যাশ বক্স চালু হয়েছে!", description: "সব বিক্রি ও খরচ স্বয়ংক্রিয়ভাবে হিসাব হবে।" })
      },
      onError: (err: any) => {
        toast({ title: "ক্যাশ বক্স চালু করতে সমস্যা হয়েছে", description: err?.message || "আবার চেষ্টা করুন", variant: "destructive" })
      },
    },
  })

  const addExpenseMutation = useAddCashMovement({
    mutation: {
      onSuccess: () => {
        setIsExpenseModal(false)
        setExpenseAmount("")
        setExpenseDetail("")
        refreshCashbox()
        toast({ title: "খরচের হিসাব যোগ করা হয়েছে!" })
      },
      onError: (err: any) => {
        toast({ title: "খরচ যোগ করা যায়নি", description: err?.message || "আবার চেষ্টা করুন", variant: "destructive" })
      },
    },
  })

  useEffect(() => {
    if (cashboxState && !cashboxState.session) {
      const dismissed = sessionStorage.getItem("dokandar_cashbox_prompt_dismissed")
      if (!dismissed) setIsOpenCashboxModal(true)
    }
  }, [cashboxState])

  const handleDismissOpenPrompt = () => {
    sessionStorage.setItem("dokandar_cashbox_prompt_dismissed", "true")
    setIsOpenCashboxModal(false)
  }

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(expenseAmount)
    if (!amt || amt <= 0) return
    const cat = EXPENSE_CATEGORIES[expenseCategoryIdx]
    const fullNote = cat.notePrefix + (expenseDetail.trim() || cat.label)
    addExpenseMutation.mutate({ data: { type: "expense", amount: amt, note: fullNote } })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-2xl border border-destructive/20 text-destructive">
        <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-80" />
        <p>তথ্য লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।</p>
      </div>
    )
  }

  const topDueCustomers = [...(dueCustomers ?? [])].sort((a, b) => Number(b.bakiBalance) - Number(a.bakiBalance)).slice(0, 3)
  const isSessionOpen = !!cashboxState?.session
  const drawerExpected = cashboxState?.expectedClosing ?? 0
  const sessionOpening = cashboxState?.session?.openingBalance ?? 0
  const totalCashSales = cashboxState?.totals?.cashSales ?? 0
  const totalExpenses = cashboxState?.totals?.expenses ?? 0

  const CategoryIcon = category.icon

  return (
    <div className="space-y-6">
      {/* Owner Header + Business Intro */}
      <div>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">মালিক ড্যাশবোর্ড</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground">{greeting(displayName)}</h2>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <CategoryIcon className="h-4 w-4 text-primary" />
              {activeShop?.name || metadata?.shopName || "আপনার দোকান"} — সম্পূর্ণ ব্যবসার খতিয়ান
            </p>
          </div>
          {/* Multi-shop summary badge */}
          {allShops.length > 1 && (
            <Badge className="bg-primary/10 text-primary border-primary/30 text-xs px-3 py-1.5 gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {allShops.length} টি শাখা
            </Badge>
          )}
        </div>

        {/* Multi-shop selector for owner */}
        {allShops.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {allShops.map((s) => (
              <button
                key={s.id}
                onClick={() => switchShop(s.id)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                  s.id === activeShop?.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category Quick Actions — from theme config */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {category.quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.href} href={action.href}>
              <div className={cn(
                "rounded-2xl p-4 h-24 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all",
                action.className
              )}>
                <Icon className="h-6 w-6" />
                <div>
                  <div className="font-bold text-sm leading-tight">{action.label}</div>
                  <div className="text-xs opacity-80 leading-tight mt-0.5">{action.sublabel}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* 4 Core Financial & Operational Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. আজকের বিক্রি */}
        <Card className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
            <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">আজকের বিক্রি</CardTitle>
            <div className="bg-primary/20 p-2 rounded-xl text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">৳{overview?.todaySalesTotal || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              {overview?.todayTransactionCount || 0} টি ক্যাশমেমো
            </p>
          </CardContent>
        </Card>

        {/* 2. ক্যাশ ড্রয়ার */}
        <Link href="/app/cashbox">
          <Card className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 hover:scale-[1.01] transition-transform cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
              <CardTitle className="text-xs font-bold text-emerald-700 uppercase tracking-wider">ক্যাশ বক্স</CardTitle>
              <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-700">
                <Wallet className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">৳{drawerExpected}</div>
              <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">
                {isSessionOpen ? "শিফট চালু — ড্রয়ারে নগদ" : "শিফট বন্ধ"}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* 3. মোট বকেয়া (বাকি) */}
        <Link href="/app/customers">
          <Card className="rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-amber-500/20 hover:scale-[1.01] transition-transform cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
              <CardTitle className="text-xs font-bold text-amber-700 uppercase tracking-wider">মোট বকেয়া (বাকি)</CardTitle>
              <div className="bg-amber-500/20 p-2 rounded-xl text-amber-700">
                <Receipt className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">৳{overview?.totalDue || 0}</div>
              <p className="text-[11px] text-amber-700/80 mt-1 font-medium">{overview?.customerCount || 0} জন কাস্টমার</p>
            </CardContent>
          </Card>
        </Link>

        {/* 4. কম স্টক */}
        <Link href="/app/inventory">
          <Card className={cn(
            "rounded-2xl border transition-all cursor-pointer hover:scale-[1.01]",
            (overview?.lowStockCount || 0) > 0
              ? "bg-gradient-to-br from-rose-500/15 to-rose-500/5 border-rose-500/30"
              : "bg-muted/30 border-border"
          )}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
              <CardTitle className={cn(
                "text-xs font-bold uppercase tracking-wider",
                (overview?.lowStockCount || 0) > 0 ? "text-rose-700" : "text-muted-foreground"
              )}>{category.terminology.stockLabel}</CardTitle>
              <div className={cn(
                "p-2 rounded-xl",
                (overview?.lowStockCount || 0) > 0 ? "bg-rose-500/20 text-rose-700" : "bg-muted text-muted-foreground"
              )}>
                <Package className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={cn(
                "text-2xl sm:text-3xl font-extrabold",
                (overview?.lowStockCount || 0) > 0 ? "text-rose-700" : "text-foreground"
              )}>
                {overview?.lowStockCount || 0} টি
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                {(overview?.lowStockCount || 0) > 0 ? "স্টক শেষের দিকে — কিনুন" : "পর্যাপ্ত স্টক আছে"}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Category-specific feature callout */}
      {category.features.hasExpiry && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">{category.terminology.expiryLabel} চেক করুন</p>
            <p className="text-xs text-amber-600">ইনভেন্টরিতে মেয়াদোত্তীর্ণ পণ্যের তালিকা দেখুন</p>
          </div>
          <Link href="/app/inventory">
            <ChevronRight className="h-5 w-5 text-amber-600" />
          </Link>
        </div>
      )}
      {category.features.hasWarranty && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
          <Activity className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">ওয়ারেন্টি ট্র্যাকিং</p>
            <p className="text-xs text-blue-600">পণ্যের সিরিয়াল ও ওয়ারেন্টি তারিখ ইনভেন্টরিতে রাখুন</p>
          </div>
          <Link href="/app/inventory">
            <ChevronRight className="h-5 w-5 text-blue-600" />
          </Link>
        </div>
      )}

      {/* Cash Box Live Card */}
      <Card className="rounded-2xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">আজকের ক্যাশ বক্স ও খরচ</CardTitle>
              <p className="text-xs text-muted-foreground">ড্রয়ারের টাকার লাইভ হিসাব</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSessionOpen ? (
              <Badge className="bg-green-600 hover:bg-green-700 text-xs gap-1">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> চালু আছে
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">বন্ধ আছে</Badge>
            )}
            <Link href="/app/cashbox">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:text-primary">
                বিস্তারিত <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/40 rounded-xl">
              <span className="text-xs text-muted-foreground">শুরুর ক্যাশ</span>
              <div className="text-lg font-bold text-foreground">৳{sessionOpening}</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <span className="text-xs text-green-700 font-medium">ক্যাশ বিক্রি ও জমা</span>
              <div className="text-lg font-bold text-green-600">+ ৳{totalCashSales + (cashboxState?.totals?.cashIn ?? 0)}</div>
            </div>
            <div className="p-3 bg-destructive/10 rounded-xl">
              <span className="text-xs text-destructive font-medium">সকল খরচ ও উত্তোলন</span>
              <div className="text-lg font-bold text-destructive">- ৳{totalExpenses + (cashboxState?.totals?.cashOut ?? 0)}</div>
            </div>
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
              <span className="text-xs text-primary font-bold">ড্রয়ারে থাকা উচিত</span>
              <div className="text-xl font-extrabold text-primary">৳{drawerExpected}</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {!isSessionOpen ? (
              <Button className="flex-1 rounded-xl h-11 gap-2 font-semibold shadow-sm" onClick={() => setIsOpenCashboxModal(true)}>
                <Unlock className="h-4 w-4" /> আজকের দোকান ও ক্যাশ বক্স খুলুন
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1 rounded-xl h-11 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setIsExpenseModal(true)}>
                  <MinusCircle className="h-4 w-4" /> খরচ লিখুন (মালামাল, চা-নাস্তা, দান...)
                </Button>
                <Link href="/app/cashbox" className="flex-1">
                  <Button variant="default" className="w-full rounded-xl h-11 gap-2">
                    <Wallet className="h-4 w-4" /> দিন শেষে হিসাব মেলান
                  </Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Restock Suggestions + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              মামা বলছে: আবার কিনুন
            </CardTitle>
            <Link href="/app/inventory" className="text-sm text-primary flex items-center gap-1 hover:underline">
              সব দেখুন <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {restockSuggestions && restockSuggestions.length > 0 ? (
              <ul className="space-y-2">
                {restockSuggestions.slice(0, 4).map((s) => (
                  <li key={s.productId} className="flex justify-between items-center text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0">
                    <span className="font-medium text-foreground truncate max-w-[60%]">{s.productName}</span>
                    <span className="text-muted-foreground text-xs">স্টক {s.stock}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">এখন কোনো প্রোডাক্ট রিস্টক করার দরকার নেই।</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              এই সপ্তাহের সেরা বিক্রি
            </CardTitle>
            <Link href="/app/reports" className="text-sm text-primary flex items-center gap-1 hover:underline">
              সব দেখুন <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {topProducts && topProducts.length > 0 ? (
              <ul className="space-y-2">
                {topProducts.slice(0, 4).map((p) => (
                  <li key={p.productId} className="flex justify-between items-center text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0">
                    <span className="font-medium text-foreground truncate max-w-[60%]">{p.productName}</span>
                    <span className="text-muted-foreground">{p.quantitySold} বিক্রি</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">এই সপ্তাহে এখনো যথেষ্ট বিক্রি হয়নি।</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Baki Customers */}
      {topDueCustomers.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Receipt className="h-5 w-5 text-destructive" />
              সবচেয়ে বেশি {category.terminology.bakiLabel}
            </CardTitle>
            <Link href="/app/customers" className="text-sm text-primary flex items-center gap-1 hover:underline">
              সব দেখুন <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topDueCustomers.map((c) => (
                <li key={c.id} className="flex justify-between items-center text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="text-destructive font-semibold">৳{c.bakiBalance}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Open Cash Box Dialog */}
      <Dialog open={isOpenCashboxModal} onOpenChange={setIsOpenCashboxModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-2xl text-primary w-fit mb-2">
              <Wallet className="h-8 w-8" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">আজকের দোকান ও ক্যাশ বক্স চালু করুন</DialogTitle>
            <DialogDescription className="text-center text-sm">
              দিনের শুরুতে ড্রয়ারে রাখা শুরুর ক্যাশ ব্যালেন্স প্রদান করুন।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-sm font-medium text-foreground">শুরুর ক্যাশ টাকা (৳) *</label>
              <Input type="number" inputMode="decimal" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="যেমন: ১০০০" className="h-12 text-xl font-bold mt-1.5 rounded-xl" autoFocus />
              <div className="flex gap-2 mt-2">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button key={amt} type="button" onClick={() => setOpeningBalance(String(amt))} className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors border">
                    + ৳{amt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">মন্তব্য / নোট (ঐচ্ছিক)</label>
              <Input value={openingNote} onChange={(e) => setOpeningNote(e.target.value)} placeholder="যেমন: সকাল ৮টায় দোকান খোলা হলো" className="h-11 mt-1.5 rounded-xl text-sm" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={handleDismissOpenPrompt} className="h-11 rounded-xl">পরে করব</Button>
            <Button type="button" className="h-11 rounded-xl font-semibold gap-2" disabled={openCashboxMutation.isPending || openingBalance.trim() === ""} onClick={() => openCashboxMutation.mutate({ data: { openingBalance: Number(openingBalance), ...(openingNote.trim() ? { note: openingNote.trim() } : {}) } })}>
              <Unlock className="h-4 w-4" /> আজকের দোকান শুরু করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={isExpenseModal} onOpenChange={setIsExpenseModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MinusCircle className="h-5 w-5 text-destructive" /> খরচের হিসাব যোগ করুন
            </DialogTitle>
            <DialogDescription>
              মালামাল ক্রয়, চা-নাস্তা, বিদ্যুৎ, দান বা যে কোনো খরচ রেকর্ড করুন।
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordExpense} className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">খরচের ধরন বেছে নিন</label>
              <div className="grid grid-cols-2 gap-2">
                {EXPENSE_CATEGORIES.map((cat, idx) => {
                  const Icon = cat.icon
                  const isSelected = expenseCategoryIdx === idx
                  return (
                    <button key={cat.label} type="button" onClick={() => setExpenseCategoryIdx(idx)} className={cn("flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all", isSelected ? "border-destructive bg-destructive/10 text-destructive font-bold shadow-sm" : "border-border hover:bg-muted text-muted-foreground")}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">টাকার পরিমাণ (৳) *</label>
              <Input type="number" inputMode="decimal" required value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="যেমন: ৫০" className="h-12 text-lg font-bold mt-1.5 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">বিবরণ (ঐচ্ছিক)</label>
              <Input value={expenseDetail} onChange={(e) => setExpenseDetail(e.target.value)} placeholder="যেমন: ৫ কাপ চা ও বিস্কুট" className="h-11 mt-1.5 rounded-xl text-sm" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsExpenseModal(false)} className="h-11 rounded-xl">বাতিল</Button>
              <Button type="submit" variant="destructive" disabled={addExpenseMutation.isPending || Number(expenseAmount) <= 0} className="h-11 rounded-xl font-semibold gap-2">
                খরচ সেভ করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
