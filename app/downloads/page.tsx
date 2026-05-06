import { notFound } from 'next/navigation'

// /downloads is hidden for later use as part of the 2026-05 site
// repositioning. The full implementation has been preserved at
// app/downloads/page.disabled.tsx — to restore the page, rename
// page.disabled.tsx back to page.tsx and re-add the nav link in
// lib/constants.ts (it is currently commented out under About).
export default function DownloadsPage() {
  notFound()
}
