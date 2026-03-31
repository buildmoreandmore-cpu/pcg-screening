'use client'

import { useState } from 'react'
import { updateCandidateStatus } from '@/app/admin/actions/candidates'

const statuses = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function CandidateStatusUpdate({
  candidateId,
  currentStatus,
  candidateName,
}: {
  candidateId: string
  currentStatus: string
  candidateName: string
}) {
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleUpdate() {
    if (status === currentStatus && !notes) return
    setLoading(true)
    setFeedback(null)

    const result = await updateCandidateStatus({
      candidateId,
      newStatus: status,
      notes: notes || undefined,
    })

    setLoading(false)

    if (result.error) {
      setFeedback({ type: 'error', message: result.error })
    } else {
      setFeedback({ type: 'success', message: 'Status updated. Notifications sent.' })
      setNotes('')
      // Refresh page to show updated data
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-gold">
      <h2 className="text-sm font-medium text-gray-700 mb-3">Update Status</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note (optional)..."
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
        />
        <button
          onClick={handleUpdate}
          disabled={loading || (status === currentStatus && !notes)}
          className="bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </div>
      {feedback && (
        <p className={`text-sm mt-2 ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {feedback.message}
        </p>
      )}
    </div>
  )
}
