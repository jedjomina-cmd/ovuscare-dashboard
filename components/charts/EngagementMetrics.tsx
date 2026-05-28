'use client'

import { SkeletonText } from '@/components/Skeleton'

interface EngagementMetricsProps {
  avgMessages: string | number
  percentEvening: string | number
  avgDaysSinceLast: string | number
  labels: {
    avgMessages: string
    afterEvening: string
    daysSinceLast: string
  }
  loading?: boolean
}

function MetricItem({
  label,
  value,
  unit,
  loading,
}: {
  label: string
  value: string | number
  unit?: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <SkeletonText className="w-32" />
        <div className="h-8 w-16 bg-gray-200 rounded" />
      </div>
    )
  }
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 leading-none">
        {value}
        {unit && <span className="text-base font-normal text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  )
}

export default function EngagementMetrics({
  avgMessages,
  percentEvening,
  avgDaysSinceLast,
  labels,
  loading,
}: EngagementMetricsProps) {
  return (
    <div className="flex flex-col justify-around h-full gap-6 py-2">
      <MetricItem label={labels.avgMessages} value={avgMessages} loading={loading} />
      <MetricItem
        label={labels.afterEvening}
        value={percentEvening}
        unit="%"
        loading={loading}
      />
      <MetricItem
        label={labels.daysSinceLast}
        value={avgDaysSinceLast}
        unit="d"
        loading={loading}
      />
    </div>
  )
}
