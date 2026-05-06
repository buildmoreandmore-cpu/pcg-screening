'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import PackageComponentsModal, { type PackageDraft } from './PackageComponentsModal'
import {
  createClientPackage,
  updateClientPackage,
  deleteClientPackage,
} from '@/app/admin/actions/packages'
import { countComponents, drugPanelLabel } from '@/lib/screening-components'

type ClientPackage = {
  id: string
  name: string
  price_cents: number
  description: string | null
  components: Record<string, boolean>
  custom_notes: string | null
  drug_panel: string | null
  sort_order: number
  active: boolean
}

const EMPTY_DRAFT: PackageDraft = {
  name: '',
  priceCents: 0,
  description: '',
  components: {},
  customNotes: '',
  drugPanel: null,
}

export default function ClientPackagesManager({
  clientId,
  initialPackages,
}: {
  clientId: string
  initialPackages: ClientPackage[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ClientPackage | null>(null)
  const [error, setError] = useState('')

  const packages = initialPackages.filter((p) => p.active)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(pkg: ClientPackage) {
    setEditing(pkg)
    setModalOpen(true)
  }

  async function handleSave(draft: PackageDraft) {
    setError('')
    if (!draft.name.trim()) {
      setError('Package name is required')
      return
    }

    if (editing) {
      const res = await updateClientPackage({
        packageId: editing.id,
        clientId,
        name: draft.name,
        priceCents: draft.priceCents,
        description: draft.description,
        components: draft.components,
        customNotes: draft.customNotes,
        drugPanel: draft.drugPanel,
      })
      if (res.error) {
        setError(res.error)
        return
      }
    } else {
      const res = await createClientPackage({
        clientId,
        name: draft.name,
        priceCents: draft.priceCents,
        description: draft.description,
        components: draft.components,
        customNotes: draft.customNotes,
        drugPanel: draft.drugPanel,
        sortOrder: packages.length,
      })
      if (res.error) {
        setError(res.error)
        return
      }
    }

    setModalOpen(false)
    setEditing(null)
    startTransition(() => router.refresh())
  }

  async function handleDelete(pkg: ClientPackage) {
    if (!confirm(`Remove "${pkg.name}" from this client?`)) return
    const res = await deleteClientPackage({ packageId: pkg.id, clientId })
    if (res.error) {
      setError(res.error)
      return
    }
    startTransition(() => router.refresh())
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div>
          <h2 className="font-heading text-base text-navy">Screening Packages</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            What this client can run. Edit any package to change its included components.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 bg-navy text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Package
        </button>
      </div>

      {error && (
        <div className="px-5 py-2 bg-red-50 text-red-700 text-sm border-b border-red-100">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {packages.map((pkg) => {
          const count = countComponents(pkg.components)
          return (
            <div key={pkg.id} className="px-5 py-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{pkg.name}</p>
                  <span className="text-sm text-gold font-semibold">
                    ${(pkg.price_cents / 100).toFixed(2)}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-gold-pale text-navy font-medium">
                    {count} component{count === 1 ? '' : 's'}
                  </span>
                </div>
                {pkg.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{pkg.description}</p>
                )}
                {pkg.drug_panel && (
                  <p className="text-xs text-amber-700 mt-0.5">
                    Drug panel: <span className="font-medium">{drugPanelLabel(pkg.drug_panel)}</span>
                  </p>
                )}
                {pkg.components?.drug_screen && !pkg.drug_panel && (
                  <p className="text-xs text-red-600 mt-0.5">
                    Drug screen enabled but no panel selected — edit and pick one.
                  </p>
                )}
                {pkg.custom_notes && (
                  <p className="text-xs text-gray-400 mt-1 italic">Notes: {pkg.custom_notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(pkg)}
                  disabled={pending}
                  className="text-xs text-navy hover:text-gold transition-colors px-2 py-1"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(pkg)}
                  disabled={pending}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        })}
        {packages.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">
            No packages yet. Click <span className="font-medium text-navy">Add Package</span> to create one.
          </div>
        )}
      </div>

      <PackageComponentsModal
        open={modalOpen}
        title={editing ? `Edit: ${editing.name}` : 'Add New Package'}
        initial={
          editing
            ? {
                name: editing.name,
                priceCents: editing.price_cents,
                description: editing.description || '',
                components: editing.components || {},
                customNotes: editing.custom_notes || '',
                drugPanel: editing.drug_panel || null,
              }
            : EMPTY_DRAFT
        }
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}
