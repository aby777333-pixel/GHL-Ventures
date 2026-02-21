// ============================================================
// GHL India Ventures - Notification Center Data
// ============================================================

export interface Notification {
  id: string
  type: 'fund' | 'blog' | 'event'
  title: string
  description: string
  date: string
  read: boolean
  link: string
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'fund',
    title: 'Q4 NAV Report Published',
    description: 'The latest Net Asset Value report for GHL India Ventures Fund is now available.',
    date: '2025-01-15',
    read: false,
    link: '/downloads',
  },
  {
    id: 'n2',
    type: 'event',
    title: 'Investor Webinar: Feb 2025',
    description: 'Join our quarterly investor update webinar on stressed real estate recovery.',
    date: '2025-01-20',
    read: false,
    link: '/contact',
  },
  {
    id: 'n3',
    type: 'blog',
    title: 'New Article: NCLT Process Explained',
    description: 'How the NCLT resolution process creates deep-value opportunities.',
    date: '2025-01-12',
    read: false,
    link: '/blog',
  },
  {
    id: 'n4',
    type: 'fund',
    title: 'SEBI Co-Invest Framework Now Open',
    description: 'Explore our SEBI Co-Invest Framework — designed for salaried professionals. Contact our team for details.',
    date: '2025-01-08',
    read: false,
    link: '/fund/debenture-route',
  },
  {
    id: 'n5',
    type: 'event',
    title: 'Chennai Investor Meet',
    description: 'Exclusive in-person investor meet at The Leela, Chennai. Limited seats.',
    date: '2025-01-05',
    read: true,
    link: '/contact',
  },
  {
    id: 'n6',
    type: 'blog',
    title: 'Startup Ecosystem in India 2025',
    description: 'Why India\'s startup ecosystem is the best opportunity for alternative capital.',
    date: '2024-12-28',
    read: true,
    link: '/blog',
  },
  {
    id: 'n7',
    type: 'fund',
    title: 'New Portfolio Addition',
    description: 'GHL has invested in a high-potential fintech startup in Bengaluru.',
    date: '2024-12-20',
    read: true,
    link: '/portfolio',
  },
  {
    id: 'n8',
    type: 'event',
    title: 'Financial IQ Workshop',
    description: 'Free workshop on understanding AIF structures and tax implications.',
    date: '2024-12-15',
    read: true,
    link: '/financial-iq',
  },
]
