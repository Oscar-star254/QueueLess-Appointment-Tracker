"use client"
import { forwardRef, useEffect, useId, useRef } from "react"
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"
import { X, Hammer } from "lucide-react"

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-900 text-white">
        <Hammer size={20} strokeWidth={1.7} />
      </span>
      {!compact && (
        <span className="font-display text-xl font-extrabold tracking-tight">
          fundi<span className="text-brand-600">find</span>
          <span className="text-brand-600">.</span>
        </span>
      )}
    </div>
  )
}
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost"
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
        variant === "primary"
          ? "bg-brand-900 text-white hover:bg-brand-700"
          : variant === "secondary"
            ? "border border-line bg-white text-ink hover:bg-brand-50"
            : "text-muted hover:bg-brand-50 hover:text-brand-900"
      } ${className}`}
    >
      {children}
    </button>
  )
}
export const Input =
  forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    function Input({ className = "", ...props }, ref) {
      return (
        <input
          ref={ref}
          {...props}
          className={`w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 ${className}`}
        />
      )
    },
  )
export const FileInput =
  forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    function FileInput(props, ref) {
      return <input ref={ref} {...props} />
    },
  )
export const Select =
  forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
    function Select({ className = "", ...props }, ref) {
      return (
        <select
          ref={ref}
          {...props}
          className={`w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 ${className}`}
        />
      )
    },
  )
export const Textarea =
  forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
    function Textarea({ className = "", ...props }, ref) {
      return (
        <textarea
          ref={ref}
          {...props}
          className={`w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 ${className}`}
        />
      )
    },
  )
export function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-line bg-white ${className}`}>
      {children}
    </section>
  )
}
export function Badge({
  children,
  tone = "green",
}: {
  children: ReactNode
  tone?: "green" | "amber" | "gray"
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
        tone === "green"
          ? "bg-brand-50 text-brand-700"
          : tone === "amber"
            ? "bg-amber-50 text-amber-700"
            : "bg-gray-100 text-gray-600"
      }`}
    >
      {children}
    </span>
  )
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed m-auto w-full max-w-lg rounded-2xl border border-line bg-white p-6 text-ink shadow-xl"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 id={titleId} className="font-display text-xl font-bold">
          {title}
        </h2>
        <Button
          variant="ghost"
          onClick={onClose}
          className="!p-1.5"
          aria-label="Close dialog"
        >
          <X size={20} />
        </Button>
      </div>
      {children}
    </dialog>
  )
}
