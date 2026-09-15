import { useEffect, useState } from "react"
import { useUser } from "@clerk/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  useGetCurrentShop,
  useUpdateCurrentShop,
  useCreateShop,
  useGetSalesSummary,
  useGetTopProducts,
  useGetRestockSuggestions,
  getGetCurrentShopQueryKey,
  getListShopsQueryKey,
} from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useShopTheme } from "@/context/shop-theme-context"
import { useLanguage } from "@/context/language-context"
import { CATEGORY_LIST, type ShopCategoryId } from "@/lib/theme-config"
import {
  Crown,
  Shield,
  Users,
  CreditCard,
  Store,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Building2,
  Sparkles,
  Smartphone,
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  SlidersHorizontal,
  Check,
  Clock,
  Briefcase,
  Layers,
} from "lucide-react"

const ALL_PAYMENT_METHODS = [
  { id: "bkash", name: "bKash / বিকাশ", color: "#d12053", desc: "বিকাশ মার্চেন্ট বা পার্সোনাল নম্বর" },
  { id: "nagad", name: "Nagad / নগদ", color: "#f7941d", desc: "নগদ একাউন্ট বা ক্যাশ-ইন" },
  { id: "rocket", name: "Rocket / রকেট", color: "#8c3494", desc: "ডাচ-বাংলা রকেট ওয়ালেট" },
  { id: "upay", name: "Upay / উপায়", color: "#ffc800", desc: "ইউসিবি উপায় মোবাইল ওয়ালেট" },
  { id: "card", name: "Card / কার্ড POS", color: "#2563eb", desc: "ভিসা / মাস্টারকার্ড POS মেশিন" },
  { id: "qr", name: "Bangla QR / কিউআর", color: "#059669", desc: "যেকোনো ব্যাংকের কিউআর স্ক্যান" },
]

type TabId = "overview" | "shops" | "team" | "reports" | "subscription"
type RangeType = "today" | "week" | "month"

interface SubscriptionResponse {
  plans: Array<{
    id: string
    name: string
    price: number | null
    features: string[]
  }>
  currentPlan: string
  role: string
  history: Array<{
    id: number
    plan: string
    status: string
    startedAt: string
    expiresAt: string | null
  }>
}

