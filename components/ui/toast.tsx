'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './button'

interface ToastOptions {
  actionLabel?: string
  onAction?: () => void
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

interface Toast {
  id: number
  message: string
  options?: ToastOptions
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message, options }])
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

  const handleAction = (id: number, onAction?: () => void) => {
    if (onAction) onAction()
    setToasts((t) => t.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="bg-gray-800 text-white px-3 py-2 rounded shadow flex items-center gap-2"
            >
              <span className="flex-1">{toast.message}</span>
              {toast.options?.actionLabel && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction(toast.id, toast.options?.onAction)}
                >
                  {toast.options.actionLabel}
                </Button>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
