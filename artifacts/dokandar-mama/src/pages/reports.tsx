import { useState } from "react"
import { useGetSalesSummary, useGetTopProducts, useGetRestockSuggestions, useGetCurrentShop } from "@workspace/api-client-react"
import { useLanguage } from "@/context/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, AlertTriangle, CalendarDays, Download, Printer } from "lucide-react"

type RangeType = 'today' | 'week' | 'month'

export function Reports() {
  const [range, setRange] = useState<RangeType>('week')
  const { language, t } = useLanguage()
  const { data: currentShopData } = useGetCurrentShop()

  const { data: summary } = useGetSalesSummary({ range })
  const { data: topProducts } = useGetTopProducts({ range })
  const { data: restockInfo } = useGetRestockSuggestions()

  const handleExportCSV = () => {
    const shopName = currentShopData?.shop?.name || "DokandarMama_Shop"
    const dateStr = new Date().toISOString().split("T")[0]
    
    let csvContent = `data:text/csv;charset=utf-8,`
    csvContent += `Report: ${shopName} - Sales Summary (${range.toUpperCase()})\n`
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
    link.setAttribute("download", `${shopName}_Report_${range}_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{language === "en" ? "Reports & Analytics" : "রিপোর্ট ও বিশ্লেষণ"}</h2>
          <p className="text-muted-foreground">{language === "en" ? "Business performance and financial insights" : "দোকানের বেচাকেনা ও আর্থিক খতিয়ান"}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl font-bold gap-1.5 h-10 border-primary/20 hover:bg-primary/10 text-primary"
          >
            <Download className="h-4 w-4" />
            <span>{language === "en" ? "Export CSV" : "রিপোর্ট ডাউনলোড"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl font-bold gap-1.5 h-10"
          >
            <Printer className="h-4 w-4" />
            <span>{language === "en" ? "Print" : "প্রিন্ট"}</span>
          </Button>

          <div className="flex bg-muted p-1 rounded-xl">
            <button 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${range === 'today' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setRange('today')}
            >
              {language === "en" ? "Today" : "আজকে"}
            </button>
            <button 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${range === 'week' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setRange('week')}
            >
              {language === "en" ? "This Week" : "এই সপ্তাহ"}
            </button>
            <button 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${range === 'month' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setRange('month')}
            >
              {language === "en" ? "This Month" : "এই মাস"}
            </button>
          </div>
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
                <p className="text-sm font-medium text-muted-foreground mb-1">{language === "en" ? "Total Sales" : "মোট বিক্রি"}</p>
                <div className="text-3xl font-bold text-foreground">৳ {summary?.totalSales || 0}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-sm font-medium">
              <div className="text-green-600 bg-green-500/10 px-2 py-1 rounded-md">{language === "en" ? "Cash: " : "ক্যাশ: "}৳ {summary?.cashTotal || 0}</div>
              <div className="text-destructive bg-destructive/10 px-2 py-1 rounded-md">{language === "en" ? "Due: " : "বাকি: "}৳ {summary?.bakiTotal || 0}</div>
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
                <p className="text-sm font-medium text-muted-foreground mb-1">{language === "en" ? "Est. Net Profit" : "মোট লাভ (আনুমানিক)"}</p>
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
                <p className="text-sm font-medium text-muted-foreground mb-1">{language === "en" ? "Total Invoices" : "মোট লেনদেন"}</p>
                <div className="text-3xl font-bold text-foreground">{summary?.transactionCount || 0} {language === "en" ? "Bills" : "টি বিল"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="rounded-2xl shadow-sm border-border">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg">{language === "en" ? "Top Selling Products" : "সবচেয়ে বেশি বিক্রি হওয়া পণ্য"}</CardTitle>
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
                    <div className="text-sm text-muted-foreground">{language === "en" ? `Sold: ${p.quantitySold}` : `বিক্রি হয়েছে: ${p.quantitySold} টি`}</div>
                  </div>
                  <div className="text-right font-bold text-primary">
                    ৳ {p.revenue}
                  </div>
                </div>
              ))}
              {topProducts?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">{language === "en" ? "No data found" : "কোন ডেটা নেই"}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Restock Suggestions */}
        <Card className="rounded-2xl shadow-sm border-border border-l-4 border-l-accent">
          <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg">{language === "en" ? "Restock Needed (Low Stock)" : "নতুন কেনা দরকার (স্টক শেষ)"}</CardTitle>
            <Badge variant="destructive" className="rounded-xl px-3 py-1 text-sm bg-accent text-accent-foreground">
              {restockInfo?.length || 0} {language === "en" ? "Items" : "টি পণ্য"}
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
                    <div className="text-xs text-muted-foreground">{language === "en" ? "Current Stock" : "বর্তমান স্টক"}</div>
                  </div>
                </div>
              ))}
              {restockInfo?.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">{language === "en" ? "All product stock levels are healthy" : "সব পণ্যের স্টক ঠিক আছে"}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
