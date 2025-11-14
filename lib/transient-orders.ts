type TransientOrder = any

const transientStore = new Map<string, TransientOrder>()

export function saveTransientOrder(id: string, order: TransientOrder) {
  transientStore.set(id, order)
}

export function getTransientOrder(id: string) {
  return transientStore.get(id) ?? null
}

export function clearTransientOrder(id: string) {
  transientStore.delete(id)
}

export function listTransientOrders() {
  return Array.from(transientStore.values())
}

export { transientStore }
