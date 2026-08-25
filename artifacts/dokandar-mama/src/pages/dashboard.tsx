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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart3,
  Package,
  Receipt,
  Users,
  AlertTriangle,
  ShoppingCart,
  UserPlus,
  PackagePlus,
  FileBarChart,
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

// The four things a shopkeeper does most often, front and center on the
// home screen so nothing is more than one tap away — this is the fix for
// "all options should be accessible from home page".
const quickActions = [
  {
    href: "/app/billing",
    label: "নতুন বিল",
    sublabel: "বিক্রি করুন",
    icon: ShoppingCart,
    className: "bg-primary text-primary-foreground",
  },
  {
    href: "/app/inventory",
    label: "প্রোডাক্ট যোগ",
    sublabel: "ইনভেন্টরি",
    icon: PackagePlus,
    className: "bg-accent/90 text-accent-foreground",
  },
  {
    href: "/app/customers",
    label: "কাস্টমার যোগ",
    sublabel: "বাকি হিসাব",
    icon: UserPlus,
    className: "bg-secondary text-secondary-foreground",
  },
  {
    href: "/app/reports",
    label: "রিপোর্ট দেখুন",
    sublabel: "বিক্রির খতিয়ান",
    icon: FileBarChart,
    className: "bg-muted text-foreground",
  },
]

// "শুভ সন্ধ্যা, শুভ মামা!" — time-of-day salutation + the shopkeeper's own
// name, collected once via ShopOnboardingGate right after signup.
function greeting(name: string): string {
  const hour = new Date().getHours()
  const timeGreeting =
    hour < 12 ? "শুভ সকাল" : hour < 17 ? "শুভ দুপুর" : hour < 20 ? "শুভ সন্ধ্যা" : "শুভ রাত্রি"
  return `${timeGreeting}, ${name} মামা!`
}

