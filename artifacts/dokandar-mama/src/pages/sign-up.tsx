import { SignUp } from "@clerk/react"
import { Store, UserCog, User2, ArrowLeft, Info } from "lucide-react"
import { Link } from "wouter"

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")

const roleConfig = {
  owner: {
    icon: Store,
    label: "দোকানের মালিক",
    labelEn: "Shop Owner",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    iconBg: "bg-emerald-500",
    desc: "অ্যাকাউন্ট তৈরি করুন — পরের ধাপে আপনার দোকান সেট আপ করতে পারবেন।",
  },
  manager: {
    icon: UserCog,
    label: "ম্যানেজার",
    labelEn: "Manager",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    iconBg: "bg-blue-500",
    desc: "অ্যাকাউন্ট তৈরি করুন — পরের ধাপে মালিকের দেওয়া ইনভাইট কোড দিয়ে যুক্ত হোন।",
  },
  shopkeeper: {
    icon: User2,
    label: "দোকানদার / ক্যাশিয়ার",
    labelEn: "Shopkeeper / Cashier",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    iconBg: "bg-orange-500",
    desc: "অ্যাকাউন্ট তৈরি করুন — পরের ধাপে মালিকের দেওয়া ইনভাইট কোড দিয়ে দোকানে যুক্ত হোন।",
  },
}

export function SignUpPage() {
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
          <div className={`flex items-start gap-3 rounded-2xl border p-4 ${config.color}`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
              <config.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm">
                {config.label} <span className="font-normal opacity-60 text-xs">· {config.labelEn}</span>
              </div>
              <div className="text-xs mt-0.5 opacity-80 leading-snug">{config.desc}</div>
            </div>
          </div>
        ) : (
          /* Generic banner when no role selected */
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <Info className="h-4 w-4 flex-shrink-0" />
              অ্যাকাউন্ট তৈরির আগে পড়ুন
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-1 rounded-xl bg-white border border-amber-100 p-3">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Store className="h-3.5 w-3.5" />
                  দোকানের মালিক
                </div>
                <p className="text-amber-700 leading-snug">
                  অ্যাকাউন্ট তৈরি করুন — পরের ধাপে আপনার দোকান সেট আপ করতে পারবেন।
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-xl bg-white border border-amber-100 p-3">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <UserCog className="h-3.5 w-3.5" />
                  কর্মী / ম্যানেজার
                </div>
                <p className="text-amber-700 leading-snug">
                  অ্যাকাউন্ট তৈরি করুন — পরের ধাপে মালিকের দেওয়া ইনভাইট কোড দিন।
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in${roleParam ? `?role=${roleParam}` : ""}`}
      />
    </div>
  )
}
