import { SignUp } from "@clerk/react"
import { Info, UserPlus, Store } from "lucide-react"

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")

export function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-8 gap-4">
      {/* Role guidance banner */}
      <div className="w-full max-w-md">
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
                <UserPlus className="h-3.5 w-3.5" />
                কর্মী / ম্যানেজার
              </div>
              <p className="text-amber-700 leading-snug">
                অ্যাকাউন্ট তৈরি করুন — পরের ধাপে মালিকের দেওয়া ইনভাইট কোড দিন।
              </p>
            </div>
          </div>
        </div>
      </div>

      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  )
}
