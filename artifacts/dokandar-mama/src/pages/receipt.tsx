import { useGetSale } from "@workspace/api-client-react"
import type { Sale } from "@workspace/api-client-react"
import { useParams, useLocation } from "wouter"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2, ArrowLeft, Printer } from "lucide-react"
import { format } from "date-fns"

export function Receipt() {
  const params = useParams()
  const [, setLocation] = useLocation()
  
  const id = Number(params.id)
  const { data: sale, isLoading } = useGetSale<Sale>(id, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: { enabled: !!id } as any,
  })

  if (isLoading) {
    return <div className="p-8 text-center">রসিদ লোড হচ্ছে...</div>
  }

  if (!sale) {
    return <div className="p-8 text-center text-destructive">রসিদ পাওয়া যায়নি</div>
  }

  const handleShare = async () => {
    const text = `ক্যাশমেমো - দোকানদার মামা\n` +
      `তারিখ: ${format(new Date(sale.createdAt), "dd/MM/yyyy")}\n` +
      `বিল নং: #${sale.id}\n` +
      (sale.customerName ? `কাস্টমার: ${sale.customerName}\n` : '') +
      `-----------------------\n` +
      sale.items.map(item => `${item.productName} (${item.quantity} টি) - ৳${item.lineTotal}`).join('\n') +
      `\n-----------------------\n` +
      `মোট বিল: ৳${sale.total}\n` +
      `জমা: ৳${sale.paidAmount}\n` +
      (sale.dueAmount > 0 ? `বাকি: ৳${sale.dueAmount}\n` : '') +
      `ধন্যবাদ!`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `ক্যাশমেমো #${sale.id}`,
          text: text,
        })
      } catch (err) {
        console.error("Share failed", err)
      }
    } else {
      // Fallback to whatsapp link if Web Share API is not supported (e.g. desktop)
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`
      window.open(url, "_blank")
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Button variant="ghost" onClick={() => setLocation('/app/billing')} className="gap-2 -ml-4">
        <ArrowLeft className="h-5 w-5" /> নতুন বিলে ফিরে যান
      </Button>

      <Card className="rounded-none border-t-8 border-t-primary shadow-xl bg-white text-black p-8 font-mono relative overflow-hidden">
        {/* Zig-zag bottom border effect using CSS */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cG9seWdvbiBwb2ludHM9IjAsOCA0LDAgOCw4IiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPg==')] rotate-180"></div>
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-1">দোকানদার মামা</h1>
          <p className="text-gray-500 text-sm">সাধারণ স্টোর</p>
          <div className="mt-4 border-t border-b border-dashed border-gray-300 py-2 flex justify-between text-sm">
            <div>বিল নং: <strong>#{sale.id}</strong></div>
            <div>{format(new Date(sale.createdAt), "dd/MM/yyyy hh:mm a")}</div>
          </div>
        </div>

        {sale.customerName && (
          <div className="mb-4 text-sm">
            <span className="text-gray-500">কাস্টমার:</span> <strong>{sale.customerName}</strong>
            {sale.customerPhone && <div className="text-gray-500 text-xs">{sale.customerPhone}</div>}
          </div>
        )}

        <div className="mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2">বিবরণ</th>
                <th className="text-right py-2">পরিমাণ</th>
                <th className="text-right py-2">টাকা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-2 leading-tight">
                    <div className="font-semibold">{item.productName}</div>
                    <div className="text-xs text-gray-500">@ ৳{item.unitPrice}</div>
                  </td>
                  <td className="text-right py-2 align-top">{item.quantity}</td>
                  <td className="text-right py-2 align-top font-medium">৳{item.lineTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-right">
          <div className="flex justify-between items-center text-lg font-bold border-t border-gray-800 pt-2">
            <span>মোট বিল:</span>
            <span>৳ {sale.total}</span>
          </div>
          
          {sale.paymentMethod !== 'cash' && (
            <>
              <div className="flex justify-between items-center text-gray-600">
                <span>নগদ জমা:</span>
                <span>৳ {sale.paidAmount}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-red-600 border-t border-gray-300 pt-2">
                <span>নতুন বাকি:</span>
                <span>৳ {sale.dueAmount}</span>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>ধন্যবাদ! আবার আসবেন।</p>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleShare} className="flex-1 h-14 text-lg rounded-xl gap-2 font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white">
          <Share2 className="h-5 w-5" /> শেয়ার করুন
        </Button>
        <Button variant="outline" className="h-14 px-6 rounded-xl" onClick={() => window.print()}>
          <Printer className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
