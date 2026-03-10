"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

export type SelectOption = {
  value: string
  label: string
  color?: string
  bg?: string
  border?: string
}

type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

export default function Select({ value, onChange, options, placeholder = "Select...", className = "" }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">("bottom")
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Smart positioning: check if dropdown fits below, otherwise show above
  useEffect(() => {
    if (isOpen && containerRef.current && dropdownRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const dropdownHeight = Math.min(280, options.length * 36 + 8) // estimate
      const spaceBelow = window.innerHeight - containerRect.bottom
      const spaceAbove = containerRect.top

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition("top")
      } else {
        setDropdownPosition("bottom")
      }
    }
  }, [isOpen, options.length])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button - Compact & Colored */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-1.5
          rounded-lg px-2.5 py-1.5 text-xs font-medium
          transition-all
          ${selectedOption?.color && selectedOption?.bg && selectedOption?.border
            ? `${selectedOption.color} ${selectedOption.bg} border ${selectedOption.border}`
            : "bg-[#1e2329] border border-[#2b3139] text-[#eaecef] hover:border-[#474d57]"
          }
          ${isOpen ? "ring-1 ring-[#fcd535]/30" : ""}
        `}
      >
        <span className={selectedOption ? "" : "text-[#848e9c]"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={11}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Panel - Smart positioning */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute left-0 right-0 z-100
            bg-[#181a20] border border-[#2b3139] rounded-lg shadow-2xl
            overflow-hidden
            ${dropdownPosition === "bottom"
              ? "top-full mt-1 origin-top"
              : "bottom-full mb-1 origin-bottom"
            }
            animate-scale-in
          `}
        >
          <div className="py-0.5 max-h-70 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full flex items-center justify-between gap-2 px-2.5 py-1.5
                    text-xs text-left transition-colors
                    ${isSelected
                      ? option.color && option.bg
                        ? `${option.color} ${option.bg} font-semibold`
                        : "text-[#fcd535] bg-[#fcd535]/5 font-semibold"
                      : "text-[#eaecef] hover:bg-[#1e2329]"
                    }
                  `}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check size={12} className={option.color || "text-[#fcd535]"} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
