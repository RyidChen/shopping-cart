import { defineStore } from 'pinia'
import type { Product } from '../types/commerce'

export type CartItem = {
  lineId: string
  productId: string
  slug: string
  name: string
  image: string
  unitPrice: number
  inventory: number
  selectedOptions: Record<string, string>
  quantity: number
}

const createLineId = (productId: string, selectedOptions: Record<string, string>) =>
  `${productId}:${JSON.stringify(Object.entries(selectedOptions).sort(([left], [right]) => left.localeCompare(right)))}`

const storageKey = 'curio-cart'

const clampQuantity = (quantity: number, inventory: number) =>
  Math.min(Math.max(Math.trunc(quantity), 1), inventory)

const readItems = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) : []
  } catch {
    localStorage.removeItem(storageKey)
    return []
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({ items: readItems() }),
  getters: {
    itemCount: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    subtotal: (state) => state.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
  },
  actions: {
    persist() {
      localStorage.setItem(storageKey, JSON.stringify(this.items))
    },
    addItem(product: Product, selectedOptions: Record<string, string>, quantity = 1) {
      if (!Number.isFinite(product.inventory) || product.inventory <= 0) return
      const lineId = createLineId(product.id, selectedOptions)
      const existing = this.items.find((item) => item.lineId === lineId)
      if (existing) {
        existing.quantity = clampQuantity(existing.quantity + quantity, existing.inventory)
        this.persist()
        return
      }
      this.items.push({
        lineId, productId: product.id, slug: product.slug,
        name: product.name, image: product.images[0] ?? '', unitPrice: product.price,
        inventory: product.inventory, selectedOptions: { ...selectedOptions }, quantity: clampQuantity(quantity, product.inventory),
      })
      this.persist()
    },
    setQuantity(lineId: string, quantity: number) {
      const item = this.items.find((line) => line.lineId === lineId)
      if (item) item.quantity = clampQuantity(quantity, item.inventory)
      this.persist()
    },
    removeItem(lineId: string) {
      this.items = this.items.filter((item) => item.lineId !== lineId)
      this.persist()
    },
    clearCart() {
      try {
        localStorage.setItem(storageKey, '[]')
        this.items = []
        return true
      } catch {
        return false
      }
    },
    restoreCart(snapshot: CartItem[]) {
      const items = snapshot.map((item) => ({ ...item, selectedOptions: { ...item.selectedOptions } }))
      try {
        localStorage.setItem(storageKey, JSON.stringify(items))
        this.items = items
        return true
      } catch {
        return false
      }
    },
  },
})
