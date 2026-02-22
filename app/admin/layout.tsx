import type { Metadata } from 'next'
import AdminShell from '@/components/admin/AdminShell'

export const metadata: Metadata = {
  title: 'Admin Command Center | GHL India Ventures',
  description: 'Internal administration dashboard for GHL India Ventures operations, compliance, and client management.',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
