'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { en, type Translations } from '@/locales/en'
import { ru } from '@/locales/ru'
import { lv } from '@/locales/lv'
import { es } from '@/locales/es'

export type Language = 'en' | 'ru' | 'lv' | 'es'

const translations: Record<Language, Translations> = { en, ru, lv, es }

interface I18nContextType {
  t: Translations
  lang: Language
  setLang: (lang: Language) => void
}

const I18nContext = createContext<I18nContextType>({
  t: en,
  lang: 'en',
  setLang: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('ovuscare_lang') as Language | null
    if (saved && ['en', 'ru', 'lv', 'es'].includes(saved)) {
      setLangState(saved)
    }
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('ovuscare_lang', newLang)
  }

  return (
    <I18nContext.Provider value={{ t: translations[lang], lang, setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
