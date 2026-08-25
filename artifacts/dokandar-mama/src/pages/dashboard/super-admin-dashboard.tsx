import { Link } from "wouter"
import { useUser } from "@clerk/react"
import {
  useListShops,
} from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ShieldAlert,
  Building2,
  Users,
  Store,
  BarChart3,
  Activity,
  Settings,
  Crown,
  Globe,
  ChevronRight,
  Layers,
  Package,
  TrendingUp,
  Sparkles,
  Server,
  BadgeCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const PLATFORM_NAV = [
  { href: "/app", label: "ব্যবসা তালিকা", sublabel: "সব নিবন্ধিত দোকান", icon: Store, color: "bg-blue-600" },
  { href: "/app/reports", label: "প্ল্যাটফর্ম অ্যানালিটিক্স", sublabel: "রেভিনিউ ও গ্রোথ", icon: BarChart3, color: "bg-violet-600" },
  { href: "/app/customers", label: "সকল ব্যবহারকারী", sublabel: "ইউজার ম্যানেজমেন্ট", icon: Users, color: "bg-emerald-600" },
  { href: "/app/inventory", label: "ক্যাটাগরি ম্যানেজমেন্ট", sublabel: "শপ টাইপ কনফিগ", icon: Layers, color: "bg-amber-600" },
] as const

const CATEGORY_STATS = [
  { label: "মুদি / গ্রোসারি", count: "—", color: "text-amber-600" },
  { label: "ফার্মেসি", count: "—", color: "text-emerald-600" },
  { label: "ক্লোদিং", count: "—", color: "text-purple-600" },
  { label: "ইলেকট্রনিক্স", count: "—", color: "text-blue-600" },
  { label: "কসমেটিকস", count: "—", color: "text-pink-600" },
  { label: "অন্যান্য", count: "—", color: "text-slate-600" },
]

export function SuperAdminDashboard() {
  const { user } = useUser()
  const { data: allShops } = useListShops()

  const displayName = user?.firstName || "Admin"
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"

  const totalShops = Array.isArray(allShops) ? allShops.length : 0

  // Group shops by category
  const shopsByCategory = Array.isArray(allShops)
    ? allShops.reduce<Record<string, number>>((acc, s: any) => {
        const cat = s.category || "other"
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {})
    : {}

  const subscriptionCounts = Array.isArray(allShops)
    ? allShops.reduce<Record<string, number>>((acc, s: any) => {
        const plan = s.subscriptionPlan || "basic"
        acc[plan] = (acc[plan] || 0) + 1
        return acc
      }, {})
    : {}

  return (
    <div className="space-y-6">
      {/* Super Admin Header — visually distinct dark/professional feel */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 text-white p-6 shadow-2xl">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-violet-500 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-radial from-blue-500 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/40 text-xs px-3">
              Platform Super Admin
            </Badge>
          </div>

          <h2 className="text-3xl font-bold text-white">{timeGreeting}, {displayName}!</h2>
          <p className="text-slate-400 mt-1">দোকানদার মামা প্ল্যাটফর্মের সম্পূর্ণ নিয়ন্ত্রণ</p>

          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="text-2xl font-extrabold text-white">{totalShops}</div>
              <div className="text-xs text-slate-400 mt-0.5">মোট শপ</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="text-2xl font-extrabold text-emerald-400">{subscriptionCounts.premium || 0}</div>
              <div className="text-xs text-slate-400 mt-0.5">প্রিমিয়াম</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="text-2xl font-extrabold text-amber-400">{subscriptionCounts.organization || 0}</div>
              <div className="text-xs text-slate-400 mt-0.5">চেইন শপ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Quick Nav */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">প্ল্যাটফর্ম ম্যানেজমেন্ট</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PLATFORM_NAV.map((nav) => {
            const Icon = nav.icon
            return (
              <Link key={nav.href} href={nav.href}>
                <div className={cn(
                  "rounded-2xl p-4 h-24 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-white",
                  nav.color
                )}>
                  <Icon className="h-6 w-6" />
                  <div>
                    <div className="font-bold text-sm leading-tight">{nav.label}</div>
                    <div className="text-xs opacity-75 mt-0.5">{nav.sublabel}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Shops by Subscription Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-violet-600" />
              সাবস্ক্রিপশন ব্রেকডাউন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { key: "basic", label: "বেসিক", color: "bg-slate-100 text-slate-700" },
                { key: "standard", label: "স্ট্যান্ডার্ড", color: "bg-blue-100 text-blue-700" },
                { key: "premium", label: "প্রিমিয়াম", color: "bg-violet-100 text-violet-700" },
                { key: "organization", label: "অর্গানাইজেশন (চেইন)", color: "bg-amber-100 text-amber-700" },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-lg", color)}>{label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{subscriptionCounts[key] || 0} টি শপ</span>
                </div>
              ))}
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">মোট</span>
                <span className="text-sm font-extrabold text-primary">{totalShops} টি শপ</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shops by Category */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              শপ ক্যাটাগরি ব্রেকডাউন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(shopsByCategory).length > 0 ? (
                Object.entries(shopsByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 6)
                  .map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground capitalize">{cat.replace("_", " ")}</span>
                      <span className="text-xs text-muted-foreground font-semibold">{count} টি</span>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">কোনো শপ নেই</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Shops */}
      {Array.isArray(allShops) && allShops.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              সাম্প্রতিক নিবন্ধিত শপ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(allShops as any[]).slice(0, 5).map((shop: any) => (
                <div key={shop.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Store className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{shop.name}</div>
                      <div className="text-[10px] text-muted-foreground">{shop.category} · {shop.area || "এলাকা নেই"}</div>
                    </div>
                  </div>
                  <Badge className="text-[10px] bg-muted text-muted-foreground border-0">
                    {shop.subscriptionPlan}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health */}
      <Card className="rounded-2xl border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-700">
            <Server className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-emerald-800 dark:text-emerald-400">সিস্টেম স্বাভাবিক চলছে</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">API, ডেটাবেস ও সার্ভার স্বাস্থ্যকর</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">Online</span>
          </div>
        </CardContent>
      </Card>

      {/* Admin Note */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
        <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Super Admin মোডে আছেন</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
            আপনি প্ল্যাটফর্মের সব ডেটা দেখতে এবং পরিচালনা করতে পারছেন। সতর্কতার সাথে কাজ করুন।
          </p>
        </div>
      </div>
    </div>
  )
}
