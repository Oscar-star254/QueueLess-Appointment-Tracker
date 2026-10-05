"use client"

// Minimal compositions for typography and choices absent from the local UI kit.
import { useEffect, useId, useRef, useState } from "react"
import type { HTMLAttributes } from "react"
import { ChevronDown, Check } from "lucide-react"
import { Button } from "./ui"
export function Heading({
  level = 2,
  ...props
}: HTMLAttributes<HTMLDivElement> & { level?: 1 | 2 | 3 }) {
  return <div {...props} role="heading" aria-level={level} />
}

export function ChoiceMenu({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const selected = Math.max(0, options.indexOf(value))
  function choose(index: number) {
    onChange(options[index])
    setOpen(false)
  }
  useEffect(() => {
    if (!open) return
    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", outside)
    return () => document.removeEventListener("pointerdown", outside)
  }, [open])
  return (
    <div
      ref={root}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <Button
        type="button"
        variant="secondary"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={id}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        className="!py-2 !text-xs"
        onClick={() => {
          setActive(selected)
          setOpen(!open)
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault()
            event.stopPropagation()
            setOpen(false)
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            const step = event.key === "ArrowDown" ? 1 : -1
            setActive(
              open
                ? (active + step + options.length) % options.length
                : selected,
            )
            setOpen(true)
          } else if (open && (event.key === "Home" || event.key === "End")) {
            event.preventDefault()
            setActive(event.key === "Home" ? 0 : options.length - 1)
          } else if (open && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault()
            choose(active)
          } else if (event.key === "Tab") {
            setOpen(false)
          }
        }}
      >
        {value}
        <ChevronDown size={13} aria-hidden="true" />
      </Button>
      {open && (
        <div
          id={id}
          role="listbox"
          aria-label={label}
          className="absolute right-0 z-20 mt-1 min-w-full rounded-lg border border-line bg-white p-1 shadow-lg"
        >
          {options.map((option, index) => (
            <Button
              id={`${id}-${index}`}
              key={option}
              type="button"
              variant="ghost"
              role="option"
              aria-selected={option === value}
              tabIndex={-1}
              className={`w-full !justify-start whitespace-nowrap !px-3 !py-2 !text-xs ${
                active === index ? "!bg-brand-50 !text-brand-800" : ""
              }`}
              onPointerMove={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              {option}
              {option === value && <Check size={13} aria-hidden="true" />}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
