import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useShopTheme } from "@/context/shop-theme-context"
import { Sparkles, Check, Crown, ShieldAlert, CreditCard, Clock } from "lucide-react"

interface PlanInfo {
  id: string
  name: string
  price: number | null
  features: string[]
}

interface SubscriptionResponse {
  plans: PlanInfo[]
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

export function SubscriptionsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { activeShop } = useShopTheme()

  const { data, isLoading } = useQuery<SubscriptionResponse>({
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
      toast({ title: `✓ ${planId.toUpperCase()} প্ল্যান নির্বাচন সফল হয়েছে` })
    },
    onError: (err: any) => {
      toast({ title: err.message || "সমস্যা হয়েছে", variant: "destructive" })
    },
  })

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        সাবস্ক্রিপশন বিবরণ লোড হচ্ছে...
      </div>
    )
  }

  const currentPlanId = data?.currentPlan || "free"

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Crown className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            দোকاندار মামা সাবস্ক্রিপশন প্ল্যান
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
          আপনার ব্যবসার জন্য সেরা প্ল্যান বেছে নিন
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          আপনার প্রয়োজন অনুযায়ী যেকোনো সময় প্ল্যান পরিবর্তন বা আপগ্রেড করুন
        </p>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {data?.plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const isPopular = plan.id === "premium"

          return (
            <Card
              key={plan.id}
              className={`rounded-3xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                isCurrent
                  ? "border-primary bg-primary/5 shadow-md"
                  : isPopular
                  ? "border-amber-500/50 bg-amber-500/5 shadow-sm"
                  : "border-border bg-card"
              }`}
            >
              {isPopular && (
                <div className="bg-amber-500 text-white text-[10px] font-bold text-center py-1 uppercase tracking-wider">
                  ★ সর্বাধিক জনপ্রিয়
                </div>
              )}
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between gap-1">
                  <CardTitle className="text-base font-bold">{plan.name}</CardTitle>
                  {isCurrent && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                      বর্তমান
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  {plan.price === 0 ? (
                    <span className="text-2xl font-extrabold text-foreground">ফ্রি</span>
                  ) : plan.price === null ? (
                    <span className="text-lg font-bold text-foreground">কাস্টম</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-foreground">৳{plan.price}</span>
                      <span className="text-xs text-muted-foreground">/মাস</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4 flex-1 flex flex-col justify-between">
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  disabled={isCurrent || selectPlanMutation.isPending}
                  onClick={() => selectPlanMutation.mutate(plan.id)}
                  variant={isCurrent ? "outline" : isPopular ? "default" : "secondary"}
                  className="w-full rounded-xl font-bold h-9 text-xs"
                >
                  {isCurrent ? "চালু আছে" : "নির্বাচন করুন"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Subscription History */}
      {data?.history && data.history.length > 0 && (
        <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">সাবস্ক্রিপশন ইতিহাস</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-2">
              {data.history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="uppercase font-mono">
                      {item.plan}
                    </Badge>
                    <span className="text-muted-foreground">
                      শুরু: {new Date(item.startedAt).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                  <Badge
                    className={
                      item.status === "active"
                        ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
