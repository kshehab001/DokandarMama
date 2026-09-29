import { useState, useEffect } from "react"
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, getListProductsQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useShopTheme } from "@/context/shop-theme-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, AlertTriangle, PackagePlus, Loader2, Camera, Lock, FileText, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProductInput } from "@workspace/api-client-react"
import { getStarterCatalogForCategory } from "@/lib/starter-catalog"
import { BarcodeScannerDialog } from "@/components/barcode-scanner-dialog"
import { SellerBillDialog } from "@/components/seller-bill-dialog"
import { lookupMasterBarcode } from "@/lib/master-barcode-catalog"
import { useChouPresence } from "@/context/chou-presence-context"

export function Inventory() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { isShopkeeper, categoryId, category } = useShopTheme()
  const canManageProducts = !isShopkeeper

  const [search, setSearch] = useState("")
  const { data: products, isLoading } = useListProducts({ search: search || undefined })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isSellerBillOpen, setIsSellerBillOpen] = useState(false)
  const [isMasterRecognized, setIsMasterRecognized] = useState(false)
  const { setPose, speak } = useChouPresence()

  // Listen for Chotu's quick-action events from the floating widget
  useEffect(() => {
    const handleAdd = () => handleOpenForm()
    const handleScan = () => setIsScannerOpen(true)
    window.addEventListener("chotu:action:add_product", handleAdd)
    window.addEventListener("chotu:action:scan", handleScan)
    return () => {
      window.removeEventListener("chotu:action:add_product", handleAdd)
      window.removeEventListener("chotu:action:scan", handleScan)
    }
  }, [canManageProducts])
  
  const [formData, setFormData] = useState<ProductInput & { 
    mfgDate?: string; 
    expiryDate?: string;
    brand?: string;
    batchNumber?: string;
  }>({
    name: "",
    barcode: "",
    brand: "",
    category: "সাধারণ",
    unit: "পিস",
    price: 0,
    costPrice: 0,
    stock: 0,
    lowStockThreshold: 5,
    isPriceVariable: false,
    mfgDate: "",
    expiryDate: "",
    batchNumber: "",
  })

  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const handleOpenForm = (product?: any, prefillBarcode?: string) => {
    if (!canManageProducts) {
      toast({
        title: "অনুমতি নেই",
        description: "পণ্য যোগ বা পরিবর্তনের জন্য ম্যানেজার বা মালিকের পারমিশন প্রয়োজন",
        variant: "destructive",
      })
      return
    }
    setIsMasterRecognized(false)
    if (product) {
      setEditingId(product.id)
      setFormData({
        name: product.name,
        barcode: product.barcode || "",
        brand: product.brand || "",
        category: product.category,
        unit: product.unit,
        price: product.price,
        costPrice: product.costPrice || 0,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        isPriceVariable: product.isPriceVariable ?? false,
        mfgDate: product.mfgDate ? product.mfgDate.split("T")[0] : "",
        expiryDate: product.expiryDate ? product.expiryDate.split("T")[0] : "",
        batchNumber: product.batchNumber || "",
      })
    } else {
      setEditingId(null)
      const initialBarcode = prefillBarcode || ""
      setFormData({
        name: "",
        barcode: initialBarcode,
        brand: "",
        category: "সাধারণ",
        unit: "পিস",
        price: 0,
        costPrice: 0,
        stock: 0,
        lowStockThreshold: 5,
        isPriceVariable: false,
        mfgDate: "",
        expiryDate: "",
        batchNumber: "",
      })
      if (initialBarcode) {
        handleBarcodeChange(initialBarcode)
      }
    }
    setIsFormOpen(true)
  }

  const handleBarcodeChange = async (barcode: string) => {
    setFormData((prev) => ({ ...prev, barcode }))
    const clean = barcode.trim()
    if (clean.length >= 3 && !editingId) {
      const master = await lookupMasterBarcode(clean)
      if (master) {
        setIsMasterRecognized(true)
        setFormData((prev) => ({
          ...prev,
          barcode: master.barcode,
          name: master.nameBn || master.name || prev.name,
          brand: master.brand || prev.brand || "",
          category: master.category || prev.category,
          unit: master.unit || prev.unit,
          price: master.defaultPrice > 0 ? master.defaultPrice : prev.price,
          costPrice: master.costPrice !== undefined && master.costPrice > 0 ? master.costPrice : prev.costPrice,
          mfgDate: master.mfgDate || prev.mfgDate,
          expiryDate: master.expiryDate || prev.expiryDate,
          batchNumber: master.batchNumber || prev.batchNumber,
          isPriceVariable: master.isPriceVariable !== undefined ? master.isPriceVariable : prev.isPriceVariable,
        }))
        toast({
          title: "মাদার ডাটাবেজ থেকে তথ্য পূরণ হয়েছে! ✨",
          description: `${master.nameBn || master.name} (${master.brand || master.category}) — প্রয়োজনে পরিবর্তন করে নিন।`,
        })
      }
    } else if (clean.length < 3) {
      setIsMasterRecognized(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingId) {
      updateProduct.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() })
          toast({ title: "পণ্য আপডেট করা হয়েছে" })
          setIsFormOpen(false)
        }
      })
    } else {
      createProduct.mutate({ data: formData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() })
          toast({ title: "নতুন পণ্য যোগ করা হয়েছে" })
          setIsFormOpen(false)
        }
      })
    }
  }

  const handleDelete = (id: number, name: string) => {
    if (!canManageProducts) {
      toast({
        title: "অনুমতি নেই",
        description: "পণ্য ডিলিট করার জন্য ম্যানেজার বা মালিকের পারমিশন প্রয়োজন",
        variant: "destructive",
      })
      return
    }
    if (confirm(`আপনি কি নিশ্চিত যে ${name} মুছে ফেলতে চান?`)) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() })
          toast({ title: "পণ্য মুছে ফেলা হয়েছে" })
        }
      })
    }
  }

  const handleImportStarterCatalog = async () => {
    if (!canManageProducts) return
    setIsImporting(true)
    setImportProgress(0)
    const categoryCatalog = getStarterCatalogForCategory(categoryId)
    const existingNames = new Set((products ?? []).map((p: any) => p.name.trim().toLowerCase()))
    const toImport = categoryCatalog.filter((item) => !existingNames.has(item.name.trim().toLowerCase()))

    let successCount = 0
    let failCount = 0
    for (const item of toImport) {
      try {
        await createProduct.mutateAsync({
          data: {
            name: item.name,
            barcode: "",
            category: item.category,
            unit: item.unit,
            price: item.price,
            costPrice: item.costPrice,
            stock: item.stock,
            lowStockThreshold: item.lowStockThreshold,
            isPriceVariable: false,
          },
        })
        successCount += 1
      } catch {
        failCount += 1
      }
      setImportProgress((prev) => prev + 1)
    }

    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() })
    setIsImporting(false)
    setIsImportOpen(false)

    if (toImport.length === 0) {
      toast({ title: "সব পণ্য ইতিমধ্যে আপনার তালিকায় আছে" })
    } else if (failCount === 0) {
      toast({ title: `${successCount} টি পণ্য যোগ করা হয়েছে` })
    } else {
      toast({
        title: `${successCount} টি পণ্য যোগ হয়েছে, ${failCount} টি ব্যর্থ হয়েছে`,
        variant: "destructive",
      })
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">ইনভেন্টরি</h2>
          <p className="text-muted-foreground">আপনার দোকানের সকল পণ্য ও স্টক তালিকা</p>
        </div>
        {canManageProducts && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsScannerOpen(true)}
              className="rounded-xl gap-2 flex-1 sm:flex-none border-primary/30 text-primary hover:bg-primary/10 font-bold"
            >
              <Camera className="h-4 w-4" />
              বারকোড স্ক্যান করে যোগ
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsSellerBillOpen(true)}
              className="rounded-xl gap-2 flex-1 sm:flex-none"
            >
              <FileText className="h-4 w-4" />
              বিল/মেমো OCR
            </Button>
            <Button variant="outline" onClick={() => setIsImportOpen(true)} className="rounded-xl gap-2 flex-1 sm:flex-none">
              <PackagePlus className="h-4 w-4" />
              স্টার্টার ক্যাটালগ
            </Button>
            <Button onClick={() => handleOpenForm()} className="rounded-xl gap-2 flex-1 sm:flex-none font-bold">
              <Plus className="h-4 w-4" />
              নতুন পণ্য যোগ
            </Button>
          </div>
        )}
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="পণ্য খুঁজুন..." 
              className="pl-10 h-12 rounded-xl text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-base">
                <tr>
                  <th className="px-6 py-4 font-medium">পণ্যের নাম</th>
                  <th className="px-6 py-4 font-medium">বিক্রি মূল্য</th>
                  <th className="px-6 py-4 font-medium">স্টক</th>
                  <th className="px-6 py-4 font-medium text-right">{canManageProducts ? "অ্যাকশন" : "স্ট্যাটাস"}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</td></tr>
                ) : products?.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">কোন পণ্য পাওয়া যায়নি।</td></tr>
                ) : (
                  products?.map((product: any) => (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors text-base">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{product.name}</div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-2 items-center mt-1">
                          {product.brand && <span className="font-medium text-foreground/80">{product.brand}</span>}
                          <span>{product.category}</span>
                          {product.barcode && <Badge variant="outline" className="text-xs">{product.barcode}</Badge>}
                          {product.isPriceVariable && <Badge variant="secondary" className="text-xs">পরিবর্তনশীল দাম</Badge>}
                          {product.expiryDate && (
                            <span className="text-xs text-muted-foreground">
                              মেয়াদ: {new Date(product.expiryDate).toLocaleDateString("bn-BD")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        ৳ {product.price} <span className="text-muted-foreground text-sm font-normal">/ {product.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={product.stock <= product.lowStockThreshold ? "text-destructive font-bold" : ""}>
                            {product.stock}
                          </span>
                          {product.stock <= product.lowStockThreshold && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {canManageProducts ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary/10" onClick={() => handleOpenForm(product)}>
                              <Edit className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id, product.name)}>
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">উপলব্ধ</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "পণ্য এডিট করুন" : "নতুন পণ্য যোগ"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Barcode section with recognition status */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-muted/40 border border-border/70">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">বারকোড (Barcode)</Label>
                {isMasterRecognized && (
                  <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold gap-1">
                    <Sparkles className="h-3 w-3" />
                    মাদার ডাটাবেজ অটো-ফিল ✨
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={formData.barcode}
                  onChange={(e) => handleBarcodeChange(e.target.value)}
                  placeholder="বারকোড স্ক্যান বা লিখুন"
                  className="h-11 font-mono text-sm bg-background"
                />
                <Button 
                  type="button" 
                  size="icon" 
                  variant="outline" 
                  className="h-11 w-11 rounded-xl shrink-0 border-primary/40 text-primary hover:bg-primary/10" 
                  onClick={() => setIsScannerOpen(true)}
                  title="ক্যামেরা দিয়ে স্ক্যান করুন"
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>
              {isMasterRecognized && (
                <p className="text-[11px] text-muted-foreground">
                  সব তথ্য মাদার ডাটাবেজ থেকে স্বয়ংক্রিয়ভাবে পূরণ হয়েছে। আপনার দোকান অনুযায়ী যেকোনো মান পরিবর্তন করতে পারবেন।
                </p>
              )}
            </div>

            {/* Product Name */}
            <div className="space-y-1.5">
              <Label>পণ্যের নাম *</Label>
              <Input 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="যেমন: মোজো ৫০০ মিলি"
                className="h-11" 
              />
            </div>
            
            {/* Brand & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ব্র্যান্ড / কোম্পানি</Label>
                <Input 
                  value={formData.brand || ""} 
                  onChange={e => setFormData({...formData, brand: e.target.value})} 
                  placeholder="যেমন: আকিজ / প্রাণ"
                  className="h-11" 
                />
              </div>
              <div className="space-y-1.5">
                <Label>ক্যাটাগরি</Label>
                <Input 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  placeholder="যেমন: পানীয়"
                  className="h-11" 
                />
              </div>
            </div>

            {/* Unit & Batch Number */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>একক (Unit)</Label>
                <Input 
                  value={formData.unit} 
                  onChange={e => setFormData({...formData, unit: e.target.value})} 
                  placeholder="পিস / বোতল / কেজি"
                  className="h-11" 
                />
              </div>
              <div className="space-y-1.5">
                <Label>ব্যাচ নং (ঐচ্ছিক)</Label>
                <Input 
                  value={formData.batchNumber || ""} 
                  onChange={e => setFormData({...formData, batchNumber: e.target.value})} 
                  placeholder="ব্যাচ বা লট নং"
                  className="h-11 font-mono" 
                />
              </div>
            </div>

            {/* Cost & Sell Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>কেনা দাম (৳)</Label>
                <Input 
                  type="number" 
                  value={formData.costPrice || ""} 
                  onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} 
                  placeholder="0"
                  className="h-11" 
                />
              </div>
              <div className="space-y-1.5">
                <Label>বিক্রি মূল্য / MRP (৳) *</Label>
                <Input 
                  type="number" 
                  required 
                  value={formData.price || ""} 
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                  placeholder="0"
                  className="h-11 font-bold text-primary" 
                />
              </div>
            </div>

            {/* Variable price checkbox */}
            <label className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted/50 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded accent-primary" 
                checked={formData.isPriceVariable} 
                onChange={e => setFormData({...formData, isPriceVariable: e.target.checked})} 
              />
              <div>
                <div className="text-sm font-medium">বিক্রির সময় দাম পরিবর্তন করা যাবে</div>
                <div className="text-xs text-muted-foreground">দরদামের পণ্য বা কাঁচাবাজারের জন্য</div>
              </div>
            </label>

            {/* MFG & Expiry Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>উৎপাদন তারিখ (MFG)</Label>
                <Input
                  type="date"
                  value={formData.mfgDate || ""}
                  onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>মেয়াদোত্তীর্ণ তারিখ (EXP)</Label>
                <Input
                  type="date"
                  value={formData.expiryDate || ""}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            {/* Stock & Low Stock Alert */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>বর্তমান স্টক</Label>
                <Input 
                  type="number" 
                  value={formData.stock === 0 ? "" : formData.stock} 
                  onChange={e => setFormData({...formData, stock: Number(e.target.value)})} 
                  placeholder="0"
                  className="h-11" 
                />
              </div>
              <div className="space-y-1.5">
                <Label>লো-স্টক এলার্ট</Label>
                <Input 
                  type="number" 
                  value={formData.lowStockThreshold} 
                  onChange={e => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} 
                  className="h-11" 
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="h-11 w-full sm:w-auto">
                বাতিল
              </Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="h-11 w-full sm:w-auto font-bold">
                {editingId ? "আপডেট করুন" : "সংরক্ষণ করুন"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportOpen} onOpenChange={(open) => !isImporting && setIsImportOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>স্টার্টার ক্যাটালগ আমদানি করুন</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3 text-sm text-muted-foreground">
            <p>
              {category.displayNameBn} ক্যাটাগরির {getStarterCatalogForCategory(categoryId).length} টি সাধারণ পণ্য একসাথে আপনার ইনভেন্টরিতে যোগ করা হবে। দাম ও স্টক পরে এডিট করে নিজের মতো ঠিক করে নিতে পারবেন।
            </p>
            {isImporting && (
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                যোগ করা হচ্ছে... ({importProgress}/{getStarterCatalogForCategory(categoryId).length})
              </div>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)} disabled={isImporting} className="h-12 w-full sm:w-auto">
              বাতিল
            </Button>
            <Button type="button" onClick={handleImportStarterCatalog} disabled={isImporting} className="h-12 w-full sm:w-auto">
              {isImporting ? "আমদানি চলছে..." : "আমদানি করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={(code) => {
          setIsScannerOpen(false)
          if (!isFormOpen) {
            handleOpenForm(undefined, code)
          } else {
            handleBarcodeChange(code)
          }
        }}
      />

      <SellerBillDialog
        open={isSellerBillOpen}
        onOpenChange={setIsSellerBillOpen}
        existingProducts={products || []}
      />
    </div>
  )
}
