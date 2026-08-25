import { useState } from "react"
import { Link } from "wouter"
import { useUser } from "@clerk/react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useGetDashboardOverview,
  useGetCashboxState,
  useGetTopProducts,
  useListCustomers,
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useShopTheme } from "@/context/shop-theme-context"
import {
  BarChart3,
  Package,
  Users,
  Wallet,
  ArrowRight,
  Unlock,
  MinusCircle,
  AlertTriangle,
  TrendingUp,
  Receipt,
  ChevronRight,
  ShoppingCart,
  Clock,
  Activity,
  Coffee,
  ShoppingBag,
  Zap,
  HeartHandshake,
  UserCheck,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function greeting(name: string): string {
  const hour = new Date().getHours()
  const timeGreeting =
    hour < 12 ? "শুভ সকাল" : hour < 17 ? "শুভ দুপুর" : hour < 20 ? "শুভ সন্ধ্যা" : "শুভ রাত্রি"
  return `${timeGreeting}, ${name} ভাই!`
}

const EXPENSE_CATEGORIES = [
  { label: "মালামাল ক্রয়", icon: ShoppingBag, notePrefix: "মালামাল ক্রয়: " },
  { label: "চা / নাস্তা", icon: Coffee, notePrefix: "চা-নাস্তা: " },
  { label: "ভাড়া / বিদ্যুৎ", icon: Zap, notePrefix: "ভাড়া/বিদ্যুৎ: " },
  { label: "দান / সদকা", icon: HeartHandshake, notePrefix: "দান/সদকা: " },
  { label: "বেতন / মজুরি", icon: UserCheck, notePrefix: "বেতন/মজুরি: " },
  { label: "অন্যান্য খরচ", icon: MinusCircle, notePrefix: "" },
] as const

export function ManagerDashboard() {
  const { user } = useUser()
  const { category, activeShop } = useShopTheme()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const metadata = user?.unsafeMetadata as { displayName?: string } | undefined
  const displayName = metadata?.displayName || user?.firstName || "ম্যানেজার"

  const { data: overview, isLoading } = useGetDashboardOverview()
  const { data: cashboxState } = useGetCashboxState()
  const { data: topProducts } = useGetTopProducts({ range: "week" })
  const { data: dueCustomers } = useListCustomers({ withDueOnly: true })

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
        refreshCashbox()
        toast({ title: "দোকান ও ক্যাশ বক্স চালু হয়েছে!" })
      },
      onError: (err: any) => {
        toast({ title: "ক্যাশ বক্স চালু করতে সমস্যা", description: err?.message, variant: "destructive" })
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
        toast({ title: "খরচ যোগ হয়েছে!" })
      },
      onError: (err: any) => {
        toast({ title: "খরচ যোগ করা যায়নি", description: err?.message, variant: "destructive" })
      },
    },
  })

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(expenseAmount)
    if (!amt || amt <= 0) return
    const cat = EXPENSE_CATEGORIES[expenseCategoryIdx]
    addExpenseMutation.mutate({
      data: { type: "expense", amount: amt, note: cat.notePrefix + (expenseDetail.trim() || cat.label) },
    })
  }

  const isSessionOpen = !!cashboxState?.session
  const drawerExpected = cashboxState?.expectedClosing ?? 0
  const sessionOpening = cashboxState?.session?.openingBalance ?? 0
  const totalCashSales = cashboxState?.totals?.cashSales ?? 0
  const totalExpenses = cashboxState?.totals?.expenses ?? 0
  const topDueCustomers = [...(dueCustomers ?? [])].sort((a, b) => Number(b.bakiBalance) - Number(a.bakiBalance)).slice(0, 3)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">{greeting(displayName)}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          {activeShop?.name} — আজকের পরিচালনা ড্যাশবোর্ড
        </p>
      </div>

      {/* Quick Actions */}
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
                  <div className="text-xs opacity-75 leading-tight mt-0.5">{action.sublabel}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] text-primary font-semibold">আজকের বিক্রি</span>
            </div>
            <div className="text-2xl font-extrabold text-foreground">৳{overview?.todaySalesTotal ?? 0}</div>
            <div className="text-[10px] text-muted-foreground">{overview?.todayTransactionCount ?? 0} টি বিল</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground font-semibold">কাস্টমার</span>
            </div>
            <div className="text-2xl font-extrabold text-foreground">{overview?.customerCount ?? 0}</div>
            <div className="text-[10px] text-muted-foreground">মোট কাস্টমার</div>
          </CardContent>
        </Card>

        <Card className={cn("rounded-2xl", (overview?.lowStockCount ?? 0) > 0 ? "border-amber-500/30 bg-amber-50" : "")}>
          <CardContent className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <Package className={cn("h-3.5 w-3.5", (overview?.lowStockCount ?? 0) > 0 ? "text-amber-600" : "text-muted-foreground")} />
              <span className={cn("text-[11px] font-semibold", (overview?.lowStockCount ?? 0) > 0 ? "text-amber-700" : "text-muted-foreground")}>কম স্টক</span>
            </div>
            <div className={cn("text-2xl font-extrabold", (overview?.lowStockCount ?? 0) > 0 ? "text-amber-700" : "text-foreground")}>
              {overview?.lowStockCount ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">পণ্য কম আছে</div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Box Card */}
      <Card className="rounded-2xl border-2 border-primary/20 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">আজকের ক্যাশ বক্স</CardTitle>
              <p className="text-[11px] text-muted-foreground">ড্রয়ারের লাইভ হিসাব</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", isSessionOpen ? "bg-green-600" : "bg-destructive")}>
              {isSessionOpen ? (
                <><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse mr-1" />চালু</>
              ) : "বন্ধ"}
            </Badge>
            <Link href="/app/cashbox">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-primary">
                বিস্তারিত <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-muted/40 rounded-xl">
              <span className="text-[10px] text-muted-foreground">শুরুর ক্যাশ</span>
              <div className="text-base font-bold">৳{sessionOpening}</div>
            </div>
            <div className="p-2.5 bg-green-50 rounded-xl">
              <span className="text-[10px] text-green-700 font-medium">ক্যাশ বিক্রি</span>
              <div className="text-base font-bold text-green-600">+৳{totalCashSales + (cashboxState?.totals?.cashIn ?? 0)}</div>
            </div>
            <div className="p-2.5 bg-red-50 rounded-xl">
              <span className="text-[10px] text-red-700 font-medium">মোট খরচ</span>
              <div className="text-base font-bold text-destructive">-৳{totalExpenses + (cashboxState?.totals?.cashOut ?? 0)}</div>
            </div>
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
              <span className="text-[10px] text-primary font-bold">ড্রয়ারে থাকার কথা</span>
              <div className="text-lg font-extrabold text-primary">৳{drawerExpected}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {!isSessionOpen ? (
              <Button className="flex-1 rounded-xl h-10 gap-2 text-sm" onClick={() => setIsOpenCashboxModal(true)}>
                <Unlock className="h-4 w-4" /> দোকান ও ক্যাশ বক্স খুলুন
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1 rounded-xl h-10 gap-1.5 text-sm border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setIsExpenseModal(true)}>
                  <MinusCircle className="h-4 w-4" /> খরচ লিখুন
                </Button>
                <Link href="/app/cashbox" className="flex-1">
                  <Button className="w-full rounded-xl h-10 text-sm">
                    <Wallet className="h-4 w-4 mr-1.5" /> হিসাব মেলান
                  </Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Sellers + Pending Baki */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> এই সপ্তাহের সেরা বিক্রি
            </CardTitle>
            <Link href="/app/reports" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
              সব দেখুন <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {topProducts && topProducts.length > 0 ? (
              <ul className="space-y-2">
                {topProducts.slice(0, 4).map((p) => (
                  <li key={p.productId} className="flex justify-between items-center text-sm border-b border-border/50 last:border-0 pb-1.5 last:pb-0">
                    <span className="font-medium text-foreground truncate max-w-[60%]">{p.productName}</span>
                    <span className="text-xs text-muted-foreground">{p.quantitySold} বিক্রি</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">এই সপ্তাহে তথ্য নেই।</p>
            )}
          </CardContent>
        </Card>

        {topDueCustomers.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4 text-destructive" /> বাকি কাস্টমার
              </CardTitle>
              <Link href="/app/customers" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
                সব দেখুন <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {topDueCustomers.map((c) => (
                  <li key={c.id} className="flex justify-between items-center text-sm border-b border-border/50 last:border-0 pb-1.5 last:pb-0">
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="text-destructive font-bold">৳{c.bakiBalance}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Category-specific alerts */}
      {category.features.hasExpiry && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-medium">মেয়াদোত্তীর্ণ পণ্য চেক করুন — ইনভেন্টরি পেজে Expiry ফিল্টার ব্যবহার করুন।</span>
          <Link href="/app/inventory" className="ml-auto shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Cashbox Open Dialog */}
      <Dialog open={isOpenCashboxModal} onOpenChange={setIsOpenCashboxModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">আজকের দোকান চালু করুন</DialogTitle>
            <DialogDescription>ড্রয়ারের শুরুর ক্যাশ ব্যালেন্স দিন।</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input type="number" inputMode="decimal" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="শুরুর ক্যাশ টাকা" className="h-12 text-xl font-bold rounded-xl" autoFocus />
            <div className="flex gap-2">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button key={amt} type="button" onClick={() => setOpeningBalance(String(amt))} className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-muted hover:bg-muted/80 border transition-colors">
                  ৳{amt}
                </button>
              ))}
            </div>
            <Input value={openingNote} onChange={(e) => setOpeningNote(e.target.value)} placeholder="নোট (ঐচ্ছিক)" className="h-10 rounded-xl text-sm" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpenCashboxModal(false)} className="rounded-xl">বাতিল</Button>
            <Button disabled={openCashboxMutation.isPending || !openingBalance.trim()} onClick={() => openCashboxMutation.mutate({ data: { openingBalance: Number(openingBalance), ...(openingNote.trim() ? { note: openingNote } : {}) } })} className="rounded-xl gap-2">
              <Unlock className="h-4 w-4" /> চালু করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={isExpenseModal} onOpenChange={setIsExpenseModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MinusCircle className="h-5 w-5 text-destructive" /> খরচের হিসাব</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordExpense} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map((cat, idx) => {
                const Icon = cat.icon
                return (
                  <button key={cat.label} type="button" onClick={() => setExpenseCategoryIdx(idx)} className={cn("flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-all", expenseCategoryIdx === idx ? "border-destructive bg-destructive/10 text-destructive font-bold" : "border-border hover:bg-muted text-muted-foreground")}>
                    <Icon className="h-4 w-4 shrink-0" /><span className="truncate">{cat.label}</span>
                  </button>
                )
              })}
            </div>
            <Input type="number" inputMode="decimal" required value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="টাকার পরিমাণ" className="h-12 text-lg font-bold rounded-xl" />
            <Input value={expenseDetail} onChange={(e) => setExpenseDetail(e.target.value)} placeholder="বিবরণ (ঐচ্ছিক)" className="h-10 rounded-xl text-sm" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsExpenseModal(false)} className="rounded-xl">বাতিল</Button>
              <Button type="submit" variant="destructive" disabled={addExpenseMutation.isPending || Number(expenseAmount) <= 0} className="rounded-xl">খরচ সেভ করুন</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
