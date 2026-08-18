import { useState } from "react"
import { useUser } from "@clerk/react"
import { Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

// One-time gate shown right after signup to collect the two extra bits of
// info the greeting needs: the shopkeeper's own name and the shop's name.
// Stored on Clerk's unsafeMetadata (no DB migration needed) so it's
// available instantly on every future sign-in.
export function ShopOnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const { toast } = useToast()
  const [displayName, setDisplayName] = useState("")
  const [shopName, setShopName] = useState("")
  const [saving, setSaving] = useState(false)

  if (!isLoaded || !user) return null

  const metadata = user.unsafeMetadata as { displayName?: string; shopName?: string } | undefined
  const needsOnboarding = !metadata?.shopName

  if (!needsOnboarding) return <>{children}</>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopName.trim()) return
    setSaving(true)
    try {
      await user.update({
        unsafeMetadata: {
          ...metadata,
          displayName: displayName.trim() || user.firstName || "মামা",
          shopName: shopName.trim(),
        },
      })
    } catch {
      toast({ title: "সেভ করতে সমস্যা হয়েছে, আবার চেষ্টা করুন", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card border border-card-border rounded-2xl shadow-lg p-6 space-y-5">
        <div className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">স্বাগতম, দোকানদার মামা!</h1>
          <p className="text-sm text-muted-foreground">শুরু করার আগে দুটো তথ্য দিন</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>আপনার নাম</Label>
            <Input
              placeholder="যেমন: শুভ"
              className="h-12 rounded-xl"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>দোকানের নাম *</Label>
            <Input
              required
              placeholder="যেমন: রহমান স্টোর"
              className="h-12 rounded-xl"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving || !shopName.trim()} className="w-full h-12 rounded-xl font-bold">
            {saving ? "সেভ হচ্ছে..." : "শুরু করুন"}
          </Button>
        </form>
      </div>
    </div>
  )
}
