'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface BotToggleProps {
  patientId: string
  initialValue: boolean
  onUpdate?: (value: boolean) => void
}

export default function BotToggle({ patientId, initialValue, onUpdate }: BotToggleProps) {
  const [active, setActive] = useState(initialValue)
  const [loading, setLoading] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (loading) return

    const newValue = !active
    setActive(newValue) // optimistic
    setLoading(true)

    const { error } = await supabase
      .from('patients')
      .update({ ai_assistant_active: newValue })
      .eq('id', patientId)

    setLoading(false)

    if (error) {
      setActive(!newValue) // rollback
      toast.error('Failed to update bot status')
    } else {
      onUpdate?.(newValue)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:ring-offset-1 ${
        active ? 'bg-[#1D9E75]' : 'bg-gray-200'
      } ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      role="switch"
      aria-checked={active}
      title={active ? 'AI assistant active — click to pause' : 'AI assistant paused — click to activate'}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          active ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
