import { useState } from "react"
import { useUser } from "@clerk/react"
import { Store, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useCreateShop, useGetCurrentShop, getGetCurrentShopQueryKey, getListShopsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { CATEGORY_LIST, type ShopCategoryId } from "@/lib/theme-config"
import { cn } from "@/lib/utils"

export function ShopOnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: currentShop, isLoading: isShopLoading } = useGetCurrentShop()
  const createShopMutation = useCreateShop()

  const [displayName, setDisplayName] = useState("")
  const [shopName, setShopName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ShopCategoryId>("mudi")
  const [saving, setSaving] = useState(false)

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

  const needsOnboarding = !metadata?.shopName && (!currentShop || !currentShop.shop)

  if (!needsOnboarding) return <>{children}</>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopName.trim()) return
    setSaving(true)
    try {
      const ownerDisplayName = displayName.trim() || user.firstName || "মামা"
      // 1. Create shop in backend DB
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

      // 2. Save metadata to Clerk
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

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-xl bg-card border border-card-border rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 text-primary">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">স্বাগতম, দোকানদার মামা!</h1>
          <p className="text-sm text-muted-foreground">আপনার দোকানের ধরন ও নাম নির্বাচন করে সহজে শুরু করুন</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">আপনার নাম</Label>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1 border rounded-2xl bg-muted/20">
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
            {saving ? "দোকান তৈরি হচ্ছে..." : "দোকানদার মামা শুরু করুন"}
          </Button>
        </form>
      </div>
    </div>
  )
}

