type ToastType = "success" | "error" | "warning" | "info"

export type Toast = {
  id: string
  type: ToastType
  message: string
}

type ToastListener = (toasts: Toast[]) => void

class ToastManager {
  private toasts: Toast[] = []
  private listeners: ToastListener[] = []
  private nextId = 0

  subscribe(listener: ToastListener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  private add(type: ToastType, message: string) {
    const id = `toast-${this.nextId++}`
    const toast: Toast = { id, type, message }
    this.toasts.push(toast)
    this.notify()

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      this.remove(id)
    }, 3500)

    return id
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id)
    this.notify()
  }

  success(message: string) {
    return this.add("success", message)
  }

  error(message: string) {
    return this.add("error", message)
  }

  warning(message: string) {
    return this.add("warning", message)
  }

  info(message: string) {
    return this.add("info", message)
  }
}

export const toast = new ToastManager()
