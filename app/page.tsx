import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Shift Tracker</h1>
      <div className="flex gap-4">
        <Link href="/auth/login">
          <Button>Sign In</Button>
        </Link>
        <Link href="/auth/sign-up">
          <Button variant="outline">Sign Up</Button>
        </Link>
      </div>
    </div>
  )
}
