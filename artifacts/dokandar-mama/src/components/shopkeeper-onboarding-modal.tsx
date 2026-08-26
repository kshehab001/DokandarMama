import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Users, Mic, CheckCircle2, Sparkles, ArrowRight, Store } from "lucide-react"

export function ShopkeeperOnboardingModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    const hasCompleted = localStorage.getItem("dokandar_tutorial_completed")
    if (!hasCompleted) {
      setOpen(true)
    }
  }, [])

  const handleFinish = () => {
    localStorage.setItem("dokandar_tutorial_completed", "true")
    setOpen(false)
  }

  const steps = [
    {
      id: 1,
      title: "১. দ্রুত ক্যাশমেমো ও বিক্রি",
      desc: "ক্যামেরা দিয়ে পণ্যের বারকোড স্ক্যান করুন অথবা নাম দিয়ে খুঁজুন। ১ ক্লিকেই ক্যাশ, বিকাশ বা বাকিতে বিল তৈরি করুন।",
      icon: ShoppingCart,
      color: "bg-primary/10 text-primary border-primary/30",
    },
    {
      id: 2,
      title: "২. সহজ বাকি খাতা",
      desc: "খাতা-কলমের ঝামেলা শেষ! কাস্টমারের মোবাইল নম্বর দিয়ে বাকি লিখুন ও জমা নিন। সব হিসাব থাকবে সুরক্ষিত।",
      icon: Users,
      color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    },
    {
      id: 3,
      title: "৩. ছোটু এআই অ্যাসিস্ট্যান্ট",
      desc: "মাইক বাটনে চেপে বাংলায় বলুন 'আজকের বিক্রি কত?' বা 'লাক্স সাবান কয়টা আছে?' — ছোটু সাথে সাথে হিসাব জানিয়ে দেবে!",
      icon: Mic,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    },
  ]

  const current = steps[step - 1]
  const Icon = current.icon

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl">
        <DialogHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-black">দোকানদার মামা-তে স্বাগতম!</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            আপনার দোকান পরিচালনার জন্য মাত্র ১ মিনিটে মূল ফিচারগুলো জেনে নিন
          </p>
        </DialogHeader>

        <div className="py-4">
          {/* Step Indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s.id === step ? "w-8 bg-primary" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-muted/30 border space-y-3"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${current.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{current.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{current.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="flex flex-row justify-between items-center gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFinish}
            className="text-xs text-muted-foreground rounded-xl"
          >
            স্কিপ করুন
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep((prev) => prev + 1)}
              className="rounded-xl px-5 font-bold gap-1 text-xs"
            >
              <span>পরবর্তী</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinish}
              className="rounded-xl px-6 font-black gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Sparkles className="w-4 h-4" />
              <span>শুরু করুন</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
