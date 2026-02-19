import type { Metadata } from 'next'
import DashboardShell from '@/components/dashboard/DashboardShell'

export const metadata: Metadata = {
  title: 'Investor Dashboard | GHL India Ventures',
  description: 'Access your GHL India Ventures investor portal. View portfolio, NAV performance, transactions, and manage your alternative investments.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
