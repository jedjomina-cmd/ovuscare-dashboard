interface ActivityDotProps {
  lastReply: string | null
}

export default function ActivityDot({ lastReply }: ActivityDotProps) {
  const getColor = () => {
    if (!lastReply) return 'bg-red-400'

    const now = new Date()
    const reply = new Date(lastReply)

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 6)

    if (reply >= todayStart) return 'bg-green-400'
    if (reply >= weekStart) return 'bg-yellow-400'
    return 'bg-red-400'
  }

  const getTitle = () => {
    if (!lastReply) return 'No messages'
    const now = new Date()
    const reply = new Date(lastReply)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 6)

    if (reply >= todayStart) return 'Active today'
    if (reply >= weekStart) return 'Active this week'
    return 'Inactive'
  }

  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${getColor()}`}
      title={getTitle()}
    />
  )
}
