import { Link } from "wouter"
import { ShoppingBag, Mic, Users, BarChart3, ScanLine } from "lucide-react"
import { Button } from "@/components/ui/button"

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")

const features = [
  { icon: ShoppingBag, title: "সহজ বিলিং", desc: "বারকোড স্ক্যান করে বা হাতে বেছে দ্রুত বিল তৈরি করুন" },
  { icon: Users, title: "বাকির হিসাব", desc: "কাস্টমারের বাকি ও পরিশোধের হিসাব এক জায়গায়" },
  { icon: Mic, title: "কথায় কথায় হিসাব", desc: "বাংলায় কথা বলেই আজকের বিক্রি বা বাকি জেনে নিন" },
  { icon: BarChart3, title: "বিক্রির রিপোর্ট", desc: "দৈনিক-মাসিক বিক্রি ও স্টকের অবস্থা এক নজরে" },
]

export function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="flex items-center justify-between px-4 md:px-10 py-5">
        <div className="flex items-center gap-2">
          <img src={`${basePath}/logo.svg`} alt="দোকানদার মামা" className="h-9 w-9" />
          <span className="text-xl font-bold text-primary">দোকানদার মামা</span>
        </div>
        <Link href="/sign-in">
          <Button variant="outline" className="rounded-xl">লগ ইন</Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 md:py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <ScanLine className="h-4 w-4" />
          বাংলায় দোকান চালানোর সবচেয়ে সহজ উপায়
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground max-w-2xl leading-tight mb-4">
          আপনার দোকানের হিসাব, এখন এক অ্যাপেই
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mb-8">
          বিলিং, বাকি, স্টক আর রিপোর্ট — সব বাংলায়, সহজ ভাষায়। কথা বলেও হিসাব জানতে পারবেন।
        </p>
        <Link href="/sign-up">
          <Button size="lg" className="rounded-xl h-12 px-8 text-base">শুরু করুন — ফ্রি</Button>
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-4xl w-full">
          {features.map((f) => (
            <div key={f.title} className="bg-card border border-card-border rounded-2xl p-5 text-left">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-sm text-muted-foreground py-6">
        © {new Date().getFullYear()} দোকানদার মামা
      </footer>
    </div>
  )
}
