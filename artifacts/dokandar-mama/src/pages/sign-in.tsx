import { SignIn } from "@clerk/react"
import { Store, UserCog, User2, ArrowLeft } from "lucide-react"
import { Link } from "wouter"

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")

const roleConfig = {
  owner: {
    icon: Store,
    label: "দোকানের মালিক",
    labelEn: "Shop Owner",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconBg: "bg-emerald-500",
    desc: "মালিক হিসেবে লগ ইন করে আপনার দোকান পরিচালনা করুন",
  },
  manager: {
    icon: UserCog,
    label: "ম্যানেজার",
    labelEn: "Manager",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    iconBg: "bg-blue-500",
    desc: "ম্যানেজার হিসেবে লগ ইন করে দোকান পরিচালনা করুন",
  },
  shopkeeper: {
    icon: User2,
    label: "দোকানদার / ক্যাশিয়ার",
    labelEn: "Shopkeeper / Cashier",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    iconBg: "bg-orange-500",
    desc: "দোকানদার হিসেবে লগ ইন করে বিলিং শুরু করুন",
  },
}

export function SignInPage() {
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  const roleParam = params.get("role") as keyof typeof roleConfig | null
  const config = roleParam && roleConfig[roleParam] ? roleConfig[roleParam] : null

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-8 gap-4">
      {/* Back to home */}
      <div className="w-full max-w-md">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" />
            ফিরে যান
          </button>
        </Link>

        {/* Role context banner */}
        {config ? (
          <div className={`flex items-center gap-3 rounded-2xl border p-4 ${config.color}`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
              <config.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm">{config.label}</div>
              <div className="text-xs opacity-75">{config.desc}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <img src={`${basePath}/logo.svg`} alt="দোকানদার মামা" className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">দোকানদার মামা লগ ইন</div>
              <div className="text-xs text-muted-foreground">আপনার অ্যাকাউন্টে প্রবেশ করুন</div>
            </div>
          </div>
        )}
      </div>

      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up${roleParam ? `?role=${roleParam}` : ""}`}
      />
    </div>
  )
}