export function Dashboard() {
  const { user } = useUser()
  const metadata = user?.unsafeMetadata as { displayName?: string; shopName?: string } | undefined
  const displayName = metadata?.displayName || user?.firstName || "মামা"
  const shopName = metadata?.shopName

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: overview, isLoading, error } = useGetDashboardOverview()
  const { data: restockSuggestions } = useGetRestockSuggestions()
  const { data: topProducts } = useGetTopProducts({ range: "week" })
  const { data: dueCustomers } = useListCustomers({ withDueOnly: true })
  const { data: cashboxState } = useGetCashboxState()

  // Cashbox Popups and Dialogs
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
        toast({ title: "আজকের দোকান ও ক্যাশ বক্স চালু হয়েছে!", description: "এখন সব বিক্রি ও খরচ স্বয়ংক্রিয়ভাবে হিসাব হবে।" })
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

  // Auto-prompt Mama to open the shop day if no active session
  useEffect(() => {
    if (cashboxState && !cashboxState.session) {
      const dismissed = sessionStorage.getItem("dokandar_cashbox_prompt_dismissed")
      if (!dismissed) {
        setIsOpenCashboxModal(true)
      }
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

    const category = EXPENSE_CATEGORIES[expenseCategoryIdx]
    const fullNote = category.notePrefix + (expenseDetail.trim() || category.label)

    addExpenseMutation.mutate({
      data: {
        type: "expense",
        amount: amt,
        note: fullNote,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">আজকের হিসাব</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
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

  const topDueCustomers = [...(dueCustomers ?? [])]
    .sort((a, b) => Number(b.bakiBalance) - Number(a.bakiBalance))
    .slice(0, 3)

  const isSessionOpen = !!cashboxState?.session
  const drawerExpected = cashboxState?.expectedClosing ?? 0
  const sessionOpening = cashboxState?.session?.openingBalance ?? 0
  const totalCashSales = cashboxState?.totals?.cashSales ?? 0
  const totalExpenses = cashboxState?.totals?.expenses ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-1">{greeting(displayName)}</h2>
        <p className="text-muted-foreground text-lg">
          {shopName ? `${shopName} — আপনার দোকানের সব কাজ এক জায়গায়` : "আপনার দোকানের সব কাজ এক জায়গায়"}
        </p>
      </div>

      {/* Quick actions — the primary fix for "everything reachable from home" */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <div
              className={cn(
                "rounded-2xl p-4 h-24 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all",
                action.className,
              )}
            >
              <action.icon className="h-6 w-6" />
              <div>
                <div className="font-bold text-sm leading-tight">{action.label}</div>
                <div className="text-xs opacity-80 leading-tight">{action.sublabel}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Today at a glance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-primary">আজকের বিক্রি</CardTitle>
            <div className="bg-primary/20 p-3 rounded-full">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">৳ {overview?.todaySalesTotal || 0}</div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              মোট {overview?.todayTransactionCount || 0} টি ক্যাশমেমো
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-destructive">মোট বকেয়া (বাকি)</CardTitle>
            <div className="bg-destructive/20 p-3 rounded-full">
              <Receipt className="h-6 w-6 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">৳ {overview?.totalDue || 0}</div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">আপনার পাওনা টাকা</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">মোট কাস্টমার</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overview?.customerCount || 0} জন</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">স্টক শেষের দিকে</CardTitle>
            <Package className={cn("h-5 w-5", (overview?.lowStockCount || 0) > 0 ? "text-accent" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", (overview?.lowStockCount || 0) > 0 ? "text-accent" : "text-foreground")}>
              {overview?.lowStockCount || 0} টি পণ্য
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Box Live Drawer Summary Card */}
      <Card className="rounded-2xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">আজকের ক্যাশ বক্স ও খরচ</CardTitle>
              <p className="text-xs text-muted-foreground">ড্রয়ারের টাকার লাইভ হিসাব ও খরচ ট্র্যাকিং</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSessionOpen ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs gap-1">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> চালু আছে
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs gap-1">
                বন্ধ আছে
              </Badge>
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
              <div className="text-lg font-bold text-foreground">৳ {sessionOpening}</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <span className="text-xs text-green-700 font-medium">ক্যাশ বিক্রি ও জমা</span>
              <div className="text-lg font-bold text-green-600">+ ৳ {totalCashSales + (cashboxState?.totals?.cashIn ?? 0)}</div>
            </div>
            <div className="p-3 bg-destructive/10 rounded-xl">
              <span className="text-xs text-destructive font-medium">সকল খরচ ও উত্তোলন</span>
              <div className="text-lg font-bold text-destructive">- ৳ {totalExpenses + (cashboxState?.totals?.cashOut ?? 0)}</div>
            </div>
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
              <span className="text-xs text-primary font-bold">ড্রয়ারে থাকা উচিত</span>
              <div className="text-xl font-extrabold text-primary">৳ {drawerExpected}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {!isSessionOpen ? (
              <Button
                className="flex-1 rounded-xl h-11 gap-2 font-semibold shadow-sm"
                onClick={() => setIsOpenCashboxModal(true)}
              >
                <Unlock className="h-4 w-4" /> আজকের দোকান ও ক্যাশ বক্স খুলুন
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-11 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => setIsExpenseModal(true)}
                >
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

      {/* Mama Suggests — demand-based restock nudge, and top sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
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
                    <span className="font-medium text-foreground">{s.productName}</span>
                    <span className="text-muted-foreground">স্টক {s.stock}</span>
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
                    <span className="font-medium text-foreground">{p.productName}</span>
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

      {/* Who owes the most — a direct nudge toward collecting baki */}
      {topDueCustomers.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Receipt className="h-5 w-5 text-destructive" />
              সবচেয়ে বেশি বাকি যাদের
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
                  <span className="text-destructive font-semibold">৳ {c.bakiBalance}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 1. Daily Shop Opening Dialog Modal */}
      <Dialog open={isOpenCashboxModal} onOpenChange={setIsOpenCashboxModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-2xl text-primary w-fit mb-2">
              <Wallet className="h-8 w-8" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">আজকের দোকান ও ক্যাশ বক্স চালু করুন</DialogTitle>
            <DialogDescription className="text-center text-sm">
              দিনের শুরুতে ড্রয়ারে রাখা শুরুর ক্যাশ ব্যালেন্স প্রদান করুন। সারাদিনের সব বিক্রি ও খরচ স্বয়ংক্রিয়ভাবে হিসাব হয়ে ড্রয়ারের টাকার সাথে মিলবে।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-sm font-medium text-foreground">শুরুর ক্যাশ টাকা (৳) *</label>
              <Input
                type="number"
                inputMode="decimal"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="যেমন: ১০০০"
                className="h-12 text-xl font-bold mt-1.5 rounded-xl"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setOpeningBalance(String(amt))}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors border"
                  >
                    + ৳{amt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">মন্তব্য / নোট (ঐচ্ছিক)</label>
              <Input
                value={openingNote}
                onChange={(e) => setOpeningNote(e.target.value)}
                placeholder="যেমন: সকাল ৮টায় দোকান খোলা হলো"
                className="h-11 mt-1.5 rounded-xl text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDismissOpenPrompt}
              className="h-11 rounded-xl"
            >
              পরে করব
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl font-semibold gap-2"
              disabled={openCashboxMutation.isPending || openingBalance.trim() === ""}
              onClick={() =>
                openCashboxMutation.mutate({
                  data: {
                    openingBalance: Number(openingBalance),
                    ...(openingNote.trim() ? { note: openingNote.trim() } : {}),
                  },
                })
              }
            >
              <Unlock className="h-4 w-4" /> আজকের দোকান শুরু করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Categorized Quick Expense Modal */}
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
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setExpenseCategoryIdx(idx)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all",
                        isSelected
                          ? "border-destructive bg-destructive/10 text-destructive font-bold shadow-sm"
                          : "border-border hover:bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">টাকার পরিমাণ (৳) *</label>
              <Input
                type="number"
                inputMode="decimal"
                required
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="যেমন: ৫০"
                className="h-12 text-lg font-bold mt-1.5 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">বিবরণ (ঐচ্ছিক)</label>
              <Input
                value={expenseDetail}
                onChange={(e) => setExpenseDetail(e.target.value)}
                placeholder="যেমন: ৫ কাপ চা ও বিস্কুট"
                className="h-11 mt-1.5 rounded-xl text-sm"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsExpenseModal(false)} className="h-11 rounded-xl">
                বাতিল
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={addExpenseMutation.isPending || Number(expenseAmount) <= 0}
                className="h-11 rounded-xl font-semibold gap-2"
              >
                খরচ সেভ করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

