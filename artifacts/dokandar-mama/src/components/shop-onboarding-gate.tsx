import { useState, useEffect } from "react"
import { useUser, useAuth } from "@clerk/react"
import { Store, CheckCircle2, UserPlus, KeyRound, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useCreateShop, useGetCurrentShop, getGetCurrentShopQueryKey, getListShopsQueryKey, customFetch } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { CATEGORY_LIST, type ShopCategoryId } from "@/lib/theme-config"
import { cn } from "@/lib/utils"

export function ShopOnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: currentShop, isLoading: isShopLoading } = useGetCurrentShop()
  const createShopMutation = useCreateShop()

  // Tab: 'create' (Owner) | 'join' (Staff / Manager)
  const [activeTab, setActiveTab] = useState<"create" | "join">("create")

  // Owner state
  const [displayName, setDisplayName] = useState("")
  const [shopName, setShopName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ShopCategoryId>("mudi")
  const [saving, setSaving] = useState(false)

  // Staff join state
  const [inviteCode, setInviteCode] = useState("")
  const [joining, setJoining] = useState(false)

  // Track successful join so we can pass through immediately while queries refresh
  const [justJoined, setJustJoined] = useState(false)

  // Auto-detect invite code from URL if present (?invite=INV-XXXXXX)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const codeFromUrl = params.get("invite") || params.get("code")
      if (codeFromUrl) {
        const clean = codeFromUrl.trim().toUpperCase()
        setInviteCode(clean)
        setActiveTab("join")
      }
    }
  }, [])

  if (!isLoaded || !user) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 animate-pulse text-primary font-bold">
          দ
        </div>
        <div className="text-sm font-bold text-foreground">ব্যবহারকারী লোড হচ্ছে...</div>
      </div>
    )
  }

  const metadata = user.unsafeMetadata as { displayName?: string; shopName?: string; shopCategory?: string } | undefined

  if (isShopLoading && !metadata?.shopName) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 animate-pulse text-primary font-bold">
          দ
        </div>
        <div className="text-sm font-bold text-foreground">দোকানের তথ্য যাচাই করা হচ্ছে...</div>
      </div>
    )
  }

  const needsOnboarding = !justJoined && !metadata?.shopName && (!currentShop || !currentShop.shop)

  if (!needsOnboarding) return <>{children}</>

  // 1. Handle Owner Creating New Shop
  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopName.trim()) return
    setSaving(true)
    try {
      const ownerDisplayName = displayName.trim() || user.firstName || "মামা"
      // Create shop in backend DB
      try {
        await createShopMutation.mutateAsync({
          data: {
            name: shopName.trim(),
            category: selectedCategory as any,
            ownerName: ownerDisplayName,
          },
        })
        queryClient.invalidateQueries({ queryKey: getGetCurrentShopQueryKey() })
        queryClient.invalidateQueries({ queryKey: getListShopsQueryKey() })
      } catch (err) {
        console.warn("Backend shop creation notice (fallback to metadata)", err)
      }

      // Save metadata to Clerk
      await user.update({
        unsafeMetadata: {
          ...metadata,
          displayName: ownerDisplayName,
          shopName: shopName.trim(),
          shopCategory: selectedCategory,
        },
      })

      toast({ title: "স্বাগতম! আপনার দোকান প্রস্তুত হয়েছে।" })
    } catch {
      toast({ title: "সেভ করতে সমস্যা হয়েছে, আবার চেষ্টা করুন", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  // 2. Handle Staff / Manager Joining an Existing Shop via Invite Code
  const handleJoinShop = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = inviteCode.trim().toUpperCase()
    if (!cleanCode) {
      toast({ title: "অনুগ্রহ করে ইনভাইট কোড দিন", variant: "destructive" })
      return
    }

    setJoining(true)
    try {
      // Get the Clerk session token to authenticate the request on mobile
      // (mobile WebViews don't send session cookies, so we use Bearer auth)
      const token = await getToken()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const res = await fetch("/api/shops/join", {
        method: "POST",
        headers,
        body: JSON.stringify({ inviteCode: cleanCode }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "ইনভাইট কোড যাচাই করা যায়নি")
      }

      // Update Clerk user metadata with assigned shop
      if (data.shop) {
        await user.update({
          unsafeMetadata: {
            ...metadata,
            shopName: data.shop.name,
            shopCategory: data.shop.category,
            role: data.role,
          },
        }).catch(() => {})
      }

      // Mark as joined immediately so the gate passes through while queries refresh
      setJustJoined(true)

      // Refresh query cache in the background
      await queryClient.refetchQueries({ queryKey: getGetCurrentShopQueryKey() })
      queryClient.invalidateQueries({ queryKey: getListShopsQueryKey() })

      toast({
        title: "✓ সফলভাবে যুক্ত হয়েছেন!",
        description: data.message || "দোকানের ড্যাশবোর্ডে স্বাগতম।",
      })
    } catch (err: any) {
      toast({
        title: "যুক্ত হতে সমস্যা হয়েছে",
        description: err.message || "ইনভাইট কোড সঠিক কি না যাচাই করে আবার চেষ্টা করুন।",
        variant: "destructive",
      })
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-xl bg-card border border-card-border rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 text-primary">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">স্বাগতম, দোকানদার মামা!</h1>
          <p className="text-sm text-muted-foreground">আপনার দোকান শুরু করুন অথবা কর্মী হিসেবে যুক্ত হন</p>
        </div>

        {/* Tab Selection: Owner vs Staff */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm transition-all",
              activeTab === "create"
                ? "bg-card text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="h-4 w-4" />
            দোকানের মালিক
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("join")}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm transition-all",
              activeTab === "join"
                ? "bg-card text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserPlus className="h-4 w-4" />
            দোকানদার / ম্যানেজার
          </button>
        </div>

        {/* Tab 1: Owner Creates Shop */}
        {activeTab === "create" && (
          <form onSubmit={handleCreateShop} className="space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">আপনার নাম (মালিক)</Label>
                <Input
                  placeholder="যেমন: শুভ"
                  className="h-11 rounded-xl"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">দোকানের নাম *</Label>
                <Input
                  required
                  placeholder="যেমন: রহমান জেনারেল স্টোর"
                  className="h-11 rounded-xl font-medium"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold block">আপনার দোকানের ধরন বেছে নিন</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1 border rounded-2xl bg-muted/20">
                {CATEGORY_LIST.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "flex flex-col items-start p-3 rounded-xl border text-left transition-all relative",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border/60 hover:bg-muted/80 bg-card text-foreground",
                      )}
                    >
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />
                      )}
                      <Icon className={cn("h-5 w-5 mb-1.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <span className="font-bold text-xs leading-tight">{cat.displayNameBn}</span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{cat.name.split("/")[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving || !shopName.trim()}
              className="w-full h-12 rounded-xl font-bold text-base shadow-md hover:scale-[1.01] transition-transform"
            >
              {saving ? "দোকান তৈরি হচ্ছে..." : "নতুন দোকান শুরু করুন"}
            </Button>
          </form>
        )}

        {/* Tab 2: Staff / Manager Joins via Invite Code */}
        {activeTab === "join" && (
          <form onSubmit={handleJoinShop} className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-sm text-foreground space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-primary">
                <KeyRound className="h-4 w-4" />
                মালিকের দেওয়া ইনভাইট কোড
              </div>
              <p className="text-xs text-muted-foreground">
                দোকানের মালিক আপনাকে যে ৬ সংখ্যার ইনভাইট কোড দিয়েছেন (যেমন: <strong>INV-849201</strong> বা <strong>849201</strong>), তা নিচে লিখুন।
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">ইনভাইট কোড (Invite Code) *</Label>
              <Input
                required
                placeholder="যেমন: INV-849201"
                className="h-12 rounded-xl text-center text-lg font-mono uppercase tracking-widest font-bold"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              />
            </div>

            <Button
              type="submit"
              disabled={joining || !inviteCode.trim()}
              className="w-full h-12 rounded-xl font-bold text-base shadow-md hover:scale-[1.01] transition-transform"
            >
              {joining ? "যাচাই করা হচ্ছে..." : "দোকানে যুক্ত হন"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
