import React, { createContext, useContext, useEffect, useState, useMemo } from "react"
import { useUser } from "@clerk/react"
import {
  customFetch,
  useListShops,
  useGetCurrentShop,
  useUpdateCurrentShop,
  getGetCurrentShopQueryKey,
  getListShopsQueryKey,
  type Shop,
} from "@workspace/api-client-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CATEGORY_THEMES,
  getCategoryTheme,
  type CategoryThemeConfig,
  type ShopCategoryId,
  type UserRole,
} from "@/lib/theme-config"

interface ShopThemeContextValue {
  category: CategoryThemeConfig
  categoryId: ShopCategoryId
  role: UserRole
  activeShop: Shop | null
  allShops: Array<Shop & { role?: string }>
  isSuperAdmin: boolean
  isOwner: boolean
  isManager: boolean
  isShopkeeper: boolean
  setCategoryOverride: (cat: ShopCategoryId | null) => void
  setRoleOverride: (role: UserRole | null) => void
  changeShopCategory: (cat: ShopCategoryId) => Promise<void>
  switchShop: (shopId: number) => void
}

const ShopThemeContext = createContext<ShopThemeContextValue | null>(null)

export function ShopThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const queryClient = useQueryClient()

  const { data: currentShopData } = useGetCurrentShop()
  const { data: allShopsData } = useListShops()
  const updateShopMutation = useUpdateCurrentShop()

  // Local overrides for dynamic preview/testing switcher
  const [categoryOverride, setCategoryOverride] = useState<ShopCategoryId | null>(null)
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null)

  const activeShop = currentShopData?.shop ?? null
  const serverRole = currentShopData?.role ?? "admin" // admin in DB = owner
  const allShops = (allShopsData as Array<Shop & { role?: string }>) ?? []

  // Display-only admin state is always confirmed by the secured server route.
  // Browser metadata and request headers must never grant platform access.
  const isAdminRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/admin")
  const { data: adminAccess } = useQuery({
    queryKey: ["admin-access"],
    queryFn: () => customFetch<{ superAdmin: true }>("/api/admin/access", { responseType: "json" }),
    enabled: Boolean(user) && isAdminRoute,
    retry: false,
  })
  const isSuperAdmin = adminAccess?.superAdmin === true

  // Map server role to user role hierarchy:
  // "admin" -> "owner", "manager" -> "manager", "shopkeeper" -> "shopkeeper"
  const derivedRole: UserRole = useMemo(() => {
    if (isSuperAdmin) return "superadmin"
    if (serverRole === "admin") return "owner"
    if (serverRole === "manager") return "manager"
    return "shopkeeper"
  }, [serverRole, isSuperAdmin])

  // Active Category
  const activeCategoryId: ShopCategoryId = useMemo(() => {
    if (categoryOverride) return categoryOverride
    if (activeShop?.category) {
      return (activeShop.category.toLowerCase() as ShopCategoryId) || "mudi"
    }
    const userMetaCategory = (user?.unsafeMetadata as any)?.shopCategory as ShopCategoryId | undefined
    return userMetaCategory || "mudi"
  }, [categoryOverride, activeShop, user])

  const categoryTheme = useMemo(() => {
    return getCategoryTheme(activeCategoryId)
  }, [activeCategoryId])

  // Dynamically inject CSS variables into document root for seamless real-time theming
  useEffect(() => {
    if (!categoryTheme?.colorHsl) return
    const root = document.documentElement
    root.style.setProperty("--primary", categoryTheme.colorHsl.primary)
    root.style.setProperty("--primary-foreground", categoryTheme.colorHsl.primaryForeground)
    root.style.setProperty("--accent", categoryTheme.colorHsl.accent)
    root.style.setProperty("--accent-foreground", categoryTheme.colorHsl.accentForeground)
    root.style.setProperty("--ring", categoryTheme.colorHsl.ring)
  }, [categoryTheme])

  const changeShopCategory = async (cat: ShopCategoryId) => {
    setCategoryOverride(cat)
    if (activeShop?.id) {
      try {
        await updateShopMutation.mutateAsync({
          data: { category: cat },
        })
        queryClient.invalidateQueries({ queryKey: getGetCurrentShopQueryKey() })
        queryClient.invalidateQueries({ queryKey: getListShopsQueryKey() })
      } catch (e) {
        console.error("Failed to update shop category in DB", e)
      }
    }
    // Also sync to user metadata for instant fallback
    if (user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...(user.unsafeMetadata || {}),
            shopCategory: cat,
          },
        })
      } catch (err) {
        console.error("Failed to update user unsafeMetadata", err)
      }
    }
  }

  const switchShop = (shopId: number) => {
    localStorage.setItem("dokandar_active_shop_id", String(shopId))
    // Clear and invalidate entire query cache so all data refreshes for the active shop
    queryClient.clear()
    queryClient.invalidateQueries()
  }

  const value = useMemo<ShopThemeContextValue>(() => {
    return {
      category: categoryTheme,
      categoryId: activeCategoryId,
      role: derivedRole,
      activeShop,
      allShops,
      isSuperAdmin: derivedRole === "superadmin",
      isOwner: derivedRole === "owner",
      isManager: derivedRole === "manager",
      isShopkeeper: derivedRole === "shopkeeper",
      setCategoryOverride,
      setRoleOverride: () => {},
      changeShopCategory,
      switchShop,
    }
  }, [categoryTheme, activeCategoryId, derivedRole, activeShop, allShops])

  return <ShopThemeContext.Provider value={value}>{children}</ShopThemeContext.Provider>
}

export function useShopTheme() {
  const context = useContext(ShopThemeContext)
  if (!context) {
    throw new Error("useShopTheme must be used within a ShopThemeProvider")
  }
  return context
}
