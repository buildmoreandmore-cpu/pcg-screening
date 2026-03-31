'use client'

import { useState, useEffect } from 'react'

interface Announcement {
  id: string
  message: string
  type: 'info' | 'warning' | 'urgent'
  active: boolean
  expires_at: string | null
  created_at: string
}

const typeLabels = {
  info: { label: 'Info', color: 'bg-navy text-white' },
  warning: { label: 'Warning', color: 'bg-amber-500 text-navy' },
  urgent: { label: 'Urgent', color: 'bg-red-600 text-white' },
}

export default function AnnouncementManager() {
  const [current, setCurrent] = useState<Announcement | null>(null)
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'info' | 'warning' | 'urgent'>('info')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCurrent()
  }, [])

  async function fetchCurrent() {
    setLoading(true)
    const res = await fetch('/api/admin/announcements')
    if (res.ok) {
      const data = await res.json()
      setCurrent(data.announcement || null)
      if (data.announcement) {
        setMessage(data.announcement.message)
        setType(data.announcement.type)
      }
    }
    setLoading(false)
  }

  async function handlePublish() {
    if (!message.trim()) return
    setSaving(true)
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.trim(), type, expires_at: expiresAt || null }),
    })
    if (res.ok) {
      await fetchCurrent()
      setExpiresAt('')
    }
    setSaving(false)
  }

  async function handleRemove() {
    if (!current) return
    setSaving(true)
    await fetch('/api/admin/announcements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: current.id }),
    })
    setCurrent(null)
    setMessage('')
    setType('info')
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-medium text-gray-700">Announcement Banner</h2>
      <p className="text-xs text-gray-400">Set a message that appears at the top of every employer portal page.</p>

      {/* Preview */}
      {message.trim() && (
        <div className={`${typeLabels[type].color} rounded-lg px-4 py-2.5 flex items-center gap-3 text-sm`}>
          <span className="flex-1">{message}</span>
        </div>
      )}

      {/* Message */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs text-gray-600">Message</label>
          <span className={`text-xs ${message.length > 200 ? 'text-red-500' : 'text-gray-400'}`}>
            {200 - message.length} characters remaining
          </span>
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, 200))}
          rows={2}
          placeholder="e.g. Holiday hours: Screenings submitted Dec 24-25 will be processed starting Dec 26."
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold resize-none"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs text-gray-600 mb-1">Type</label>
        <div className="flex gap-2">
          {(Object.keys(typeLabels) as Array<'info' | 'warning' | 'urgent'>).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                type === t ? typeLabels[t].color : 'bg-gray-100 text-gray-500'
              }`}
            >
              {typeLabels[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Expiration */}
      <div>
        <label className="block text-xs text-gray-600 mb-1">Expires (optional)</label>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={e => setExpiresAt(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handlePublish}
          disabled={saving || !message.trim() || message.length > 200}
          className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : current ? 'Update' : 'Publish'}
        </button>
        {current && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      {current && (
        <p className="text-xs text-gray-400">
          Current announcement published {new Date(current.created_at).toLocaleDateString()}
          {current.expires_at && ` · Expires ${new Date(current.expires_at).toLocaleDateString()}`}
        </p>
      )}
    </div>
  )
}
