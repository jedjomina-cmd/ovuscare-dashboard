'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  IconUsers,
  IconChartBar,
  IconMessages,
  IconStethoscope,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react'
import Logo from './Logo'
import { useI18n, type Language } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/', icon: IconUsers, key: 'patients' as const },
  { href: '/analytics', icon: IconChartBar, key: 'analytics' as const },
  { href: '/dialogues', icon: IconMessages, key: 'dialogues' as const },
  { href: '/doctors', icon: IconStethoscope, key: 'doctors' as const },
  { href: '/settings', icon: IconSettings, key: 'settings' as const },
]

const languageLabels: Record<Language, string> = {
  en: 'English',
  ru: 'Русский',
  lv: 'Latviešu',
  es: 'Español',
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, lang, setLang } = useI18n()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userEmail ? userEmail[0].toUpperCase() : '?'

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, key }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#1D9E75]/10 text-[#1D9E75]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {t.nav[key]}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        {/* Language switcher */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Language)}
          className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30"
        >
          {(Object.keys(languageLabels) as Language[]).map((l) => (
            <option key={l} value={l}>
              {languageLabels[l]}
            </option>
          ))}
        </select>

        {/* User info */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1D9E75]/15 flex items-center justify-center text-[#1D9E75] text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{userEmail ?? '…'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            title="Sign out"
          >
            <IconLogout size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  )
}
