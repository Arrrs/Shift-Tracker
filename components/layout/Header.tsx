import Link from 'next/link'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Sidebar } from './Sidebar'



export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 max-w-full items-center px-2">
        {/* Left: Menu button */}
        <div className="flex-1">
          <Sidebar />
        </div>

        {/* Center: Logo/Title */}
        <div className="flex items-center justify-center">
          <Link href="/dashboard" className="font-bold text-lg">
            Shift Tracker
          </Link>
        </div>

        {/* Right: Theme switcher */}
        <div className="flex flex-1 items-center justify-end">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
