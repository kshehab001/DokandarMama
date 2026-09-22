import { useState } from "react"
import { Link } from "wouter"
import { ShoppingBag, Mic, Users, BarChart3, ScanLine, Store, UserCog, User2, ChevronRight, Star, Shield, Package, BookOpen, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")

const features = [
  { icon: ShoppingBag, title: "সহজ বিলিং", desc: "বারকোড স্ক্যান করে বা হাতে বেছে দ্রুত বিল তৈরি করুন" },
  { icon: Users, title: "বাকির হিসাব", desc: "কাস্টমারের বাকি ও পরিশোধের হিসাব এক জায়গায়" },
  { icon: Mic, title: "কথায় কথায় হিসাব", desc: "বাংলায় কথা বলেই আজকের বিক্রি বা বাকি জেনে নিন" },
  { icon: BarChart3, title: "বিক্রির রিপোর্ট", desc: "দৈনিক-মাসিক বিক্রি ও স্টকের অবস্থা এক নজরে" },
]

const roles = [
  {
    id: "owner",
    icon: Store,
    title: "দোকানের মালিক",
    titleEn: "Shop Owner",
    desc: "নতুন দোকান খুলুন এবং সম্পূর্ণ ব্যবস্থাপনা করুন",
    descEn: "Create & manage your shop, inventory, reports & team",
    features: ["সম্পূর্ণ ম্যানেজমেন্ট", "রিপোর্ট ও অ্যানালিটিক্স", "স্টাফ যুক্ত করুন"],
    color: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-200 hover:border-emerald-400",
    bgHover: "hover:bg-emerald-50/50",
    badgeColor: "bg-emerald-100 text-emerald-700",
    href: `/sign-up?role=owner`,
    loginHref: `/sign-in?role=owner`,
    cta: "মালিক অ্যাকাউন্ট তৈরি করুন",
    loginCta: "মালিক লগ ইন",
  },
  {
    id: "manager",
    icon: UserCog,
    title: "ম্যানেজার",
    titleEn: "Manager",
    desc: "দোকান পরিচালনা করুন, বিক্রি ও ক্যাশ ম্যানেজমেন্ট করুন",
    descEn: "Manage sales, cashbox, inventory & customer accounts",
    features: ["বিক্রি পরিচালনা", "ক্যাশবক্স কন্ট্রোল", "ইনভেন্টরি আপডেট"],
    color: "from-blue-500 to-indigo-600",
    borderColor: "border-blue-200 hover:border-blue-400",
    bgHover: "hover:bg-blue-50/50",
    badgeColor: "bg-blue-100 text-blue-700",
    href: `/sign-up?role=manager`,
    loginHref: `/sign-in?role=manager`,
    cta: "ম্যানেজার অ্যাকাউন্ট তৈরি করুন",
    loginCta: "ম্যানেজার লগ ইন",
  },
  {
    id: "shopkeeper",
    icon: User2,
    title: "দোকানদার / ক্যাশিয়ার",
    titleEn: "Shopkeeper / Cashier",
    desc: "দ্রুত বিল তৈরি করুন, বাকির হিসাব রাখুন",
    descEn: "Quick billing, credit tracking & daily sales",
    features: ["দ্রুত বিলিং (POS)", "বাকির হিসাব", "দৈনিক বিক্রি"],
    color: "from-orange-500 to-amber-600",
    borderColor: "border-orange-200 hover:border-orange-400",
    bgHover: "hover:bg-orange-50/50",
    badgeColor: "bg-orange-100 text-orange-700",
    href: `/sign-up?role=shopkeeper`,
    loginHref: `/sign-in?role=shopkeeper`,
    cta: "দোকানদার অ্যাকাউন্ট তৈরি করুন",
    loginCta: "দোকানদার লগ ইন",
  },
]

export function Landing() {
  const [activeMode, setActiveMode] = useState<"login" | "signup">("login")

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-10 py-5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center">
            <img src={`${basePath}/logo.svg`} alt="দোকানদার মামা" className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-primary">দোকানদার মামা</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMode("login")}
            className={cn(
              "px-4 py-1.5 rounded-xl text-sm font-medium transition-all",
              activeMode === "login"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            লগ ইন
          </button>
          <button
            onClick={() => setActiveMode("signup")}
            className={cn(
              "px-4 py-1.5 rounded-xl text-sm font-medium transition-all",
              activeMode === "signup"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            নিবন্ধন
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-4 pt-10 pb-6">
        <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-5">
          <ScanLine className="h-4 w-4" />
          বাংলায় দোকান চালানোর সবচেয়ে সহজ উপায়
        </div>

        <h1 className="text-2xl md:text-4xl font-bold text-foreground max-w-2xl leading-tight mb-3 text-center">
          আপনার দোকানের হিসাব, এখন এক অ্যাপেই
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl mb-10 text-center">
          বিলিং, বাকি, স্টক আর রিপোর্ট — সব বাংলায়, সহজ ভাষায়।
        </p>

        {/* Role Selection Cards */}
        <div className="w-full max-w-4xl">
          <div className="text-center mb-5">
            <span className="text-sm font-semibold text-foreground">
              {activeMode === "login" ? "আপনি কে? বেছে নিন এবং লগ ইন করুন" : "আপনি কে? বেছে নিন এবং শুরু করুন"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((role) => {
              const Icon = role.icon
              const href = activeMode === "login" ? role.loginHref : role.href
              return (
                <Link key={role.id} href={href}>
                  <div
                    className={cn(
                      "group relative rounded-2xl border-2 bg-card p-5 cursor-pointer transition-all duration-200",
                      role.borderColor,
                      role.bgHover,
                      "shadow-sm hover:shadow-md"
                    )}
                  >
                    {/* Role Icon */}
                    <div className={cn("h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-3", role.color)}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Title */}
                    <div className="mb-1">
                      <h3 className="font-bold text-foreground text-base">{role.title}</h3>
                      <p className="text-xs text-muted-foreground">{role.titleEn}</p>
                    </div>

                    {/* Desc */}
                    <p className="text-sm text-muted-foreground mb-3 leading-snug">{role.desc}</p>

                    {/* Feature badges */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {role.features.map((f) => (
                        <span key={f} className={cn("text-xs px-2 py-0.5 rounded-full font-medium", role.badgeColor)}>
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                      {activeMode === "login" ? role.loginCta : role.cta}
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Toggle hint */}
          <div className="text-center mt-6 text-sm text-muted-foreground">
            {activeMode === "login" ? (
              <>নতুন ব্যবহারকারী?{" "}
                <button onClick={() => setActiveMode("signup")} className="text-primary font-semibold hover:underline">
                  অ্যাকাউন্ট তৈরি করুন
                </button>
              </>
            ) : (
              <>আগেই অ্যাকাউন্ট আছে?{" "}
                <button onClick={() => setActiveMode("login")} className="text-primary font-semibold hover:underline">
                  লগ ইন করুন
                </button>
              </>
            )}
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-12 max-w-4xl w-full">
          {features.map((f) => (
            <div key={f.title} className="bg-card border border-card-border rounded-2xl p-4 text-left">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-snug">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-sm text-muted-foreground py-5">
        © {new Date().getFullYear()} দোকানদার মামা — সব অধিকার সংরক্ষিত
      </footer>
    </div>
  )
}
