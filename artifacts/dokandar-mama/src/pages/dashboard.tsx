import { Link } from "wouter"
import { useUser } from "@clerk/react"
import {
  useGetDashboardOverview,
  useGetRestockSuggestions,
  useGetTopProducts,
  useListCustomers,
} from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

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

  const { data: overview, isLoading, error } = useGetDashboardOverview()
  const { data: restockSuggestions } = useGetRestockSuggestions()
  const { data: topProducts } = useGetTopProducts({ range: "week" })
  const { data: dueCustomers } = useListCustomers({ withDueOnly: true })

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
    </div>
  )
}
