import { useEffect, useState } from "react"
import { useUser } from "@clerk/react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  useGetCurrentShop,
  useUpdateCurrentShop,
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
  QrCode,
  SlidersHorizontal,
} from "lucide-react"

const ALL_PAYMENT_METHODS = [
  { id: "bkash", name: "bKash / বিকাশ", color: "#d12053", desc: "বিকাশ মার্চেন্ট বা পার্সোনাল নম্বর" },
  { id: "nagad", name: "Nagad / নগদ", color: "#f7941d", desc: "নগদ একাউন্ট বা ক্যাশ-ইন" },
  { id: "rocket", name: "Rocket / রকেট", color: "#8c3494", desc: "ডাচ-বাংলা রকেট ওয়ালেট" },
  { id: "upay", name: "Upay / উপায়", color: "#ffc800", desc: "ইউসিবি উপায় মোবাইল ওয়ালেট" },
  { id: "card", name: "Card / কার্ড POS", color: "#2563eb", desc: "ভিসা / মাস্টারকার্ড POS মেশিন" },
  { id: "qr", name: "Bangla QR / কিউআর", color: "#059669", desc: "যেকোনো ব্যাংকের কিউআর স্ক্যান" },
]

export function ManagementPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { activeShop: selectedShop, allShops, switchShop } = useShopTheme()

  const { data: activeShop } = useGetCurrentShop()
  const updateShopMutation = useUpdateCurrentShop()

  // Shop Settings State
  const [shopName, setShopName] = useState(activeShop?.name || "")
  const [ownerName, setOwnerName] = useState(activeShop?.ownerName || "")
  const [area, setArea] = useState(activeShop?.area || "")

  // Enabled Payment Methods State
  const [enabledMethods, setEnabledMethods] = useState<string[]>(() => {
    return (activeShop as any)?.enabledPaymentMethods || ["bkash", "nagad"]
  })

  // A shop switch updates the API data; keep the profile form in sync with
  // that newly selected shop rather than showing the previous branch's data.
  useEffect(() => {
    if (!activeShop) return
    setShopName(activeShop.name || "")
    setOwnerName(activeShop.ownerName || "")
    setArea(activeShop.area || "")
    setEnabledMethods((activeShop as any).enabledPaymentMethods || ["bkash", "nagad"])
  }, [activeShop?.id])

  // Team Members Real API
  const { data: membersData = [], isLoading: isMembersLoading } = useQuery<
    Array<{ id: number; userId: string; name: string | null; role: "admin" | "manager" | "shopkeeper"; createdAt: string }>
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

  // Filter out admin/owner from staff list since owner is displayed in special top card
  const staffMembers = membersData.filter((m: any) => m.role !== "admin")

  const [newMemberName, setNewMemberName] = useState("")
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
              toast({ title: "পেমেন্ট মাধ্যম আপডেট করা হয়েছে" })
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
      toast({ title: "দোকানের নাম আবশ্যক", variant: "destructive" })
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
          toast({ title: "✓ দোকানের তথ্য সফলভাবে আপডেট হয়েছে" })
        },
        onError: (err: any) => {
          toast({ title: err?.message || "সংরক্ষণ করা যায়নি", variant: "destructive" })
        },
      }
    )
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberName.trim()) {
      toast({ title: "কর্মচারীর নাম লিখুন", variant: "destructive" })
      return
    }

    const userIdToUse = newMemberUserId.trim() || `staff_${Date.now()}`
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
          userId: userIdToUse,
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
      toast({ title: `✓ নতুন ${newMemberRole === "manager" ? "ম্যানেজার" : "বিক্রেতা"} যুক্ত হয়েছে` })
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
      toast({ title: "কর্মী টিম থেকে অপসারিত হয়েছে" })
    } catch (err: any) {
      toast({ title: err.message || "মুছে ফেলা সম্ভব হয়নি", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              মালিক ব্যবস্থাপনা প্যানেল (Owner Management)
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            টিম, ডিজিটাল পেমেন্ট ও দোকান সেটিংস
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            শুধুমাত্র দোকানের প্রধান মালিকের জন্য সংরক্ষিত নিয়ন্ত্রণ প্যানেল
          </p>
        </div>
      </div>

      {/* 1. Digital Payment Method Controls */}
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

      {/* 2. Team & Role Management */}
      <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">টিম ও কর্মচারী একাউন্ট ব্যবস্থাপনা</CardTitle>
              <CardDescription>
                ম্যানেজার ও বিক্রেতা (ক্যাশিয়ার) যোগ করুন — কর্মীরা নিজেদের পদ পরিবর্তন করতে পারবে না
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          {/* Add Member Form */}
          <form onSubmit={handleAddMember} className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
            <div className="font-bold text-xs text-foreground uppercase tracking-wider">
              + নতুন কর্মী যুক্ত করুন
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <Label className="text-xs font-semibold">ইউজার আইডি / ফোন / ইমেইল</Label>
                <Input
                  value={newMemberUserId}
                  onChange={(e) => setNewMemberUserId(e.target.value)}
                  placeholder="ইউজার আইডি বা মোবাইল নাম্বার"
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
                {isAddingMember ? "যোগ হচ্ছে..." : "টিমে যোগ করুন"}
              </Button>
            </div>
          </form>

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
              staffMembers.map((m: any) => (
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
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">{m.userId}</div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                    onClick={() => handleRemoveMember(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Shop Switcher */}
      {allShops.length > 1 && (
        <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
              <div>
                <CardTitle className="text-lg">দোকান / শাখা পরিবর্তন</CardTitle>
                <CardDescription>যে দোকানের তথ্য দেখতে বা পরিচালনা করতে চান সেটি বেছে নিন</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 grid gap-2 sm:grid-cols-2">
            {allShops.map((shop) => {
              const isSelected = shop.id === selectedShop?.id
              return (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => switchShop(shop.id)}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-colors ${isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/60"}`}
                >
                  <div>
                    <p className="font-bold text-sm">{shop.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{shop.area || "এলাকা দেওয়া হয়নি"}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </button>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* 4. Shop Profile Settings */}
      <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">দোকানের প্রোফাইল</CardTitle>
              <CardDescription>দোকানের নাম ও এলাকা পরিবর্তন করুন</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleSaveShopProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {updateShopMutation.isPending ? "সংরক্ষণ হচ্ছে..." : "প্রোফাইল সেভ করুন"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
