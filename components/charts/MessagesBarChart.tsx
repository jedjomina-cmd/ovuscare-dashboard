'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  label: string
  count: number
}

interface MessagesBarChartProps {
  data: DataPoint[]
  loading?: boolean
  emptyLabel?: string
}

export default function MessagesBarChart({
  data,
  loading,
  emptyLabel = 'No data yet',
}: MessagesBarChartProps) {
  if (loading) {
    return (
      <div className="h-48 flex items-end gap-1.5 px-2 pb-2 animate-pulse">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 rounded-t"
            style={{ height: `${[75, 85, 65, 90, 70, 80, 60, 55, 88, 72, 68, 95, 78, 82][i % 14]}%` }}
          />
        ))}
      </div>
    )
  }

  const isEmpty = data.every((d) => d.count === 0)

  if (isEmpty) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-gray-400">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
            cursor={{ fill: '#F9FAFB' }}
            formatter={(value) => [value as number, 'messages']}
          />
          <Bar dataKey="count" fill="#1D9E75" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
