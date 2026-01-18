import { Header } from '@/components/layout/Header'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
