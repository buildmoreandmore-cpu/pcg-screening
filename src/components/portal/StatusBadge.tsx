const statusConfig: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700' },
  drug_screen_ordered: { label: 'Drug Screen Ordered', className: 'bg-purple-50 text-purple-700' },
  drug_screen_collected: { label: 'Sample Collected', className: 'bg-indigo-50 text-indigo-700' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700' },
  paid: { label: 'Paid', className: 'bg-green-50 text-green-700' },
  signed: { label: 'Signed', className: 'bg-green-50 text-green-700' },
  refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-700' },
}

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
