'use client'

import { useState, useTransition } from 'react'
import { deleteClient, permanentlyDeleteClient } from '@/app/admin/actions/clients'

export default function ClientDeleteButton({
  clientId,
  clientName,
  active,
}: {
  clientId: string
  clientName: string
  active: boolean
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [confirmName, setConfirmName] = useState('')
  const [pending, startTransition] = useTransition()

  // Active client → soft-delete (deactivate). Inactive client → hard-delete.
  const isHardDelete = !active

  function handleConfirm() {
    if (isHardDelete && confirmName.trim() !== clientName) {
      setError(`Type "${clientName}" exactly to confirm permanent deletion.`)
      return
    }

    setError('')
    startTransition(async () => {
      const result = isHardDelete
        ? await permanentlyDeleteClient({ clientId })
        : await deleteClient({ clientId })

      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setConfirmName('')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isHardDelete ? `Permanently delete ${clientName}` : `Deactivate ${clientName}`}
        className={`transition-colors p-1 rounded ${
          isHardDelete ? 'text-red-400 hover:text-red-700' : 'text-gray-400 hover:text-red-600'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {isHardDelete ? (
              <>
                <h3 className="font-heading text-lg text-red-700">Permanently delete {clientName}?</h3>
                <p className="text-sm text-gray-600 mt-2">
                  This removes the client, every linked portal user, and their Supabase auth records. <strong>This cannot be undone.</strong>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  If candidates are still linked to this client, deletion will be refused.
                </p>
                <label className="block text-xs font-medium text-gray-700 mt-4 mb-1.5">
                  Type <span className="font-mono text-red-600">{clientName}</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  disabled={pending}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  autoFocus
                />
              </>
            ) : (
              <>
                <h3 className="font-heading text-lg text-navy">Deactivate {clientName}?</h3>
                <p className="text-sm text-gray-600 mt-2">
                  This will deactivate the client and hide them from active lists. Existing candidates and history are preserved. You can permanently delete them later from this same icon.
                </p>
              </>
            )}

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => { setOpen(false); setConfirmName(''); setError('') }}
                disabled={pending}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                  isHardDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-navy hover:bg-navy-light'
                }`}
              >
                {pending
                  ? (isHardDelete ? 'Deleting…' : 'Deactivating…')
                  : (isHardDelete ? 'Permanently Delete' : 'Deactivate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
