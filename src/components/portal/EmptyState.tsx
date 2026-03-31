import Link from 'next/link'

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 bg-gold-pale rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-heading text-lg text-navy mb-1">{title}</h3>
      <p className="text-gray-500 text-sm max-w-xs mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 bg-gold text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-gold-light transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
