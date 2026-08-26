import { useState } from "react"
import { useLocation } from "wouter"
import { 
  useListProducts, 
  useListCustomers,
  useCreateSale,
  getProductByBarcode
} from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, Plus, Minus, Trash2, Camera, Package, Banknote, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { SaleItemInput, SaleInputPaymentMethod } from "@workspace/api-client-react"
import { BarcodeScannerDialog } from "@/components/barcode-scanner-dialog"
import { cn } from "@/lib/utils"

type CartItem = {
  product: any;
  quantity: number;
  unitPrice: number;
}

export function Billing() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  
  const [paymentMethod, setPaymentMethod] = useState<SaleInputPaymentMethod>('cash')
  const [digitalProvider, setDigitalProvider] = useState<string>("bkash")
  const [digitalTrxId, setDigitalTrxId] = useState<string>("")
  const [paidAmountStr, setPaidAmountStr] = useState("")
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // "কাস্টমার কতো টাকা দিলো?" popup shown for cash sales so mama can see
  // the change to hand back before the sale is finalized.
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false)
  const [cashReceivedStr, setCashReceivedStr] = useState("")

  // Queries
  const { data: products } = useListProducts({ search: search.length > 2 ? search : undefined })
  const { data: customers } = useListCustomers()
  const createSale = useCreateSale()

  // Derived
  const subtotal = cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
  const total = subtotal // add discount/tax later if needed
  
  const handleAddToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1, unitPrice: product.price }]
    })
    setSearch("")
  }

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQ }
      }
      return item
    }))
  }

  const handleUpdatePrice = (productId: number, newPrice: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, unitPrice: newPrice }
      }
      return item
    }))
  }

  const handleRemoveFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const handleBarcodeScanned = async (code: string) => {
    setIsScannerOpen(false)
    try {
      const product = await getProductByBarcode(code)
      if (product) {
        handleAddToCart(product)
        toast({ title: `✓ ${product.name} কার্টে যোগ হয়েছে` })
      }
    } catch (e: any) {
      // 404 = barcode not linked to any product yet.
      // Prefill the search box with the scanned code so mama can still find
      // the product by name, or know to add the barcode in Inventory first.
      const is404 = e?.status === 404 || e?.message?.includes("404") || String(e).includes("404")
      if (is404) {
        setSearch(code)
        toast({
          title: "এই বারকোডের পণ্য পাওয়া যায়নি",
          description: "ইনভেন্টরিতে পণ্যের বারকোড সেভ করুন, অথবা নিচ থেকে পণ্য সিলেক্ট করুন।",
          variant: "destructive",
        })
      } else {
        toast({ title: "স্ক্যান করতে সমস্যা হয়েছে", variant: "destructive" })
      }
    }
  }

  // Actually submits the sale. For cash sales this runs after mama confirms
  // the received-amount/change popup; for baki/mixed/digital it runs right away.
  const submitSale = (paidAmount: number) => {
    const items: SaleItemInput[] = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))

    createSale.mutate({
      data: {
        customerId: selectedCustomerId || undefined,
        items,
        paidAmount,
        paymentMethod,
        digitalProvider: paymentMethod === 'digital' ? digitalProvider : undefined,
        digitalTrxId: paymentMethod === 'digital' ? (digitalTrxId || undefined) : undefined,
      } as any
    }, {
      onSuccess: (sale) => {
        toast({ title: "বিল সফলভাবে তৈরি হয়েছে!" })
        setIsCashDialogOpen(false)
        setLocation(`/app/sales/${sale.id}`)
      },
      onError: () => {
        toast({ title: "বিল তৈরি করতে সমস্যা হয়েছে", variant: "destructive" })
      }
    })
  }

  const handleCompleteClick = () => {
    if (cart.length === 0) return

    if ((paymentMethod === 'baki' || paymentMethod === 'mixed') && !selectedCustomerId) {
      toast({ title: "বাকি বিক্রয়ের জন্য কাস্টমার সিলেক্ট করুন", variant: "destructive" })
      return
    }

    if (paymentMethod === 'cash') {
      // Ask "কাস্টমার কতো টাকা দিলো?" first so mama can see the change
      // before the sale is finalized.
      setCashReceivedStr(String(total))
      setIsCashDialogOpen(true)
      return
    }

    const paidAmount = paymentMethod === 'baki' ? 0 : Number(paidAmountStr)
    submitSale(paidAmount)
  }

  const cashReceived = Number(cashReceivedStr) || 0
  const changeDue = cashReceived - total

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left side - Product Search & List */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="rounded-2xl shadow-sm border-border">
          <CardHeader className="p-4 pb-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="পণ্য খুঁজুন (নাম বা বারকোড)..." 
                  className="pl-10 h-12 text-lg rounded-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button size="icon" className="h-12 w-12 rounded-xl shrink-0" onClick={() => setIsScannerOpen(true)}>
                <Camera className="h-6 w-6" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-4">
            {search.length > 0 ? (
              <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                {products?.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleAddToCart(p)}>
                    <div>
                      <div className="font-semibold text-lg">{p.name}</div>
                      <div className="text-muted-foreground text-sm">স্টক: {p.stock} {p.unit}</div>
                    </div>
                    <div className="font-bold text-lg text-primary">৳ {p.price}</div>
                  </div>
                ))}
                {products?.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground">কোন পণ্য পাওয়া যায়নি</div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>পণ্য খুঁজতে নাম লিখুন বা স্ক্যান করুন</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right side - Cart */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4">
        <Card className="rounded-2xl shadow-md border-border flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
          <CardHeader className="bg-muted/30 border-b p-4">
            <CardTitle className="text-xl">বর্তমান বিল</CardTitle>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">বিল খালি</p>
              </div>
            ) : (
              <div className="divide-y">
                {cart.map(item => (
                  <div key={item.product.id} className="p-4 hover:bg-muted/20">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-lg leading-tight w-3/4">{item.product.name}</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive -mt-1 -mr-2" onClick={() => handleRemoveFromCart(item.product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleUpdateQuantity(item.product.id, -1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-lg w-6 text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleUpdateQuantity(item.product.id, 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {item.product.isPriceVariable ? (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">৳</span>
                          <Input 
                            type="number" 
                            className="w-20 h-8 text-right px-2" 
                            value={item.unitPrice} 
                            onChange={e => handleUpdatePrice(item.product.id, Number(e.target.value))}
                          />
                        </div>
                      ) : (
                        <div className="font-medium">৳ {item.unitPrice} x {item.quantity}</div>
                      )}
                    </div>
                    <div className="text-right font-bold text-primary mt-1">
                      = ৳ {item.quantity * item.unitPrice}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex-col border-t p-4 bg-muted/10 shrink-0 space-y-4">
            <div className="w-full flex justify-between items-center text-xl font-bold">
              <span>মোট:</span>
              <span className="text-3xl text-primary">৳ {total}</span>
            </div>
            
            <div className="w-full space-y-3">
              <div className="grid grid-cols-4 gap-1.5">
                <Button 
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'} 
                  className="rounded-xl h-11 text-sm font-bold"
                  onClick={() => setPaymentMethod('cash')}
                >
                  নগদ
                </Button>
                <Button 
                  variant={paymentMethod === 'digital' ? 'default' : 'outline'} 
                  className="rounded-xl h-11 text-sm font-bold"
                  onClick={() => setPaymentMethod('digital')}
                >
                  ডিজিটাল
                </Button>
                <Button 
                  variant={paymentMethod === 'baki' ? 'default' : 'outline'} 
                  className="rounded-xl h-11 text-sm font-bold"
                  onClick={() => setPaymentMethod('baki')}
                >
                  বাকি
                </Button>
                <Button 
                  variant={paymentMethod === 'mixed' ? 'default' : 'outline'} 
                  className="rounded-xl h-11 text-sm font-bold"
                  onClick={() => setPaymentMethod('mixed')}
                >
                  আংশিক
                </Button>
              </div>

              {paymentMethod === 'digital' && (
                <div className="space-y-3 p-3 rounded-2xl bg-muted/40 border border-border/80 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">পেমেন্ট মেথড সিলেক্ট করুন</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'bkash', label: 'বিকাশ', bg: 'bg-[#d12053] text-white hover:bg-[#b01742]' },
                        { id: 'nagad', label: 'নগদ', bg: 'bg-[#f7941d] text-white hover:bg-[#d67e15]' },
                        { id: 'rocket', label: 'রকেট', bg: 'bg-[#8c3494] text-white hover:bg-[#722979]' },
                        { id: 'upay', label: 'উপায়', bg: 'bg-[#ffc800] text-black hover:bg-[#e0b000]' },
                        { id: 'card', label: 'কার্ড/POS', bg: 'bg-blue-600 text-white hover:bg-blue-700' },
                        { id: 'qr', label: 'বাংলা QR', bg: 'bg-emerald-600 text-white hover:bg-emerald-700' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setDigitalProvider(p.id)}
                          className={cn(
                            "h-9 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center border",
                            digitalProvider === p.id
                              ? `${p.bg} shadow-sm border-transparent scale-[1.02]`
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">ট্রানজেকশন আইডি / ফোন নাম্বার (ঐচ্ছিক)</Label>
                    <Input
                      value={digitalTrxId}
                      onChange={e => setDigitalTrxId(e.target.value)}
                      placeholder="যেমন: 8N7A6D..."
                      className="h-10 text-sm font-mono rounded-xl bg-background"
                    />
                  </div>
                </div>
              )}

              {(paymentMethod === 'baki' || paymentMethod === 'mixed') && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <Label>কাস্টমার</Label>
                    <select 
                      className="flex h-12 w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-2 text-base outline-none focus:ring-2 focus:ring-ring"
                      value={selectedCustomerId || ""}
                      onChange={e => setSelectedCustomerId(Number(e.target.value) || null)}
                    >
                      <option value="">কাস্টমার সিলেক্ট করুন...</option>
                      {customers?.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'}) - বাকি: ৳{c.bakiBalance}</option>
                      ))}
                    </select>
                  </div>
                  
                  {paymentMethod === 'mixed' && (
                    <div className="space-y-1">
                      <Label>জমা দেওয়া পরিমাণ (৳)</Label>
                      <Input 
                        type="number" 
                        value={paidAmountStr} 
                        onChange={e => setPaidAmountStr(e.target.value)} 
                        placeholder="কতো টাকা দিলো?" 
                        className="h-12 rounded-xl text-lg font-bold"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button 
              className="w-full h-14 text-lg rounded-xl font-bold" 
              size="lg"
              disabled={cart.length === 0 || createSale.isPending}
              onClick={handleCompleteClick}
            >
              {createSale.isPending ? "বিল হচ্ছে..." : "বিল কমপ্লিট করুন"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleBarcodeScanned}
      />

      {/* "কাস্টমার কতো টাকা দিলো?" — cash-received & change popup */}
      <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              কাস্টমার কতো টাকা দিলো?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center text-lg">
              <span className="text-muted-foreground">মোট বিল:</span>
              <span className="font-bold">৳ {total}</span>
            </div>
            <div className="space-y-1">
              <Label>দিলো (৳)</Label>
              <Input
                type="number"
                autoFocus
                className="h-14 text-2xl font-bold text-center rounded-xl"
                value={cashReceivedStr}
                onChange={(e) => setCashReceivedStr(e.target.value)}
              />
            </div>
            <div
              className={`rounded-xl p-4 text-center text-xl font-bold ${
                changeDue >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              }`}
            >
              {changeDue >= 0
                ? `ফেরত দিন: ৳ ${changeDue}`
                : `আরও লাগবে: ৳ ${Math.abs(changeDue)}`}
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full h-12 rounded-xl font-bold"
              disabled={createSale.isPending || cashReceived < total}
              onClick={() => submitSale(total)}
            >
              {createSale.isPending ? "বিল হচ্ছে..." : "সম্পন্ন করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
