import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkOrder } from '../types'

interface OrdersStore {
  orders: WorkOrder[]
  selectedOrder: WorkOrder | null
  loading: boolean
  setOrders: (orders: WorkOrder[]) => void
  setSelectedOrder: (o: WorkOrder | null) => void
  upsertOrder: (o: WorkOrder) => void
  setLoading: (v: boolean) => void
}

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set, get) => ({
      orders: [],
      selectedOrder: null,
      loading: false,

      setOrders: (orders) => set({ orders }),
      setSelectedOrder: (selectedOrder) => set({ selectedOrder }),

      upsertOrder: (o) => {
        const existing = get().orders.findIndex((x) => x._id === o._id)
        if (existing >= 0) {
          const next = [...get().orders]
          next[existing] = o
          set({ orders: next })
        } else {
          set({ orders: [o, ...get().orders] })
        }
        if (get().selectedOrder?._id === o._id) set({ selectedOrder: o })
      },

      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'dt-orders',
      // Keep up to 30 most recent orders (full data incl. stageHistory)
      // so detail page loads instantly from cache
      partialize: (s) => ({
        orders: s.orders.slice(0, 30),
        selectedOrder: s.selectedOrder,
      }),
    },
  ),
)
