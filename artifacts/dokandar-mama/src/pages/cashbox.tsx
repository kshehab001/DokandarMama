import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  useGetCashboxState,
  useOpenCashbox,
  useAddCashMovement,
  useCloseCashbox,
  useListCashSessions,
  getGetCashboxStateQueryKey,
  getListCashSessionsQueryKey,
  type CashMovementInputType,
} from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useShopTheme } from "@/context/shop-theme-context"
import { Wallet, ArrowDownCircle, ArrowUpCircle, Lock, Unlock, History, CreditCard, Smartphone, Coins } from "lucide-react"

const movementLabels: Record<string, string> = {
  sale: "ক্যাশ বিক্রি",
  expense: "খরচ",
  cash_in: "ক্যাশ জমা",
  cash_out: "ক্যাশ উত্তোলন",
}

function Money({ value }: { value: number | null | undefined }) {
  return <>৳ {Number(value ?? 0).toLocaleString("en-US")}</>
}

export function Cashbox() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { activeShop } = useShopTheme()

  const { data: state, isLoading } = useGetCashboxState()
  const { data: sessions } = useListCashSessions()

  // Digital Payment Summary query
  const { data: digitalSummary } = useQuery<{
    since: string
    totalDigital: number
    breakdown: Record<string, number>
    transactionCount: number
  }>({
    queryKey: ["cashbox-digital-summary", activeShop?.id],
    queryFn: async () => {
      const res = await fetch("/api/cashbox/digital-summary", {
        headers: {
          ...(activeShop?.id ? { "x-shop-id": String(activeShop.id) } : {}),
        },
      })
      if (!res.ok) return { since: "", totalDigital: 0, breakdown: {}, transactionCount: 0 }
      return res.json()
    },
  })

  const [openingBalance, setOpeningBalance] = useState("")
  const [movementType, setMovementType] = useState<CashMovementInputType>("expense")
  const [movementAmount, setMovementAmount] = useState("")
  const [movementNote, setMovementNote] = useState("")
  const [countedClosing, setCountedClosing] = useState("")
  const [closeNote, setCloseNote] = useState("")

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetCashboxStateQueryKey() })
    queryClient.invalidateQueries({ queryKey: getListCashSessionsQueryKey() })
  }

  const fail = (error: unknown) =>
    toast({
      title: "কাজটি সম্পন্ন হয়নি",
      description: error instanceof Error ? error.message : "আবার চেষ্টা করুন",
      variant: "destructive",
    })

  const openMutation = useOpenCashbox({
    mutation: {
      onSuccess: () => {
        setOpeningBalance("")
        refresh()
        toast({ title: "ক্যাশ বক্স খোলা হয়েছে" })
      },
      onError: fail,
    },
  })

  const movementMutation = useAddCashMovement({
    mutation: {
      onSuccess: () => {
        setMovementAmount("")
        setMovementNote("")
        refresh()
        toast({ title: "হিসাব যোগ হয়েছে" })
      },
      onError: fail,
    },
  })

  const closeMutation = useCloseCashbox({
    mutation: {
      onSuccess: () => {
        setCountedClosing("")
        setCloseNote("")
        refresh()
        toast({ title: "ক্যাশ বক্স বন্ধ করা হয়েছে" })
      },
      onError: fail,
    },
  })

  const session = state?.session ?? null
  const totals = state?.totals ?? null
  const expected = state?.expectedClosing ?? null
  const counted = Number(countedClosing || 0)
  const difference = expected === null ? 0 : counted - expected

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">ক্যাশ বক্স</h2>
        <p className="text-muted-foreground">দিনের শুরুর টাকা, বিক্রি, খরচ ও হিসাব মেলানো</p>
      </div>

      {isLoading && <p className="text-muted-foreground">লোড হচ্ছে…</p>}

      {!isLoading && !session && (
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Unlock className="w-5 h-5 text-primary" /> ক্যাশ বক্স খুলুন
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">শুরুর ব্যালেন্স (৳)</label>
              <Input
                inputMode="decimal"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0"
                className="mt-1 h-12 text-lg"
              />
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={openMutation.isPending || openingBalance.trim() === ""}
              onClick={() =>
                openMutation.mutate({ data: { openingBalance: Number(openingBalance) } })
              }
            >
              আজকের ক্যাশ বক্স চালু করুন
            </Button>
          </CardContent>
        </Card>
      )}

      {session && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/10 to-transparent">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">শুরুর ব্যালেন্স</p>
                <div className="text-2xl font-bold"><Money value={session.openingBalance} /></div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-green-500/10 to-transparent">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">ক্যাশ বিক্রি</p>
                <div className="text-2xl font-bold"><Money value={totals?.cashSales} /></div>
                <p className="text-xs text-muted-foreground mt-1">
                  জমা: <Money value={totals?.cashIn} />
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-destructive/10 to-transparent">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">খরচ</p>
                <div className="text-2xl font-bold"><Money value={totals?.expenses} /></div>
                <p className="text-xs text-muted-foreground mt-1">
                  উত্তোলন: <Money value={totals?.cashOut} />
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-secondary/20 to-transparent">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">ড্রয়ারে থাকা উচিত</p>
                <div className="text-2xl font-bold"><Money value={expected} /></div>
              </CardContent>
            </Card>
          </div>

          {/* Digital Payments Position */}
          <Card className="rounded-2xl border border-primary/20 shadow-sm bg-card overflow-hidden">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground">ডিজিটাল পেমেন্ট ব্যালেন্স (শিফট/আজ)</p>
                  <div className="text-2xl font-black text-primary">
                    <Money value={digitalSummary?.totalDigital ?? 0} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span className="px-2.5 py-1 rounded-xl bg-muted/60 border font-medium">বিকাশ: ৳{digitalSummary?.breakdown?.bkash ?? 0}</span>
                <span className="px-2.5 py-1 rounded-xl bg-muted/60 border font-medium">নগদ: ৳{digitalSummary?.breakdown?.nagad ?? 0}</span>
                <span className="px-2.5 py-1 rounded-xl bg-muted/60 border font-medium">রকেট: ৳{digitalSummary?.breakdown?.rocket ?? 0}</span>
                <span className="px-2.5 py-1 rounded-xl bg-muted/60 border font-medium">অন্যান্য: ৳{(digitalSummary?.breakdown?.upay || 0) + (digitalSummary?.breakdown?.card || 0) + (digitalSummary?.breakdown?.qr || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="w-5 h-5 text-primary" /> খরচ / ক্যাশ যোগ-বিয়োগ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex bg-muted p-1 rounded-xl">
                {(["expense", "cash_in", "cash_out"] as CashMovementInputType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMovementType(type)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      movementType === type
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {movementLabels[type]}
                  </button>
                ))}
              </div>
              {movementType === "expense" && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "মালামাল ক্রয়",
                    "চা-নাস্তা",
                    "দোকান ভাড়া",
                    "বিদ্যুৎ বিল",
                    "দান/সদকা",
                    "কর্মচারীর বেতন",
                    "ব্যক্তিগত উত্তোলন",
                    "অন্যান্য খরচ",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setMovementNote(chip)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        movementNote === chip
                          ? "bg-destructive text-destructive-foreground font-bold border-destructive"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="টাকার পরিমাণ (৳)"
                  className="h-12 text-lg font-bold"
                />
                <Input
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  placeholder="বিবরণ (যেমন: চা, মালামাল, ভাড়া)"
                  className="h-12"
                />
              </div>
              <Button
                size="lg"
                className="w-full"
                disabled={movementMutation.isPending || Number(movementAmount) <= 0}
                onClick={() =>
                  movementMutation.mutate({
                    data: {
                      type: movementType,
                      amount: Number(movementAmount),
                      ...(movementNote.trim() ? { note: movementNote.trim() } : {}),
                    },
                  })
                }
              >
                যোগ করুন
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">আজকের ক্যাশ লেনদেন</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(state?.movements ?? []).length === 0 && (
                <p className="text-muted-foreground">এখনো কোনো লেনদেন নেই</p>
              )}
              {(state?.movements ?? []).map((m) => {
                const isIn = m.type === "sale" || m.type === "cash_in"
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between border-b border-border py-2 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {isIn ? (
                        <ArrowDownCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="w-5 h-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">{movementLabels[m.type] ?? m.type}</p>
                        {m.note && <p className="text-xs text-muted-foreground">{m.note}</p>}
                      </div>
                    </div>
                    <span className={`font-bold ${isIn ? "text-green-600" : "text-destructive"}`}>
                      {isIn ? "+" : "-"} <Money value={m.amount} />
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="w-5 h-5 text-primary" /> দিন শেষে হিসাব মেলান
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    গোনা টাকা (৳)
                  </label>
                  <Input
                    inputMode="decimal"
                    value={countedClosing}
                    onChange={(e) => setCountedClosing(e.target.value)}
                    placeholder="0"
                    className="mt-1 h-12 text-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">মন্তব্য</label>
                  <Input
                    value={closeNote}
                    onChange={(e) => setCloseNote(e.target.value)}
                    placeholder="ঐচ্ছিক"
                    className="mt-1 h-12"
                  />
                </div>
              </div>
              {countedClosing.trim() !== "" && (
                <div className="rounded-xl bg-muted p-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">থাকা উচিত</span>
                    <span className="font-semibold"><Money value={expected} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">পার্থক্য</span>
                    <span
                      className={`font-bold ${
                        difference === 0
                          ? "text-foreground"
                          : difference > 0
                            ? "text-green-600"
                            : "text-destructive"
                      }`}
                    >
                      {difference > 0 ? "+" : ""}
                      <Money value={difference} />
                    </span>
                  </div>
                </div>
              )}
              <Button
                size="lg"
                variant="destructive"
                className="w-full"
                disabled={closeMutation.isPending || countedClosing.trim() === ""}
                onClick={() =>
                  closeMutation.mutate({
                    data: {
                      countedClosing: counted,
                      ...(closeNote.trim() ? { note: closeNote.trim() } : {}),
                    },
                  })
                }
              >
                ক্যাশ বক্স বন্ধ করুন
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-primary" /> আগের হিসাব
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(sessions ?? []).filter((s) => s.status === "closed").length === 0 && (
            <p className="text-muted-foreground">কোনো বন্ধ করা হিসাব নেই</p>
          )}
          {(sessions ?? [])
            .filter((s) => s.status === "closed")
            .map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between border-b border-border py-2 last:border-0"
              >
                <div>
                  <p className="font-medium">
                    {new Date(s.openedAt).toLocaleDateString("bn-BD")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    শুরু <Money value={s.openingBalance} /> · গোনা{" "}
                    <Money value={s.countedClosing} />
                  </p>
                </div>
                <Badge variant={Number(s.difference ?? 0) === 0 ? "secondary" : "destructive"}>
                  {Number(s.difference ?? 0) > 0 ? "+" : ""}
                  ৳ {Number(s.difference ?? 0)}
                </Badge>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
