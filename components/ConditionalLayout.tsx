'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar />
      <main className="flex-1 overflow-auto ml-[220px]">{children}</main>
    </div>
  )
}
