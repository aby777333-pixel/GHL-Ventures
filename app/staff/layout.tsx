import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Staff Portal | GHL India Ventures',
  description: 'Internal staff portal for GHL India Ventures — CS, Field Ops, HR, and employee self-service.',
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Hide main-website Navbar, Footer, etc. from first paint (no JS needed) */}
      <style dangerouslySetInnerHTML={{ __html: '.main-site-shell{display:none!important}' }} />
      {children}
    </>
  )
}
