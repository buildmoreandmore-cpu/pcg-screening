'use client'

import { useState } from 'react'

type Item = { q: string; a: string }
type Category = { category: string; items: Item[] }

export default function FaqAccordion({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="space-y-10">
      {categories.map((cat) => (
        <div key={cat.category}>
          <h2 className="font-heading text-navy text-2xl mb-4">{cat.category}</h2>
          <div className="space-y-2">
            {cat.items.map((item, idx) => {
              const id = `${cat.category}-${idx}`
              const isOpen = open === id
              return (
                <div key={id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : id)}
                    className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm md:text-base font-medium text-navy">{item.q}</span>
                    <svg
                      className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 -mt-1">
                      <p className="text-sm text-gray-700 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
