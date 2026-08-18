import { useState } from "react"
import { 
  useListCustomers, 
  useCreateCustomer, 
  useUpdateCustomer, 
  useGetCustomerLedger,
  useRecordCustomerPayment,
  getListCustomersQueryKey,
  getGetCustomerLedgerQueryKey
} from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, UserPlus, Phone, FileText, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CustomerInput, LedgerEntry } from "@workspace/api-client-react"
import { format } from "date-fns"

export function Customers() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [withDueOnly, setWithDueOnly] = useState(false)
  
  const { data: customers, isLoading } = useListCustomers({ 
    search: search || undefined,
    withDueOnly: withDueOnly ? true : undefined
  })

  // State for Customer Form
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<CustomerInput>({ name: "", phone: "" })
  const createCustomer = useCreateCustomer()

  // State for Payment Form
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const recordPayment = useRecordCustomerPayment()

  // State for Ledger View
  const [isLedgerOpen, setIsLedgerOpen] = useState(false)
  const { data: ledger } = useGetCustomerLedger<LedgerEntry[]>(
    selectedCustomer?.id || 0,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query: { enabled: !!selectedCustomer?.id && isLedgerOpen } as any,
    },
  )

  const handleOpenForm = () => {
    setFormData({ name: "", phone: "" })
    setIsFormOpen(true)
  }

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    createCustomer.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() })
        toast({ title: "নতুন কাস্টমার যোগ করা হয়েছে" })
        setIsFormOpen(false)
      }
    })
  }

  const handleOpenPayment = (customer: any) => {
    setSelectedCustomer(customer)
    setPaymentAmount("")
    setIsPaymentOpen(true)
  }

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return
    
    recordPayment.mutate({ 
      id: selectedCustomer.id, 
      data: { amount: Number(paymentAmount), note: "নগদ জমা" } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() })
        toast({ title: "জমা রেকর্ড করা হয়েছে" })
        setIsPaymentOpen(false)
      }
    })
  }

  const handleOpenLedger = (customer: any) => {
    setSelectedCustomer(customer)
    setIsLedgerOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">কাস্টমার ও বাকি খাতা</h2>
          <p className="text-muted-foreground">কাস্টমারদের তালিকা ও হিসাব</p>
        </div>
        <Button onClick={handleOpenForm} className="rounded-xl gap-2 w-full sm:w-auto">
          <UserPlus className="h-5 w-5" />
          নতুন কাস্টমার
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..." 
              className="pl-10 h-12 rounded-xl text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-muted/50 p-3 rounded-xl border w-full sm:w-auto justify-center">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded accent-destructive" 
              checked={withDueOnly} 
              onChange={e => setWithDueOnly(e.target.checked)} 
            />
            <span className="font-medium">শুধুমাত্র যাদের বাকি আছে</span>
          </label>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">কাস্টমার</th>
                  <th className="px-6 py-4 font-medium text-right">বাকি (৳)</th>
                  <th className="px-6 py-4 font-medium text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y text-base">
                {isLoading ? (
                  <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</td></tr>
                ) : customers?.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">কোন কাস্টমার পাওয়া যায়নি।</td></tr>
                ) : (
                  customers?.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-lg">{customer.name}</div>
                        {customer.phone && (
                          <div className="text-muted-foreground flex items-center gap-1 mt-1 text-sm">
                            <Phone className="h-3 w-3" /> {customer.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xl font-bold ${customer.bakiBalance > 0 ? "text-destructive" : "text-foreground"}`}>
                          {customer.bakiBalance > 0 ? customer.bakiBalance : 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {customer.bakiBalance > 0 && (
                            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white" onClick={() => handleOpenPayment(customer)}>
                              জমা নিন
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-muted" onClick={() => handleOpenLedger(customer)}>
                            <FileText className="h-5 w-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>নতুন কাস্টমার যোগ করুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>নাম *</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 text-lg" />
            </div>
            <div className="space-y-2">
              <Label>মোবাইল নম্বর</Label>
              <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 text-lg" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={createCustomer.isPending} className="w-full h-12 text-lg rounded-xl">
                সেভ করুন
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receive Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>বাকি জমা নিন</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <form onSubmit={handleRecordPayment} className="space-y-4 py-4">
              <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 text-center mb-4">
                <div className="text-muted-foreground">{selectedCustomer.name} এর মোট বাকি</div>
                <div className="text-3xl font-bold text-destructive">৳ {selectedCustomer.bakiBalance}</div>
              </div>
              
              <div className="space-y-2">
                <Label>জমার পরিমাণ (৳) *</Label>
                <Input 
                  type="number" 
                  required 
                  max={selectedCustomer.bakiBalance}
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  className="h-16 text-3xl font-bold text-center rounded-xl" 
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={recordPayment.isPending || !paymentAmount} className="w-full h-14 text-xl font-bold rounded-xl bg-primary hover:bg-primary/90">
                  জমা কনফার্ম করুন
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Ledger Modal */}
      <Dialog open={isLedgerOpen} onOpenChange={setIsLedgerOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedCustomer?.name} - হিসাবের খাতা</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            {!ledger ? (
              <div className="text-center p-8 text-muted-foreground">লোড হচ্ছে...</div>
            ) : ledger.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">কোন লেনদেন পাওয়া যায়নি।</div>
            ) : (
              <div className="space-y-3">
                {ledger.map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center p-4 border rounded-xl bg-card">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${entry.type === 'sale' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                        {entry.type === 'sale' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          {entry.type === 'sale' ? 'বাকি বিক্রি' : 'জমা'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.createdAt), "dd MMM, yyyy - hh:mm a")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${entry.type === 'sale' ? 'text-destructive' : 'text-green-600'}`}>
                        {entry.type === 'sale' ? '+' : '-'} ৳{entry.amount}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium mt-1">
                        বর্তমান বাকি: ৳{entry.balanceAfter}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
