import { useState } from "react"
import { useGetSalesSummary, useGetTopProducts, useGetRestockSuggestions } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, AlertTriangle, CalendarDays } from "lucide-react"

type RangeType = 'today' | 'week' | 'month'

export function Reports() {
  const [range, setRange] = useState<RangeType>('week')

  const { data: summary } = useGetSalesSummary({ range })
  const { data: topProducts } = useGetTopProducts({ range })
  const { data: restockInfo } = useGetRestockSuggestions()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">রিপোর্ট</h2>
          <p className="text-muted-foreground">দোকানের বেচাকেনার বিশ্লেষণ</p>
        </div>
        
        <div className="flex bg-muted p-1 rounded-xl w-full sm:w-auto">
          <button 
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${range === 'today' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            onClick={() => setRange('today')}
          >
            আজকে
          </button>
          <button 
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${range === 'week' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            onClick={() => setRange('week')}
          >
            এই সপ্তাহ
          </button>
          <button 
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${range === 'month' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
            onClick={() => setRange('month')}
          >
            এই মাস
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-4 rounded-2xl">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">মোট বিক্রি</p>
                <div className="text-3xl font-bold text-foreground">৳ {summary?.totalSales || 0}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-sm font-medium">
              <div className="text-green-600 bg-green-500/10 px-2 py-1 rounded-md">ক্যাশ: ৳ {summary?.cashTotal || 0}</div>
              <div className="text-destructive bg-destructive/10 px-2 py-1 rounded-md">বাকি: ৳ {summary?.bakiTotal || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-green-500/10 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-4 rounded-2xl">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">মোট লাভ (আনুমানিক)</p>
                <div className="text-3xl font-bold text-foreground">৳ {summary?.totalProfit || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-secondary/20 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-secondary/30 p-4 rounded-2xl">
                <CalendarDays className="h-8 w-8 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">মোট লেনদেন</p>
                <div className="text-3xl font-bold text-foreground">{summary?.transactionCount || 0} টি বিল</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="rounded-2xl shadow-sm border-border">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg">সবচেয়ে বেশি বিক্রি হওয়া পণ্য</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topProducts?.map((p, i) => (
                <div key={p.productId} className="flex items-center p-4">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground mr-4">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{p.productName}</div>
                    <div className="text-sm text-muted-foreground">বিক্রি হয়েছে: {p.quantitySold} টি</div>
                  </div>
                  <div className="text-right font-bold text-primary">
                    ৳ {p.revenue}
                  </div>
                </div>
              ))}
              {topProducts?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">কোন ডেটা নেই</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Restock Suggestions */}
        <Card className="rounded-2xl shadow-sm border-border border-l-4 border-l-accent">
          <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg">নতুন কেনা দরকার (স্টক শেষ)</CardTitle>
            <Badge variant="destructive" className="rounded-xl px-3 py-1 text-sm bg-accent text-accent-foreground">
              {restockInfo?.length || 0} টি পণ্য
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {restockInfo?.map((r) => (
                <div key={r.productId} className="p-4 flex justify-between items-center hover:bg-muted/10 transition-colors">
                  <div>
                    <div className="font-semibold text-lg flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-accent" />
                      {r.productName}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{r.reason}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-destructive">{r.stock}</div>
                    <div className="text-xs text-muted-foreground">বর্তমান স্টক</div>
                  </div>
                </div>
              ))}
              {restockInfo?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">সব পণ্যের স্টক ঠিক আছে</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
