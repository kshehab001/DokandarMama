import { Link, useLocation } from "wouter"
import { Home, ShoppingCart, Package, Users, BarChart3, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { VoiceAssistant } from "./voice-assistant"
import { useClerk, useUser } from "@clerk/react"

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "")

const navItems = [
  { href: "/app", label: "ড্যাশবোর্ড", icon: Home },
  { href: "/app/billing", label: "বিলিং", icon: ShoppingCart },
  { href: "/app/inventory", label: "ইনভেন্টরি", icon: Package },
  { href: "/app/customers", label: "কাস্টমার", icon: Users },
  { href: "/app/reports", label: "রিপোর্ট", icon: BarChart3 },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { signOut } = useClerk()
  const { user } = useUser()

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-card-border sticky top-0 z-10">
        <h1 className="text-xl font-bold text-primary">দোকানদার মামা</h1>
        <button
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="text-muted-foreground hover:text-destructive"
          aria-label="লগ আউট"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card sticky top-0 h-[100dvh]">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">দোকানদার মামা</h1>
          {user && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {(user.unsafeMetadata as { shopName?: string } | undefined)?.shopName ||
                user.fullName ||
                user.primaryEmailAddress?.emailAddress}
            </p>
          )}
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-6 h-6" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4">
          <button
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:bg-muted hover:text-destructive w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            লগ আউট
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 relative overflow-y-auto">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">{children}</div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around p-2 z-10 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg min-w-[4rem]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Floating Voice Assistant */}
      <VoiceAssistant />
    </div>
  )
}
