'use client'

import { useState } from 'react'
import { adminSignOut } from '@/app/admin/actions/auth'

export default function AdminSettingsActions() {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `pcg-export-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      alert('Export failed')
    }
    setExporting(false)
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4 border border-red-100">
        <h2 className="text-sm font-medium text-red-700">Data Export</h2>
        <p className="text-sm text-gray-500">Export all candidate and client data as CSV.</p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export All Data'}
        </button>
      </div>

      <button
        onClick={() => adminSignOut()}
        className="w-full text-center py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        Log Out
      </button>
    </>
  )
}
