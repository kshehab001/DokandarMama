import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

export interface QueuedSale {
  idempotencyKey: string
  payload: any
  timestamp: number
  retryCount: number
}

export interface QueuedPayment {
  idempotencyKey: string
  customerId: number
  payload: any
  timestamp: number
  retryCount: number
}

/** Returns the currently active shop ID stored by ShopThemeProvider */
function getActiveShopId(): string {
  return localStorage.getItem("dokandar_active_shop_id") ?? "0"
}

function storageKeys() {
  const shopId = getActiveShopId()
  return {
    SALES_QUEUE: `dokandar_offline_sales_queue_${shopId}`,
    PAYMENTS_QUEUE: `dokandar_offline_payments_queue_${shopId}`,
    CACHED_PRODUCTS: `dokandar_offline_products_cache_${shopId}`,
    CACHED_CUSTOMERS: `dokandar_offline_customers_cache_${shopId}`,
  }
}

// Queue Management
export function getOfflineSalesQueue(): QueuedSale[] {
  try {
    const raw = localStorage.getItem(storageKeys().SALES_QUEUE)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveOfflineSalesQueue(queue: QueuedSale[]) {
  try {
    localStorage.setItem(storageKeys().SALES_QUEUE, JSON.stringify(queue))
  } catch {}
}

export function queueOfflineSale(payload: any): string {
  const idempotencyKey = "sale_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9)
  const queue = getOfflineSalesQueue()
  queue.push({
    idempotencyKey,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
  })
  saveOfflineSalesQueue(queue)
  return idempotencyKey
}

export function getOfflinePaymentsQueue(): QueuedPayment[] {
  try {
    const raw = localStorage.getItem(storageKeys().PAYMENTS_QUEUE)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveOfflinePaymentsQueue(queue: QueuedPayment[]) {
  try {
    localStorage.setItem(storageKeys().PAYMENTS_QUEUE, JSON.stringify(queue))
  } catch {}
}

export function queueOfflinePayment(customerId: number, payload: any): string {
  const idempotencyKey = "pay_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9)
  const queue = getOfflinePaymentsQueue()
  queue.push({
    idempotencyKey,
    customerId,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
  })
  saveOfflinePaymentsQueue(queue)
  return idempotencyKey
}

export function getPendingQueueCount(): number {
  return getOfflineSalesQueue().length + getOfflinePaymentsQueue().length
}

/**
 * Executes sync of all offline queued actions to the server
 */
export async function syncOfflineQueueToServer(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  // 1. Sync sales
  const salesQueue = getOfflineSalesQueue()
  const remainingSales: QueuedSale[] = []

  for (const item of salesQueue) {
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": item.idempotencyKey,
          "x-shop-id": getActiveShopId(),
        },
        body: JSON.stringify(item.payload),
      })
      if (res.ok || res.status === 409) {
        // 409 Conflict indicates already submitted/synced previously
        synced++
      } else {
        item.retryCount++
        if (item.retryCount < 5) remainingSales.push(item)
        else failed++
      }
    } catch {
      item.retryCount++
      remainingSales.push(item)
    }
  }
  saveOfflineSalesQueue(remainingSales)

  // 2. Sync payments
  const paymentsQueue = getOfflinePaymentsQueue()
  const remainingPayments: QueuedPayment[] = []

  for (const item of paymentsQueue) {
    try {
      const res = await fetch(`/api/customers/${item.customerId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": item.idempotencyKey,
          "x-shop-id": getActiveShopId(),
        },
        body: JSON.stringify(item.payload),
      })
      if (res.ok || res.status === 409) {
        synced++
      } else {
        item.retryCount++
        if (item.retryCount < 5) remainingPayments.push(item)
        else failed++
      }
    } catch {
      item.retryCount++
      remainingPayments.push(item)
    }
  }
  saveOfflinePaymentsQueue(remainingPayments)

  return { synced, failed }
}

/**
 * React hook for offline network state & synchronization
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  )
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(() => getPendingQueueCount())
  const { toast } = useToast()

  const runSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return
    setIsSyncing(true)
    try {
      const result = await syncOfflineQueueToServer()
      setPendingCount(getPendingQueueCount())
      if (result.synced > 0) {
        toast({
          title: "অফলাইন ডাটা সিঙ্ক সম্পন্ন হয়েছে",
          description: `${result.synced} টি লেনদেন সার্ভারে সেভ হয়েছে`,
        })
      }
    } catch (err) {
      console.warn("Offline sync error", err)
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, toast])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      void runSync()
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check on mount
    if (navigator.onLine && getPendingQueueCount() > 0) {
      void runSync()
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [runSync])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    runSync,
  }
}
