import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type SheetContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

function useSheetContext() {
  const ctx = React.useContext(SheetContext)
  if (!ctx) {
    throw new Error('Sheet components must be used within Sheet')
  }
  return ctx
}

type SheetProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Sheet({ open = false, onOpenChange, children }: SheetProps) {
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      onOpenChange?.(next)
    },
    [onOpenChange],
  )

  return (
    <SheetContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

type SheetContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: 'right' | 'left'
}

export function SheetContent({
  side = 'right',
  className,
  children,
  ...props
}: SheetContentProps) {
  const { open, onOpenChange } = useSheetContext()

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed z-50 flex flex-col bg-background shadow-lg transition ease-in-out',
          side === 'right' && 'inset-y-0 right-0 h-full border-l',
          side === 'left' && 'inset-y-0 left-0 h-full border-r',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>,
    document.body,
  )
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

export function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className,
      )}
      {...props}
    />
  )
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
}