export function ManagementPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { activeShop: selectedShop, allShops, switchShop, isOwner } = useShopTheme()
  const { language, t } = useLanguage()

  // Tab State (read initial tab from URL query params if provided)
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const params = new URLSearchParams(window.location.search)
    const initial = params.get("tab") as TabId
    if (["overview", "shops", "team", "reports", "subscription"].includes(initial)) {
      return initial
    }
    return "overview"
  })

  const { data: currentShopData } = useGetCurrentShop()
  const activeShop = currentShopData?.shop
  const updateShopMutation = useUpdateCurrentShop()
  const createShopMutation = useCreateShop()

  // Shop Settings State
  const [shopName, setShopName] = useState(activeShop?.name || "")
  const [ownerName, setOwnerName] = useState(activeShop?.ownerName || "")
  const [area, setArea] = useState(activeShop?.area || "")

  // Enabled Payment Methods State
  const [enabledMethods, setEnabledMethods] = useState<string[]>(() => {
    return (activeShop as any)?.enabledPaymentMethods || ["bkash", "nagad"]
  })

  // Add New Shop Form State
  const [newShopName, setNewShopName] = useState("")
  const [newShopCategory, setNewShopCategory] = useState<ShopCategoryId>("mudi")
  const [newShopArea, setNewShopArea] = useState("")
  const [isCreatingShop, setIsCreatingShop] = useState(false)

  // Reports State
  const [reportRange, setReportRange] = useState<RangeType>("week")
  const { data: summary } = useGetSalesSummary({ range: reportRange })
  const { data: topProducts } = useGetTopProducts({ range: reportRange })
  const { data: restockInfo } = useGetRestockSuggestions()

  // Subscription Query & Mutation
  const { data: subData, isLoading: isSubLoading } = useQuery<SubscriptionResponse>({
    queryKey: ["subscription-info", activeShop?.id],
    queryFn: async () => {
      const res = await fetch("/api/subscription", {
        headers: {
          ...(activeShop?.id ? { "x-shop-id": String(activeShop.id) } : {}),
        },
      })
      if (!res.ok) throw new Error("সাবস্ক্রিপশন তথ্য লোড করা যায়নি")
      return res.json()
    },
    enabled: !!activeShop?.id,
  })

  const selectPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(activeShop?.id ? { "x-shop-id": String(activeShop.id) } : {}),
        },
        body: JSON.stringify({ plan: planId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "প্ল্যান পরিবর্তন করা যায়নি")
      }
      return res.json()
    },
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: ["subscription-info", activeShop?.id] })
      toast({ title: `✓ ${planId.toUpperCase()} ${language === "en" ? "plan selected successfully" : "প্ল্যান নির্বাচন সফল হয়েছে"}` })
    },
    onError: (err: any) => {
      toast({ title: err.message || "সমস্যা হয়েছে", variant: "destructive" })
    },
  })

  useEffect(() => {
    if (!activeShop) return
    setShopName(activeShop.name || "")
    setOwnerName(activeShop.ownerName || "")
    setArea(activeShop.area || "")
    setEnabledMethods((activeShop as any).enabledPaymentMethods || ["bkash", "nagad"])
  }, [activeShop?.id])

  // Team Members Real API
  const { data: membersData = [], isLoading: isMembersLoading } = useQuery<
    Array<{
      id: number
      userId: string
      email?: string | null
      name: string | null
      role: "admin" | "manager" | "shopkeeper"
      status?: "active" | "pending" | "revoked" | "expired"
      invitedBy?: string | null
      createdAt: string
    }>
  >({
    queryKey: ["shop-members", activeShop?.id],
    queryFn: async () => {
      const res = await fetch("/api/shops/current/members", {
        headers: {
          ...(activeShop?.id ? { "x-shop-id": String(activeShop.id) } : {}),
        },
      })
      if (!res.ok) throw new Error("Failed to load members")
      return res.json()
    },
    enabled: !!activeShop?.id,
  })

  const staffMembers = membersData.filter((m: any) => m.role !== "admin")

  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberUserId, setNewMemberUserId] = useState("")
  const [newMemberRole, setNewMemberRole] = useState<"manager" | "shopkeeper">("shopkeeper")
  const [isAddingMember, setIsAddingMember] = useState(false)

  const togglePaymentMethod = (methodId: string) => {
    setEnabledMethods((prev) => {
      const next = prev.includes(methodId)
        ? prev.filter((m) => m !== methodId)
        : [...prev, methodId]
      if (activeShop?.id) {
        updateShopMutation.mutate(
          {
            data: {
              enabledPaymentMethods: next,
            } as any,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getGetCurrentShopQueryKey() })
              queryClient.invalidateQueries({ queryKey: getListShopsQueryKey() })
              toast({ title: language === "en" ? "Payment channels updated" : "পেমেন্ট মাধ্যম আপডেট করা হয়েছে" })
            },
          }
        )
      }
      return next
    })
  }

  const handleSaveShopProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopName.trim()) {
      toast({ title: language === "en" ? "Shop name is required" : "দোকানের নাম আবশ্যক", variant: "destructive" })
      return
    }
    updateShopMutation.mutate(
      {
        data: {
          name: shopName.trim(),
          ownerName: ownerName.trim() || undefined,
          area: area.trim() || undefined,
        } as any,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentShopQueryKey() })
          queryClient.invalidateQueries({ queryKey: getListShopsQueryKey() })
          toast({ title: language === "en" ? "✓ Shop profile saved" : "✓ দোকানের তথ্য সফলভাবে আপডেট হয়েছে" })
        },
        onError: (err: any) => {
          toast({ title: err?.message || "সংরক্ষণ করা যায়নি", variant: "destructive" })
        },
      }
    )
  }

  const handleCreateNewShop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newShopName.trim()) {
      toast({ title: language === "en" ? "Enter shop name" : "নতুন দোকানের নাম দিন", variant: "destructive" })
      return
    }
    setIsCreatingShop(true)
    try {
      await createShopMutation.mutateAsync({
        data: {
          name: newShopName.trim(),
          category: newShopCategory,
          ownerName: ownerName || user?.firstName || "দোকান মালিক",
          area: newShopArea.trim() || undefined,
        },
      })
      queryClient.invalidateQueries({ queryKey: getGetCurrentShopQueryKey() })
      queryClient.invalidateQueries({ queryKey: getListShopsQueryKey() })
      setNewShopName("")
      setNewShopArea("")
      toast({ title: language === "en" ? "✓ New shop created successfully" : "✓ নতুন দোকান সফলভাবে খোলা হয়েছে" })
    } catch (err: any) {
      toast({ title: err.message || "দোকান তৈরি সম্ভব হয়নি", variant: "destructive" })
    } finally {
      setIsCreatingShop(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberName.trim()) {
      toast({ title: language === "en" ? "Enter staff name" : "কর্মচারীর নাম লিখুন", variant: "destructive" })
      return
    }
    if (!newMemberUserId.trim() && !newMemberEmail.trim()) {
      toast({ title: language === "en" ? "Provide email or User ID" : "ইমেইল অথবা ইউজার আইডি লিখুন", variant: "destructive" })
      return
    }

    setIsAddingMember(true)
    try {
      const res = await fetch("/api/shops/current/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(activeShop?.id ? { "x-shop-id": String(activeShop.id) } : {}),
        },
        body: JSON.stringify({
          name: newMemberName.trim(),
          userId: newMemberUserId.trim() || undefined,
          email: newMemberEmail.trim() || undefined,
          role: newMemberRole,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "কর্মী যোগ করা যায়নি")
      }

      queryClient.invalidateQueries({ queryKey: ["shop-members", activeShop?.id] })
      setNewMemberName("")
      setNewMemberUserId("")
      setNewMemberEmail("")
      toast({ title: `✓ ${language === "en" ? "Invitation sent" : "ইনভাইট পাঠানো হয়েছে"}` })
    } catch (err: any) {
      toast({ title: err.message || "কর্মী যুক্ত করতে সমস্যা হয়েছে", variant: "destructive" })
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveMember = async (id: number) => {
    try {
      const res = await fetch(`/api/shops/current/members/${id}`, {
        method: "DELETE",
        headers: {
          ...(activeShop?.id ? { "x-shop-id": String(activeShop.id) } : {}),
        },
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "মুছে ফেলা যায়নি")
      }
      queryClient.invalidateQueries({ queryKey: ["shop-members", activeShop?.id] })
      toast({ title: language === "en" ? "Staff removed" : "কর্মী টিম থেকে অপসারিত হয়েছে" })
    } catch (err: any) {
      toast({ title: err.message || "মুছে ফেলা সম্ভব হয়নি", variant: "destructive" })
    }
  }

  const handleExportCSV = () => {
    const sName = activeShop?.name || "DokandarMama_Shop"
    const dateStr = new Date().toISOString().split("T")[0]
    
    let csvContent = `data:text/csv;charset=utf-8,`
    csvContent += `Report: ${sName} - Sales Summary (${reportRange.toUpperCase()})\n`
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`
    csvContent += `Total Sales,Cash Sales,Due (Baki),Estimated Profit,Total Bills\n`
    csvContent += `${summary?.totalSales || 0},${summary?.cashTotal || 0},${summary?.bakiTotal || 0},${summary?.totalProfit || 0},${summary?.transactionCount || 0}\n\n`
    
    csvContent += `Top Selling Products\n`
    csvContent += `Rank,Product Name,Quantity Sold,Revenue\n`
    topProducts?.forEach((p, idx) => {
      csvContent += `${idx + 1},"${p.productName.replace(/"/g, '""')}",${p.quantitySold},${p.revenue}\n`
    })
    
    csvContent += `\nRestock Suggestions\n`
    csvContent += `Product Name,Current Stock,Threshold,Reason\n`
    restockInfo?.forEach((r) => {
      csvContent += `"${r.productName.replace(/"/g, '""')}",${r.stock},${r.lowStockThreshold},"${r.reason.replace(/"/g, '""')}"\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${sName}_Report_${reportRange}_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Crown className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            {language === "en" ? "Dokandar Mama Shop Hub" : "দোকানদার মামা শপ ম্যানেজমেন্ট"}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
          {t("mgnt.title", "দোকান ও ব্যবসা ব্যবস্থাপনা")}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("mgnt.subtitle", "দোকান সেটিংস, টিম, বেচাকেনার রিপোর্ট ও সাবস্ক্রিপশন নিয়ন্ত্রণ করুন")}
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-border gap-1 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
            activeTab === "overview"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Store className="h-4 w-4" />
          <span>{t("mgnt.tab.overview", "দোকান ওভারভিউ")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shops")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
            activeTab === "shops"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>{t("mgnt.tab.shops", "শাখা ও নতুন দোকান")}</span>
          {allShops.length > 1 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {allShops.length}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
            activeTab === "team"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>{t("mgnt.tab.team", "টিম ও রোল")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
            activeTab === "reports"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>{t("mgnt.tab.reports", "রিপোর্ট ও অ্যানালিটিক্স")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subscription")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${
            activeTab === "subscription"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Crown className="h-4 w-4" />
          <span>{t("mgnt.tab.subscription", "সাবস্ক্রিপশন")}</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Shop Profile Settings */}
          <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {language === "en" ? "Active Shop Profile" : "বর্তমান দোকানের প্রোফাইল"}
                  </CardTitle>
                  <CardDescription>
                    {language === "en" ? "Update shop name, owner name and location" : "দোকানের নাম, মালিকের নাম ও ঠিকানা পরিবর্তন করুন"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSaveShopProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">দোকানের নাম *</Label>
                    <Input
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="h-11 rounded-xl mt-1 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">মালিকের নাম</Label>
                    <Input
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="h-11 rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">এলাকা / ঠিকানা</Label>
                    <Input
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="যেমন: মিরপুর ১০, ঢাকা"
                      className="h-11 rounded-xl mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={updateShopMutation.isPending}
                    className="rounded-xl font-bold gap-2 h-11 px-6 shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    {updateShopMutation.isPending
                      ? language === "en" ? "Saving..." : "সংরক্ষণ হচ্ছে..."
                      : language === "en" ? "Save Profile" : "প্রোফাইল সেভ করুন"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Digital Payment Method Controls */}
          <Card className="rounded-3xl border-primary/20 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">ডিজিটাল পেমেন্ট চ্যানেল কনফিগারেশন</CardTitle>
                  <CardDescription>
                    যে মাধ্যমগুলো চালু করবেন, বিলিং পেজে শুধুমাত্র সেগুলোই ক্যাশিয়ারের জন্য প্রদর্শিত হবে
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {ALL_PAYMENT_METHODS.map((pm) => {
                  const isEnabled = enabledMethods.includes(pm.id)
                  return (
                    <div
                      key={pm.id}
                      onClick={() => togglePaymentMethod(pm.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                        isEnabled
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:bg-muted/40 opacity-70"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: pm.color }}
                          />
                          <span className="font-bold text-sm text-foreground">{pm.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{pm.desc}</p>
                      </div>
                      <div className="pt-0.5">
                        {isEnabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-primary-foreground">
                            চালু আছে
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border">
                            বন্ধ
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: SHOPS & BRANCHES */}
      {activeTab === "shops" && (
        <div className="space-y-6">
          {/* Active Shops List & Switcher */}
          <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">আপনার দোকান ও শাখা তালিকা</CardTitle>
                  <CardDescription>
                    প্রতিটি দোকান আলাদা ডেটা ও হিসাব ধারণ করে। সুইচে চাপ দিলে সকল তথ্য সাথে সাথে সেই দোকানের হয়ে যাবে।
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 grid gap-3 sm:grid-cols-2">
              {allShops.map((shop) => {
                const isSelected = shop.id === selectedShop?.id
                return (
                  <div
                    key={shop.id}
                    className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:bg-muted/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">{shop.name}</span>
                        {isSelected && (
                          <Badge className="bg-primary text-primary-foreground text-[10px]">
                            সক্রিয় (Active)
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {shop.area || "এলাকা দেওয়া হয়নি"} • ক্যাটাগরি: {shop.category || "General"}
                      </p>
                    </div>

                    {!isSelected && isOwner && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => switchShop(shop.id)}
                        className="rounded-xl font-bold gap-1 text-xs"
                      >
                        সুইচ করুন
                      </Button>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Add New Shop Form */}
          {isOwner && (
            <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">নতুন দোকান / শাখা খুলুন</CardTitle>
                    <CardDescription>
                      নতুন দোকানের ক্যাটাগরি নির্বাচন করুন — পণ্য ও বাকি আলাদাভাবে পরিচালিত হবে
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleCreateNewShop} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">দোকানের নাম *</Label>
                      <Input
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                        placeholder="যেমন: গ্রামীণ ফার্মেসি"
                        className="h-11 rounded-xl mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">দোকানের টাইপ / ক্যাটাগরি *</Label>
                      <select
                        value={newShopCategory}
                        onChange={(e) => setNewShopCategory(e.target.value as ShopCategoryId)}
                        className="w-full h-11 px-3 mt-1 rounded-xl border border-input bg-background text-sm font-medium outline-none"
                      >
                        {CATEGORY_LIST.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.displayNameBn} ({cat.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">ঠিকানা / এলাকা</Label>
                      <Input
                        value={newShopArea}
                        onChange={(e) => setNewShopArea(e.target.value)}
                        placeholder="যেমন: সাভার, ঢাকা"
                        className="h-11 rounded-xl mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isCreatingShop}
                      className="rounded-xl font-bold gap-2 h-11 px-6 shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      {isCreatingShop ? "তৈরি হচ্ছে..." : "+ নতুন দোকান যোগ করুন"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: TEAM & ROLES */}
      {activeTab === "team" && (
        <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">টিম ও কর্মচারী একাউন্ট ব্যবস্থাপনা</CardTitle>
                <CardDescription>
                  ম্যানেজার ও বিক্রেতা (ক্যাশিয়ার) ইনভাইট করুন — কর্মীরা নিজেদের পদ পরিবর্তন করতে পারবে না
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            {/* Add Member Form */}
            {isOwner && (
              <form onSubmit={handleAddMember} className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                <div className="font-bold text-xs text-foreground uppercase tracking-wider">
                  + নতুন কর্মী যুক্ত বা আমন্ত্রণ জানান
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">নাম *</Label>
                    <Input
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="যেমন: তানভীর হাসান"
                      className="h-10 rounded-xl mt-1 bg-background"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">ইমেইল (ইনভাইটেশন)</Label>
                    <Input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="staff@example.com"
                      className="h-10 rounded-xl mt-1 bg-background text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">ইউজার আইডি (অপশনাল)</Label>
                    <Input
                      value={newMemberUserId}
                      onChange={(e) => setNewMemberUserId(e.target.value)}
                      placeholder="user_..."
                      className="h-10 rounded-xl mt-1 bg-background font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">ভূমিকা / রোল</Label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as any)}
                      className="w-full h-10 px-3 mt-1 rounded-xl border border-input bg-background text-sm font-medium outline-none"
                    >
                      <option value="shopkeeper">বিক্রেতা / ক্যাশিয়ার (Shopkeeper)</option>
                      <option value="manager">দোকান ম্যানেজার (Manager)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={isAddingMember} className="rounded-xl font-bold gap-1.5 h-9">
                    <Plus className="h-4 w-4" />
                    {isAddingMember ? "যোগ হচ্ছে..." : "ইনভাইট পাঠান / টিমে যোগ করুন"}
                  </Button>
                </div>
              </form>
            )}

            {/* Members List */}
            <div className="space-y-2">
              <div className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                বর্তমান কর্মী তালিকা ({staffMembers.length + 1} জন)
              </div>

              {/* Owner Row */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    👑
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>{ownerName || user?.firstName || "দোকান মালিক"}</span>
                      <Badge className="bg-amber-500 text-white text-[10px]">প্রধান মালিক (Owner)</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress || "মালিকানা অধিকার সুরক্ষিত"}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700">সর্বোচ্চ এক্সেস</span>
              </div>

              {/* Staff Rows */}
              {isMembersLoading ? (
                <div className="p-4 text-center text-xs text-muted-foreground">কর্মী তালিকা লোড হচ্ছে...</div>
              ) : staffMembers.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-2xl">
                  কোনো অতিরিক্ত কর্মী যুক্ত নেই। ওপরের ফর্ম দিয়ে নতুন কর্মী যোগ করুন।
                </div>
              ) : (
                staffMembers.map((m: any) => {
                  const status = m.status || "active"
                  return (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center font-bold text-sm">
                          👤
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span>{m.name || "অজ্ঞাত কর্মী"}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {m.role === "manager" ? "ম্যানেজার" : "বিক্রেতা"}
                            </Badge>
                            <Badge
                              className={`text-[10px] ${
                                status === "active"
                                  ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                                  : status === "pending"
                                  ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                                  : "bg-rose-500/15 text-rose-600 border-rose-500/30"
                              }`}
                            >
                              {status === "active" ? "সক্রিয় (Active)" : status === "pending" ? "অপেক্ষমান (Pending)" : "বাতিল (Revoked)"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {m.email ? m.email : m.userId}
                          </div>
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleRemoveMember(m.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: REPORTS & ANALYTICS */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {language === "en" ? "Reports & Analytics" : "রিপোর্ট ও বিশ্লেষণ"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === "en" ? "Shop sales performance and financial summary" : "দোকানের বেচাকেনা ও আর্থিক খতিয়ান"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="rounded-xl font-bold gap-1.5 h-9 border-primary/20 hover:bg-primary/10 text-primary text-xs"
              >
                <Download className="h-4 w-4" />
                <span>{language === "en" ? "Export CSV" : "ডাউনলোড CSV"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.print()}
                className="rounded-xl font-bold gap-1.5 h-9 text-xs"
              >
                <Printer className="h-4 w-4" />
                <span>{language === "en" ? "Print" : "প্রিন্ট"}</span>
              </Button>

              <div className="flex bg-muted p-1 rounded-xl">
                <button
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    reportRange === "today" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setReportRange("today")}
                >
                  {language === "en" ? "Today" : "আজকে"}
                </button>
                <button
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    reportRange === "week" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setReportRange("week")}
                >
                  {language === "en" ? "This Week" : "এই সপ্তাহ"}
                </button>
                <button
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    reportRange === "month" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setReportRange("month")}
                >
                  {language === "en" ? "This Month" : "এই মাস"}
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-border">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground">মোট বিক্রি (Sales)</p>
                <p className="text-xl font-extrabold text-foreground mt-1">৳ {(summary?.totalSales || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{summary?.transactionCount || 0} টি মেমো</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground">ক্যাশ বিক্রি (Cash)</p>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">৳ {(summary?.cashTotal || 0).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground">বাকি জমা (Baki Due)</p>
                <p className="text-xl font-extrabold text-amber-600 mt-1">৳ {(summary?.bakiTotal || 0).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground">আনুমানিক লাভ (Profit)</p>
                <p className="text-xl font-extrabold text-primary mt-1">৳ {(summary?.totalProfit || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Products Table */}
          <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span>সবচেয়ে বেশি বিক্রি হওয়া পণ্যসমূহ</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-x-auto">
              {!topProducts || topProducts.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">কোনো বিক্রির তথ্য নেই</div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 px-2">#</th>
                      <th className="py-2 px-2">পণ্যের নাম</th>
                      <th className="py-2 px-2 text-right">বিক্রি পরিমাণ</th>
                      <th className="py-2 px-2 text-right">মোট বিক্রি টাকা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/40">
                        <td className="py-2.5 px-2 font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-2 font-semibold text-foreground">{p.productName}</td>
                        <td className="py-2.5 px-2 text-right font-bold">{p.quantitySold}</td>
                        <td className="py-2.5 px-2 text-right font-extrabold text-primary">৳ {p.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTION & FEATURES */}
      {activeTab === "subscription" && (
        <div className="space-y-6">
          <Card className="rounded-3xl border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-background to-background p-6 shadow-sm">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <Badge className="bg-amber-500 text-white text-xs mb-2">
                  বর্তমান প্ল্যান: {(subData?.currentPlan || "free").toUpperCase()}
                </Badge>
                <h3 className="text-xl font-extrabold text-foreground">
                  আপনার ব্যবসার জন্য সেরা সাবস্ক্রিপশন প্ল্যান
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  আনলিমিটেড প্রোডাক্ট, এআই ছোটু মামা ভয়েস অ্যাসিস্ট্যান্ট, একাধিক ক্যাশিয়ার ও অটো ব্যাকআপ সুবিধা পেতে আপগ্রেড করুন।
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-muted-foreground">অ্যাক্টিভ স্ট্যাটাস</span>
                <p className="text-sm font-extrabold text-emerald-600 flex items-center gap-1 justify-end mt-0.5">
                  <CheckCircle2 className="h-4 w-4" /> সক্রিয় (Active)
                </p>
              </div>
            </div>
          </Card>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(subData?.plans || [
              { id: "free", name: "ফ্রি (Starter)", price: 0, features: ["সর্বোচ্চ ৫০টি পণ্য", "১জন ব্যবহারকারী", "ছোটু ভয়েস অ্যাসিস্ট্যান্ট (বেসিক)"] },
              { id: "pro", name: "প্রো (Pro Shop)", price: 499, features: ["আনলিমিটেড প্রোডাক্ট", "৩জন পর্যন্ত স্টাফ / ক্যাশিয়ার", "অটোমেটিক বকেয়া এসএমএস", "অ্যাডভান্সড ছোটু এআই"] },
              { id: "enterprise", name: "এন্টারপ্রাইজ (Super Shop)", price: 999, features: ["আনলিমিটেড দোকান ও শাখা", "আনলিমিটেড স্টাফ", "লাইভ পিওএস বারকোড স্ক্যানার", "ব্যক্তিগত কাস্টমাইজড ছোটু"] },
            ]).map((plan) => {
              const isCurrent = plan.id === (subData?.currentPlan || "free")
              return (
                <Card
                  key={plan.id}
                  className={`rounded-3xl border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? "border-primary ring-2 ring-primary/20 shadow-md bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-extrabold flex items-center justify-between">
                      <span>{plan.name}</span>
                      {isCurrent && <Badge className="bg-primary text-primary-foreground text-[10px]">চলতি প্ল্যান</Badge>}
                    </CardTitle>
                    <div className="text-2xl font-black text-foreground mt-2">
                      {plan.price === 0 || plan.price === null ? "বিনামূল্যে" : `৳ ${plan.price} / মাস`}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-xs">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="text-muted-foreground">{feat}</span>
                        </div>
                      ))}
                    </div>

                    {isOwner && !isCurrent && (
                      <Button
                        type="button"
                        onClick={() => selectPlanMutation.mutate(plan.id)}
                        disabled={selectPlanMutation.isPending}
                        className="w-full rounded-xl font-bold h-10 mt-4"
                      >
                        {plan.id === "free" ? "ফ্রি সিলেক্ট করুন" : "আপগ্রেড করুন"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
