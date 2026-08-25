import React from "react"
import { Link } from "wouter"
import { useShopTheme } from "@/context/shop-theme-context"
import { type UserRole } from "@/lib/theme-config"
import { ShieldAlert, Store, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RoleGuardProps {
  children: React.ReactNode
  minRole?: "shopkeeper" | "manager" | "owner" | "superadmin"
  allowedRoles?: UserRole[]
  fallbackTitle?: string
  fallbackMessage?: string
}

const ROLE_RANK: Record<UserRole, number> = {
  superadmin: 4,
  owner: 3,
  manager: 2,
  shopkeeper: 1,
}

const ROLE_TITLES: Record<UserRole, string> = {
  superadmin: "প্ল্যাটফর্ম সুপার অ্যাডমিন",
  owner: "দোকানের মালিক (Owner)",
  manager: "দোকানের ম্যানেজার (Manager)",
  shopkeeper: "সেলস স্টাফ / দোকানদার (Shopkeeper)",
}

export function RoleGuard({
  children,
  minRole = "shopkeeper",
  allowedRoles,
  fallbackTitle,
  fallbackMessage,
}: RoleGuardProps) {
  const { role, isSuperAdmin, isOwner, isManager, isShopkeeper } = useShopTheme()

  const isAllowed = React.useMemo(() => {
    if (allowedRoles && allowedRoles.length > 0) {
      return allowedRoles.includes(role)
    }
    return ROLE_RANK[role] >= ROLE_RANK[minRole]
  }, [role, minRole, allowedRoles])

  if (isAllowed) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <Card className="max-w-md w-full rounded-3xl border-border/80 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-amber-500/10 via-destructive/5 to-transparent p-6 flex flex-col items-center">
          <div className="p-4 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 mb-3 shadow-inner">
            <ShieldAlert className="h-10 w-10 animate-bounce" />
          </div>
          <Badge variant="outline" className="mb-2 font-semibold text-xs border-amber-500/30 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
            বর্তমান রোল: {ROLE_TITLES[role] || role}
          </Badge>
          <h2 className="text-xl font-extrabold text-foreground">
            {fallbackTitle || "এই পেজে প্রবেশের অনুমতি নেই"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {fallbackMessage ||
              "আপনার বর্তমান রোলটি এই পাতার তথ্য দেখার বা পরিবর্তন করার জন্য উপযুক্ত নয়। দোকানের মালিক বা ম্যানেজারের সাথে যোগাযোগ করুন।"}
          </p>
        </div>

        <CardContent className="p-6 pt-2 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="default" className="rounded-xl h-11 font-bold">
              <Link href="/app">
                <Store className="h-4 w-4 mr-2" />
                ড্যাশবোর্ড
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl h-11 font-bold">
              <Link href="/app/billing">
                <ShoppingBag className="h-4 w-4 mr-2" />
                বিলিং / POS
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
