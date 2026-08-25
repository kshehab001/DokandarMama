/**
 * Dashboard — Role + Category Resolver
 *
 * This file is the entry-point for `/app`. It reads the user's role and shop
 * category from ShopThemeContext and delegates to the appropriate role-specific
 * dashboard component.
 *
 * Role hierarchy:
 *   superadmin → SuperAdminDashboard
 *   owner      → OwnerDashboard
 *   manager    → ManagerDashboard
 *   shopkeeper → ShopkeeperDashboard
 *
 * Each sub-dashboard uses `category.quickActions` from the centralized
 * theme-config so new categories automatically get the right UI.
 */
import { useShopTheme } from "@/context/shop-theme-context"
import { SuperAdminDashboard } from "./dashboard/super-admin-dashboard"
import { OwnerDashboard } from "./dashboard/owner-dashboard"
import { ManagerDashboard } from "./dashboard/manager-dashboard"
import { ShopkeeperDashboard } from "./dashboard/shopkeeper-dashboard"

export function Dashboard() {
  const { isSuperAdmin, isOwner, isManager, isShopkeeper } = useShopTheme()

  if (isSuperAdmin) return <SuperAdminDashboard />
  if (isOwner) return <OwnerDashboard />
  if (isManager) return <ManagerDashboard />
  // Default: shopkeeper (also catches any unknown role)
  return <ShopkeeperDashboard />
}
