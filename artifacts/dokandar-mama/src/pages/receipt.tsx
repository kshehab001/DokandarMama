import { useGetSale } from "@workspace/api-client-react"
import type { Sale } from "@workspace/api-client-react"
import { useParams, useLocation } from "wouter"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2, ArrowLeft, Printer, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { useShopTheme } from "@/context/shop-theme-context"

export function Receipt() {
  const params = useParams()
  const [, setLocation] = useLocation()
  const { activeShop } = useShopTheme()
  
  const id = Number(params.id)
  const { data: sale, isLoading } = useGetSale<Sale>(id, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: { enabled: !!id } as any,
  })

  if (isLoading) {
    return <div className="p-8 text-center font-bold">রসিদ লোড হচ্ছে...</div>
  }

  if (!sale) {
    return <div className="p-8 text-center text-destructive font-bold">রসিদ পাওয়া যায়নি</div>
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    const shopName = activeShop?.name || "দোকানদার মামা"
    const text = `ক্যাশমেমো — ${shopName}\n` +
      `তারিখ: ${format(new Date(sale.createdAt), "dd/MM/yyyy hh:mm a")}\n` +
      `বিল নং: #${sale.id}\n` +
      (sale.customerName ? `কাস্টমার: ${sale.customerName}\n` : '') +
      `-----------------------\n` +
      sale.items.map(item => `${item.productName} (${item.quantity} টি) — ৳${item.lineTotal}`).join('\n') +
      `\n-----------------------\n` +
      `মোট বিল: ৳${sale.total}\n` +
      `পরিশোধ: ৳${sale.paidAmount}\n` +
      (sale.dueAmount > 0 ? `বাকি: ৳${sale.dueAmount}\n` : '') +
      `\nধন্যবাদ! আবার আসবেন।`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `ক্যাশমেমো #${sale.id}`,
          text: text,
        })
      } catch (err) {
        console.warn("Share aborted", err)
      }
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`
      window.open(url, "_blank")
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6 print:m-0 print:p-0 print:max-w-full">
      {/* Top action buttons (hidden in print) */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => setLocation('/app/billing')} className="gap-2 -ml-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" /> নতুন বিক্রি
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 rounded-xl font-bold">
            <Share2 className="h-4 w-4 text-primary" /> শেয়ার
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5 rounded-xl font-bold bg-primary text-white">
            <Printer className="h-4 w-4" /> প্রিন্ট
          </Button>
        </div>
      </div>

      {/* Printable Receipt Card */}
      <Card className="rounded-2xl border-t-8 border-t-primary shadow-xl bg-white text-zinc-900 p-6 sm:p-8 font-mono relative overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="Dokandar Mama" className="h-8 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-black mb-0.5 tracking-tight">{activeShop?.name || "দোকানদার মামা"}</h1>
          <p className="text-zinc-500 text-xs">{activeShop?.area || "ডিজিটাল রিটেইল ক্যাশমেমো"}</p>
          
          <div className="mt-3 border-t border-b border-dashed border-zinc-300 py-1.5 flex justify-between text-xs font-semibold">
            <div>বিল নং: <strong>#{sale.id}</strong></div>
            <div>{format(new Date(sale.createdAt), "dd/MM/yyyy hh:mm a")}</div>
          </div>
        </div>

        {sale.customerName && (
          <div className="mb-4 text-xs bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 flex justify-between items-center">
            <div>
              <span className="text-zinc-500">কাস্টমার:</span> <strong>{sale.customerName}</strong>
            </div>
            {sale.customerPhone && <div className="text-zinc-600 font-bold">{sale.customerPhone}</div>}
          </div>
        )}

        <div className="mb-5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-300 text-zinc-600">
                <th className="text-left py-1.5 font-bold">পণ্য</th>
                <th className="text-center py-1.5 font-bold">পরিমাণ</th>
                <th className="text-right py-1.5 font-bold">টাকা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-2 leading-tight">
                    <div className="font-bold text-zinc-900">{item.productName}</div>
                    <div className="text-[10px] text-zinc-500">@ ৳{item.unitPrice}</div>
                  </td>
                  <td className="text-center py-2 align-top font-bold">{item.quantity}</td>
                  <td className="text-right py-2 align-top font-bold text-zinc-900">৳{item.lineTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-dashed border-zinc-300 pt-3 space-y-1.5 text-xs">
          <div className="flex justify-between font-medium">
            <span className="text-zinc-600">মোট বিল:</span>
            <span className="font-bold text-sm">৳{sale.total}</span>
          </div>
          <div className="flex justify-between font-medium text-emerald-700">
            <span>পরিশোধ ({sale.paymentMethod === 'cash' ? 'নগদ' : sale.paymentMethod === 'digital' ? 'ডিজিটাল' : 'বাকি'}):</span>
            <span className="font-bold">৳{sale.paidAmount}</span>
          </div>
          {sale.dueAmount > 0 && (
            <div className="flex justify-between font-bold text-red-600 text-sm pt-1 border-t border-zinc-200">
              <span>বকেয়া (বাকি):</span>
              <span>৳{sale.dueAmount}</span>
            </div>
          )}
        </div>

        <div className="text-center mt-6 pt-3 border-t border-dashed border-zinc-300 text-[11px] text-zinc-500">
          <div className="flex items-center justify-center gap-1 font-bold text-zinc-700 mb-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ধন্যবাদ! আবার আসবেন।</span>
          </div>
          <p className="text-[10px]">দোকানদার মামা ডিজিটাল খাতা দ্বারা তৈরি</p>
        </div>
      </Card>
    </div>
  )
}
