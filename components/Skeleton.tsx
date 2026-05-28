export function SkeletonRow({ cols = 7 }: { cols?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded" style={{ width: `${[75, 85, 65, 90, 70, 80, 60][i % 7]}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200/70 p-5 animate-pulse">
      <div className="h-3 w-28 bg-gray-200 rounded mb-3" />
      <div className="h-7 w-16 bg-gray-200 rounded" />
    </div>
  )
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return <div className={`h-4 bg-gray-200 rounded animate-pulse ${className}`} />
}
