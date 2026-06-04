'use client'

import { useI18n, type Language } from '@/lib/i18n'

const languageOptions: { value: Language; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'ru', label: 'Russian', native: 'Русский' },
  { value: 'lv', label: 'Latvian', native: 'Latviešu' },
  { value: 'es', label: 'Spanish', native: 'Español' },
]

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-lg font-semibold text-gray-900">{t.settings.title}</h1>

      {/* Appearance card */}
      <div className="bg-white rounded-xl border border-gray-200/70 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">{t.settings.appearance}</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">{t.settings.language}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t.settings.currentLanguage}:{' '}
              {languageOptions.find((l) => l.value === lang)?.native}
            </p>
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 bg-white text-gray-700 cursor-pointer"
          >
            {languageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.native}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Language cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {languageOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setLang(opt.value)}
            className={`p-4 rounded-xl border text-left transition-all ${
              lang === opt.value
                ? 'border-[#1D9E75] bg-[#1D9E75]/5 ring-1 ring-[#1D9E75]/30'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="text-sm font-semibold text-gray-900">{opt.native}</p>
            <p className="text-xs text-gray-500 mt-0.5">{opt.label}</p>
            {lang === opt.value && (
              <div className="mt-2 w-2 h-2 rounded-full bg-[#1D9E75]" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
