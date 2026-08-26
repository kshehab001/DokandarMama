import { Link } from "wouter"
import { useUser } from "@clerk/react"
import {
  useGetDashboardOverview,
  useGetCashboxState,
  useListProducts,
} from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useShopTheme } from "@/context/shop-theme-context"
import {
  ShoppingCart,
  Package,
  Users,
  Wallet,
  AlertTriangle,
  Scan,
  Clock,
  TrendingUp,
  ChevronRight,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function greeting(name: string): string {
  const hour = new Date().getHours()
  const timeGreeting =
    hour < 12 ? "শুভ সকাল" : hour < 17 ? "শুভ দুপুর" : hour < 20 ? "শুভ সন্ধ্যা" : "শুভ রাত্রি"
  return `${timeGreeting}, ${name}!`
}

export function ShopkeeperDashboard() {
  const { user } = useUser()
  const { category, activeShop } = useShopTheme()

  const metadata = user?.unsafeMetadata as { displayName?: string } | undefined
  const displayName = metadata?.displayName || user?.firstName || "মামা"

  const { data: overview, isLoading } = useGetDashboardOverview()
  const { data: cashboxState } = useGetCashboxState()
  const { data: products } = useListProducts()

  const isSessionOpen = !!cashboxState?.session
  const lowStockProducts = (products ?? []).filter(
    (p) => Number(p.stock) <= Number(p.lowStockThreshold ?? 5)
  ).slice(0, 3)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Greeting + Shift Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{greeting(displayName)}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeShop?.name || "আপনার দোকান"} — আজকের শিফট
          </p>
        </div>
        <Badge
          className={cn(
            "text-xs gap-1.5 px-3 py-1.5 rounded-xl font-semibold",
            isSessionOpen
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isSessionOpen ? "bg-green-500 animate-pulse" : "bg-red-500"
            )}
          />
          {isSessionOpen ? "শিফট চালু" : "শিফট বন্ধ"}
        </Badge>
      </div>

      {/* 4 Core Shopkeeper Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. আজকের বিক্রি */}
        <Card className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-primary/80">আজকের বিক্রি</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-primary">
              ৳{overview?.todaySalesTotal ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {overview?.todayTransactionCount ?? 0} টি ক্যাশমেমো
            </div>
          </CardContent>
        </Card>

        {/* 2. ক্যাশ বক্স */}
        <Link href="/app/cashbox">
          <Card className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 hover:scale-[1.01] transition-transform cursor-pointer">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-700">ক্যাশ বক্স</span>
                <Wallet className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                ৳{cashboxState?.expectedClosing ?? 0}
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-0.5">
                ড্রয়ারে নগদ
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 3. মোট বাকি */}
        <Link href="/app/customers">
          <Card className="rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-amber-500/20 hover:scale-[1.01] transition-transform cursor-pointer">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-700">মোট বাকি</span>
                <Users className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">
                ৳{overview?.totalDue ?? 0}
              </div>
              <div className="text-[11px] text-amber-700/80 mt-0.5">পাওনা টাকা</div>
            </CardContent>
          </Card>
        </Link>

        {/* 4. কম স্টক */}
        <Link href="/app/inventory">
          <Card className={cn(
            "rounded-2xl border transition-all cursor-pointer hover:scale-[1.01]",
            (overview?.lowStockCount ?? 0) > 0
              ? "bg-gradient-to-br from-rose-500/15 to-rose-500/5 border-rose-500/30"
              : "bg-muted/30 border-border"
          )}>
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-xs font-semibold",
                  (overview?.lowStockCount ?? 0) > 0 ? "text-rose-700" : "text-muted-foreground"
                )}>কম স্টক</span>
                <AlertTriangle className={cn(
                  "h-4 w-4",
                  (overview?.lowStockCount ?? 0) > 0 ? "text-rose-600" : "text-muted-foreground"
                )} />
              </div>
              <div className={cn(
                "text-2xl sm:text-3xl font-extrabold",
                (overview?.lowStockCount ?? 0) > 0 ? "text-rose-700" : "text-foreground"
              )}>
                {overview?.lowStockCount ?? 0} টি
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {(overview?.lowStockCount ?? 0) > 0 ? "পুনরায় কিনতে হবে" : "পর্যাপ্ত স্টক আছে"}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Big Action Buttons — the most important UI for Shopkeeper */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          দ্রুত কাজ শুরু করুন
        </p>
        <div className="grid grid-cols-2 gap-3">
          {category.quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href}>
                <div
                  className={cn(
                    "rounded-2xl p-5 h-28 flex flex-col justify-between cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all",
                    action.className
                  )}
                >
                  <Icon className="h-7 w-7" />
                  <div>
                    <div className="font-extrabold text-sm leading-tight">{action.label}</div>
                    <div className="text-xs opacity-75 leading-tight mt-0.5">{action.sublabel}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Barcode Scanner Shortcut */}
      {category.features.hasBarcode && (
        <Link href="/app/billing">
          <div className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/15 text-primary">
                <Scan className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-foreground">বারকোড স্ক্যান করুন</div>
                <div className="text-xs text-muted-foreground">বিলিং পেজে সরাসরি যান</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      )}

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              স্টক শেষের দিকে — {overview?.lowStockCount ?? 0} টি পণ্য
            </CardTitle>
            <Link href="/app/inventory" className="text-xs text-primary hover:underline flex items-center gap-1">
              দেখুন <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1.5">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground truncate max-w-[60%]">{p.name}</span>
                  <span className="text-xs text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded-lg">
                    স্টক: {p.stock} {p.unit}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Cash Drawer Status */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ড্রয়ারে থাকার কথা</div>
              <div className="text-xl font-extrabold text-foreground">
                ৳{cashboxState?.expectedClosing ?? 0}
              </div>
            </div>
          </div>
          <Link href="/app/cashbox">
            <div className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
              বিস্তারিত <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Shift Clock */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
        <Clock className="h-3.5 w-3.5" />
        <span>
          {new Date().toLocaleDateString("bn-BD", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  )
}
