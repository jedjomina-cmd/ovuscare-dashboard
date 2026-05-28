interface StatsCardProps {
  label: string
  value: number | string
  loading?: boolean
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200/70 p-5 animate-pulse">
      <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-16 bg-gray-200 rounded" />
    </div>
  )
}

export default function StatsCard({ label, value, loading }: StatsCardProps) {
  if (loading) return <StatsCardSkeleton />

  return (
    <div className="bg-white rounded-xl border border-gray-200/70 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}
