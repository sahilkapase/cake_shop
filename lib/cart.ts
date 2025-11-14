export interface CartItem {
  cakeId: number
  cakeName: string
  weight: string
  quantity: number
  pricePerUnit: number
  customMessage?: string
}

const CART_STORAGE_KEY = "cart"

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function loadCart(): CartItem[] {
  if (!isBrowser()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error("[cart] Failed to read cart from storage", error)
    return []
  }
}

export function saveCart(items: CartItem[]) {
  if (!isBrowser()) {
    return
  }

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("cartUpdated"))
  } catch (error) {
    console.error("[cart] Failed to write cart to storage", error)
  }
}

export function addToCart(item: CartItem) {
  const cart = loadCart()

  const existingIndex = cart.findIndex((entry) => entry.cakeId === item.cakeId && entry.weight === item.weight)

  if (existingIndex >= 0) {
    cart[existingIndex] = {
      ...cart[existingIndex],
      quantity: cart[existingIndex].quantity + item.quantity,
      customMessage: item.customMessage ?? cart[existingIndex].customMessage,
    }
  } else {
    cart.push(item)
  }

  saveCart(cart)

  // Dispatch custom event to notify other components
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartUpdated"))
  }

  // Vibrate briefly on supported devices to give haptic feedback
  try {
    if (typeof navigator !== "undefined" && typeof (navigator as any).vibrate === "function") {
      // short 50ms vibration; browsers may ignore if not a user gesture
      ;(navigator as any).vibrate(50)
    }
  } catch (e) {
    // ignore vibration errors
  }


export function removeFromCart(key: string) {
  const cart = loadCart()
  const next = cart.filter((item) => `${item.cakeId}-${item.weight}` !== key)

  saveCart(next)

  // Dispatch custom event to notify other components
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cartUpdated"))
  }

  // Vibrate briefly on supported devices to give haptic feedback for removal
  try {
    if (typeof navigator !== "undefined" && typeof (navigator as any).vibrate === "function") {
      ;(navigator as any).vibrate(40)
    }
  } catch (e) {
    // ignore
  }

  return next
}
  return cart
}

