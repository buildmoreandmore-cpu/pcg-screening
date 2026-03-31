'use client'

import { useState } from 'react'
import { adminSignOut } from '@/app/admin/actions/auth'

export default function AdminSettingsPage() {
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
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="font-heading text-2xl text-navy">Settings</h1>

      {/* Profile */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Profile</h2>
        <p className="text-sm text-gray-500">Profile settings are managed through Supabase Auth. Contact your administrator to update credentials.</p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-700">Notifications</h2>
        <div className="space-y-3">
          {[
            'Email me on every new submission',
            'Email me on payment completed',
            'SLA alert emails (48-hour flag)',
          ].map((label) => (
            <label key={label} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">{label}</span>
              <div className="w-10 h-6 rounded-full bg-gold relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 translate-x-5" />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Data Export */}
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

      {/* Log Out */}
      <button
        onClick={() => adminSignOut()}
        className="w-full text-center py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        Log Out
      </button>
    </div>
  )
}
