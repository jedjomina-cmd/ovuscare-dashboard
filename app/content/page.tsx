'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ContentItem } from '@/types'
import { useI18n } from '@/lib/i18n'
import { IconPlus, IconVideo, IconFileText, IconHelpCircle, IconX } from '@tabler/icons-react'
import { SkeletonRow } from '@/components/Skeleton'
import { toast } from 'sonner'

const STAGES = ['post_visit', 'stimulation', 'retrieval', 'transfer', 'tww', 'result']
const CONTENT_TYPES: ContentItem['type'][] = ['video', 'faq', 'text']

function TypeIcon({ type }: { type: ContentItem['type'] }) {
  if (type === 'video') return <IconVideo size={14} strokeWidth={1.75} className="text-[#0D9488]" />
  if (type === 'faq') return <IconHelpCircle size={14} strokeWidth={1.75} className="text-amber-500" />
  return <IconFileText size={14} strokeWidth={1.75} className="text-gray-400" />
}

export default function ContentPage() {
  const { t } = useI18n()
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStage, setFilterStage] = useState('')
  const [filterLang, setFilterLang] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{
    title: string
    type: ContentItem['type']
    stage: string
    language: string
    url: string
  }>({ title: '', type: 'video', stage: '', language: 'en', url: '' })

  useEffect(() => {
    fetchContent()
  }, [])

  async function fetchContent() {
    setLoading(true)
    const query = supabase
      .from('content')
      .select('*')
      .order('created_at', { ascending: false })

    const { data } = await query
    setItems((data ?? []) as ContentItem[])
    setLoading(false)
  }

  const filtered = items.filter((item) => {
    if (filterStage && item.stage !== filterStage) return false
    if (filterLang && item.language !== filterLang) return false
    return true
  })

  async function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const { error } = await supabase.from('content').insert([{
      title: form.title,
      type: form.type,
      stage: form.stage || null,
      language: form.language,
      url: form.url || null,
    }])
    setSaving(false)
    if (error) {
      toast.error('Failed to add content')
    } else {
      toast.success('Content added')
      setAddOpen(false)
      setForm({ title: '', type: 'video', stage: '', language: 'en', url: '' })
      fetchContent()
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('content').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete')
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Deleted')
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]/60 bg-white'

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Content Bank</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#0D9488] rounded-lg hover:bg-[#0b837a] transition-colors"
        >
          <IconPlus size={15} strokeWidth={2} />
          Add content
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
        >
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
        >
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="lv">Latviešu</option>
          <option value="es">Español</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/70 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Title', 'Type', 'Stage', 'Language', 'URL', ''].map((col) => (
                <th key={col} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                  No content yet. Add your first item.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{item.title}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <TypeIcon type={item.type} />
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.stage ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs uppercase">{item.language}</td>
                  <td className="px-4 py-3 text-xs">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[#0D9488] hover:underline truncate block max-w-[160px]">
                        {item.url}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <IconX size={14} strokeWidth={1.75} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Add content</h3>
              <button onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                <IconX size={16} strokeWidth={1.75} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputClass}
                  placeholder="IVF stimulation explained"
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ContentItem['type'] }))}
                    className={inputClass}
                  >
                    {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Language</label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                    <option value="lv">Latviešu</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Any stage</option>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">URL (video link)</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0D9488] rounded-lg hover:bg-[#0b837a] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
