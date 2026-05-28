'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'
import { useI18n } from '@/lib/i18n'
import { IconMail, IconLock, IconEye, IconEyeOff } from '@tabler/icons-react'

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim()) return
    setResetLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    setResetLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t.auth.resetSent)
      setForgotMode(false)
    }
  }

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]/60 transition bg-white placeholder:text-gray-400'

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200/70 p-8 shadow-sm">
          {/* Logo */}
          <div className="mb-7">
            <Logo />
          </div>

          {!forgotMode ? (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">{t.auth.welcomeBack}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{t.auth.signInToAccount}</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Email */}
                <div className="relative">
                  <IconMail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    strokeWidth={1.75}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.form.email}
                    className={inputClass}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <IconLock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    strokeWidth={1.75}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.form.password}
                    className={`${inputClass} pr-10`}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <IconEyeOff size={16} strokeWidth={1.75} />
                    ) : (
                      <IconEye size={16} strokeWidth={1.75} />
                    )}
                  </button>
                </div>

                {/* Forgot password */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-xs text-[#1D9E75] hover:underline"
                  >
                    {t.auth.forgotPassword}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] transition-colors disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : t.auth.signIn}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">{t.auth.resetPassword}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{t.auth.enterEmail}</p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div className="relative">
                  <IconMail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    strokeWidth={1.75}
                  />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder={t.form.email}
                    className={inputClass}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 text-sm font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] transition-colors disabled:opacity-60"
                >
                  {resetLoading ? 'Sending…' : t.actions.send}
                </button>

                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← {t.actions.back}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
