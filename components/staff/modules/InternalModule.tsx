'use client'

import { useState } from 'react'
import AdminGlass from '@/components/admin/shared/AdminGlass'
import AdminBadge from '@/components/admin/shared/AdminBadge'
import { ANNOUNCEMENTS_DATA } from '@/lib/staff/staffMockData'
import type { Announcement } from '@/lib/staff/staffTypes'
import {
  MessageSquare, Send, Megaphone, FileText, MessageCircle, Heart, Smile,
  Hash, Users, Dumbbell, Brain, Calendar, Scale, ShieldCheck, ChevronRight,
  Lightbulb, Activity, Zap, Eye,
} from 'lucide-react'

// ── Props & Main ────────────────────────────────────────────────
interface InternalModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function InternalModule({ subTab, navigate, showToast }: InternalModuleProps) {
  const tab = subTab || 'chat'
  switch (tab) {
    case 'chat':        return <ChatView showToast={showToast} />
    case 'noticeboard': return <NoticeboardView />
    case 'policies':    return <PoliciesView showToast={showToast} />
    case 'feedback':    return <FeedbackView showToast={showToast} />
    case 'wellness':    return <WellnessView showToast={showToast} />
    default:            return <ChatView showToast={showToast} />
  }
}

type Toast = InternalModuleProps['showToast']
type IconFC = React.ComponentType<{ className?: string }>

function SectionHeader({ title, icon: Icon }: { title: string; icon: IconFC }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-teal-400" />
      <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
    </div>
  )
}

// ================================================================
//  1. INTERNAL CHAT
// ================================================================
const CHANNELS: { id: string; name: string; icon: IconFC; unread: number }[] = [
  { id: 'general', name: 'General', icon: Hash, unread: 3 },
  { id: 'cs-team', name: 'CS Team', icon: Users, unread: 1 },
  { id: 'field-team', name: 'Field Team', icon: Zap, unread: 0 },
  { id: 'management', name: 'Management', icon: ShieldCheck, unread: 2 },
  { id: 'random', name: 'Random', icon: Smile, unread: 0 },
]

const MSG = (id: string, sender: string, message: string, timestamp: string) => ({ id, sender, message, timestamp })

const MOCK_MESSAGES: Record<string, ReturnType<typeof MSG>[]> = {
  general: [
    MSG('m1', 'Rajesh Venkataraman', 'Good morning team! Reminder: Monthly all-hands at 3 PM today.', '09:12 AM'),
    MSG('m2', 'Sowmya Parthasarathy', 'Annual Day RSVP is open. Please confirm attendance by March 10.', '09:30 AM'),
    MSG('m3', 'Karthik Sundaram', 'Q4 investor report is now live on the document portal.', '10:05 AM'),
    MSG('m4', 'Priya Venkatesh', 'Has anyone reviewed the new SEBI circular? Training link is in announcements.', '10:22 AM'),
    MSG('m5', 'Meera Subramaniam', 'Lunch order is being placed at 12. Drop your preferences in the sheet!', '11:45 AM'),
  ],
  'cs-team': [
    MSG('c1', 'Priya Venkatesh', 'Vikram Mehta KYC docs received. Forwarding to compliance.', '09:45 AM'),
    MSG('c2', 'Ananya Reddy', 'Ticket TKT-2026-089 escalated to L2. Client not satisfied with NAV explanation.', '10:40 AM'),
    MSG('c3', 'Karthik Sundaram', 'Let me take that escalation. I will call the client directly.', '10:55 AM'),
    MSG('c4', 'Priya Venkatesh', 'Great, thanks Karthik. Assigning TKT-2026-089 to you now.', '11:00 AM'),
    MSG('c5', 'Divya Krishnamurthy', 'Portfolio review sent to Sunita Agarwal and Kavitha Raman.', '11:30 AM'),
  ],
  'field-team': [
    MSG('f1', 'Venkat Raman', 'Checked in at Phoenix Towers site. Construction on track, 78% complete.', '08:30 AM'),
    MSG('f2', 'Suresh Kumar', 'Client meeting with Ganesh Iyer at 2 PM. Heading to T. Nagar office.', '09:00 AM'),
    MSG('f3', 'Arun Balaji', 'Site photography done for Marina Heights. Uploading 42 images.', '11:15 AM'),
    MSG('f4', 'Venkat Raman', 'Developer meeting rescheduled to Thursday. Updated in calendar.', '12:10 PM'),
    MSG('f5', 'Suresh Kumar', 'Ganesh Iyer confirmed for Series C. Documents pending from his end.', '03:30 PM'),
  ],
  management: [
    MSG('mg1', 'Rajesh Venkataraman', 'Board meeting prep: Please share updated AUM figures by EOD.', '08:00 AM'),
    MSG('mg2', 'Arvind Krishnamurthy', 'Compliance audit scheduled for next week. All departments to prepare.', '09:15 AM'),
    MSG('mg3', 'Sowmya Parthasarathy', 'HR budget for Q2 approved. Hiring 3 new CS agents and 1 field executive.', '10:00 AM'),
    MSG('mg4', 'Rajesh Venkataraman', 'Investor sentiment report looks positive. NPS at 72 this month.', '11:30 AM'),
  ],
  random: [
    MSG('r1', 'Meera Subramaniam', 'Anyone up for a cricket match this Saturday? Ground is booked!', '09:00 AM'),
    MSG('r2', 'Ananya Reddy', 'Count me in! What time?', '09:05 AM'),
    MSG('r3', 'Divya Krishnamurthy', 'The new cafe downstairs has amazing filter coffee. Highly recommend!', '10:30 AM'),
    MSG('r4', 'Priya Venkatesh', 'Happy birthday Suresh! Cake cutting at 4 PM in the break room.', '11:00 AM'),
    MSG('r5', 'Suresh Kumar', 'Thanks Priya! See everyone at 4!', '11:08 AM'),
  ],
}

function ChatView({ showToast }: { showToast: Toast }) {
  const [activeChannel, setActiveChannel] = useState('general')
  const [msgInput, setMsgInput] = useState('')
  const messages = MOCK_MESSAGES[activeChannel] || []
  const channelName = CHANNELS.find(c => c.id === activeChannel)?.name ?? 'channel'

  return (
    <div className="space-y-4">
      <SectionHeader title="Internal Chat" icon={MessageSquare} />
      <AdminGlass hover={false} padding="p-0">
        <div className="flex h-[480px]">
          {/* Channel List */}
          <div className="w-52 border-r border-white/[0.06] p-3 space-y-1 shrink-0">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-2 mb-2">Channels</p>
            {CHANNELS.map(ch => {
              const Icon = ch.icon
              const active = activeChannel === ch.id
              return (
                <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${active ? 'bg-teal-500/15 text-teal-300' : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'}`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-medium">{ch.name}</span>
                  {ch.unread > 0 && (
                    <span className="ml-auto bg-teal-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{ch.unread}</span>
                  )}
                </button>
              )
            })}
          </div>
          {/* Message Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-semibold text-white">{channelName}</span>
              <span className="text-[10px] text-white/30 ml-auto">{messages.length} messages</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map(msg => (
                <div key={msg.id}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-teal-300">{msg.sender}</span>
                    <span className="text-[10px] text-white/25">{msg.timestamp}</span>
                  </div>
                  <p className="text-xs text-white/70 mt-0.5 leading-relaxed">{msg.message}</p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-2">
              <input type="text" value={msgInput} onChange={e => setMsgInput(e.target.value)}
                placeholder={`Message #${channelName}...`}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-teal-500/40"
                onKeyDown={e => { if (e.key === 'Enter' && msgInput.trim()) { showToast('Message sent!', 'success'); setMsgInput('') } }} />
              <button onClick={() => { msgInput.trim() ? (showToast('Message sent!', 'success'), setMsgInput('')) : showToast('Type a message first', 'info') }}
                className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 p-2 rounded-lg transition-colors">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </AdminGlass>
    </div>
  )
}

// ================================================================
//  2. COMPANY NOTICEBOARD
// ================================================================
const ANN_BADGE: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'purple' | 'neutral' }> = {
  'policy-update': { label: 'Policy Update', variant: 'warning' },
  'process-change': { label: 'Process Change', variant: 'info' },
  event: { label: 'Event', variant: 'purple' },
  achievement: { label: 'Achievement', variant: 'success' },
  general: { label: 'General', variant: 'neutral' },
}

function NoticeboardView() {
  return (
    <div className="space-y-4">
      <SectionHeader title="Company Noticeboard" icon={Megaphone} />
      <div className="space-y-3">
        {ANNOUNCEMENTS_DATA.map(ann => {
          const badge = ANN_BADGE[ann.type] ?? { label: ann.type, variant: 'neutral' as const }
          return (
            <AdminGlass key={ann.id} padding="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <AdminBadge label={badge.label} variant={badge.variant} />
                  {ann.pinned && <AdminBadge label="Pinned" variant="error" dot />}
                </div>
                <span className="text-[10px] text-white/30 shrink-0">{ann.postedDate}</span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">{ann.title}</h4>
              <p className="text-xs text-white/60 leading-relaxed mb-3">{ann.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30">Posted by {ann.postedBy}</span>
                <span className="text-[10px] text-white/25">{ann.readBy.length} read</span>
              </div>
            </AdminGlass>
          )
        })}
      </div>
    </div>
  )
}

// ================================================================
//  3. COMPANY POLICIES
// ================================================================
const POLICIES: { id: string; title: string; lastUpdated: string; version: string; icon: IconFC }[] = [
  { id: 'pol-1', title: 'Leave Policy', lastUpdated: '2025-11-15', version: 'v3.2', icon: Calendar },
  { id: 'pol-2', title: 'Code of Conduct', lastUpdated: '2025-08-01', version: 'v2.1', icon: ShieldCheck },
  { id: 'pol-3', title: 'Work from Home Guidelines', lastUpdated: '2026-01-10', version: 'v1.4', icon: Lightbulb },
  { id: 'pol-4', title: 'Expense Reimbursement Policy', lastUpdated: '2026-02-18', version: 'v4.0', icon: FileText },
  { id: 'pol-5', title: 'Data Security Policy', lastUpdated: '2025-12-01', version: 'v2.0', icon: ShieldCheck },
  { id: 'pol-6', title: 'Anti-Harassment Policy', lastUpdated: '2025-09-20', version: 'v1.2', icon: Heart },
]

function PoliciesView({ showToast }: { showToast: Toast }) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Company Policies" icon={FileText} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {POLICIES.map(pol => {
          const Icon = pol.icon
          return (
            <AdminGlass key={pol.id} padding="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-1">{pol.title}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-white/35 mb-2">
                    <span>Last updated: {pol.lastUpdated}</span>
                    <span>{pol.version}</span>
                  </div>
                  <button onClick={() => showToast(`Opening ${pol.title}...`, 'info')}
                    className="flex items-center gap-1 text-[10px] font-semibold text-teal-400 hover:text-teal-300 transition-colors">
                    <Eye className="w-3 h-3" /> View Document
                  </button>
                </div>
              </div>
            </AdminGlass>
          )
        })}
      </div>
    </div>
  )
}

// ================================================================
//  4. FEEDBACK & SUGGESTIONS
// ================================================================
type FeedbackCategory = 'Workplace' | 'Process' | 'Tools' | 'HR' | 'General'
type FeedbackStatus = 'submitted' | 'acknowledged' | 'resolved'

const RECENT_FEEDBACK: { id: string; category: FeedbackCategory; subject: string; status: FeedbackStatus; date: string }[] = [
  { id: 'fb-1', category: 'Workplace', subject: 'AC not working properly on 3rd floor', status: 'acknowledged', date: '2026-02-19' },
  { id: 'fb-2', category: 'Tools', subject: 'CRM search is slow with large datasets', status: 'submitted', date: '2026-02-20' },
  { id: 'fb-3', category: 'Process', subject: 'Simplify monthly expense claim workflow', status: 'resolved', date: '2026-02-10' },
]

const FB_STATUS: Record<FeedbackStatus, { label: string; variant: 'success' | 'warning' | 'info' }> = {
  submitted: { label: 'Submitted', variant: 'info' },
  acknowledged: { label: 'Acknowledged', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
}

function FeedbackView({ showToast }: { showToast: Toast }) {
  const [category, setCategory] = useState<FeedbackCategory>('General')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [anonymous, setAnonymous] = useState(false)

  const handleSubmit = () => {
    if (!subject.trim() || !description.trim()) { showToast('Please fill in all required fields', 'warning'); return }
    showToast('Feedback submitted successfully!', 'success')
    setSubject(''); setDescription(''); setAnonymous(false); setCategory('General')
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Feedback & Suggestions" icon={MessageCircle} />
      <AdminGlass hover={false} padding="p-5">
        <h4 className="text-xs font-semibold text-white mb-3">Submit Feedback</h4>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as FeedbackCategory)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500/40 appearance-none">
              {(['Workplace', 'Process', 'Tools', 'HR', 'General'] as FeedbackCategory[]).map(c => (
                <option key={c} value={c} className="bg-gray-900">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1 block">Subject</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief subject line..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-teal-500/40" />
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe your feedback or suggestion in detail..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-teal-500/40 resize-none" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/20 bg-white/[0.04] accent-teal-500" />
              <span className="text-[11px] text-white/50">Submit anonymously</span>
            </label>
            <button onClick={handleSubmit}
              className="flex items-center gap-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 px-4 py-2 rounded-lg text-xs font-semibold transition-colors">
              <Send className="w-3 h-3" /> Submit Feedback
            </button>
          </div>
        </div>
      </AdminGlass>
      {/* Recent Feedback */}
      <div>
        <h4 className="text-xs font-semibold text-white/50 mb-3">Recent Feedback</h4>
        <div className="space-y-2">
          {RECENT_FEEDBACK.map(fb => {
            const badge = FB_STATUS[fb.status]
            return (
              <AdminGlass key={fb.id} padding="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <AdminBadge label={fb.category} variant="info" size="sm" />
                    <span className="text-xs text-white/80 truncate">{fb.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <AdminBadge label={badge.label} variant={badge.variant} size="sm" />
                    <span className="text-[10px] text-white/25">{fb.date}</span>
                  </div>
                </div>
              </AdminGlass>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ================================================================
//  5. WELLNESS HUB
// ================================================================
const WELLNESS_CARDS: { id: string; title: string; desc: string; icon: IconFC; iconCls: string; bgCls: string; borderCls: string }[] = [
  { id: 'w1', title: 'Stress Management Tips', desc: 'Practical techniques for managing workplace stress, breathing exercises, and mindfulness practices.', icon: Brain, iconCls: 'text-purple-400', bgCls: 'bg-purple-500/10', borderCls: 'border-purple-500/20' },
  { id: 'w2', title: 'Work-Life Balance', desc: 'Guidelines for maintaining healthy boundaries, time management tips, and flexible work resources.', icon: Scale, iconCls: 'text-blue-400', bgCls: 'bg-blue-500/10', borderCls: 'border-blue-500/20' },
  { id: 'w3', title: 'Mental Health Resources', desc: 'Access to counseling services, EAP program details, and confidential support helplines.', icon: Heart, iconCls: 'text-rose-400', bgCls: 'bg-rose-500/10', borderCls: 'border-rose-500/20' },
  { id: 'w4', title: 'Fitness Challenges', desc: 'Join monthly step challenges, yoga sessions, and team fitness events. Current: 10K Steps Challenge!', icon: Dumbbell, iconCls: 'text-emerald-400', bgCls: 'bg-emerald-500/10', borderCls: 'border-emerald-500/20' },
]

const MOODS = [
  { emoji: '\uD83D\uDE04', label: 'Great' }, { emoji: '\uD83D\uDE42', label: 'Good' },
  { emoji: '\uD83D\uDE10', label: 'Okay' }, { emoji: '\uD83D\uDE1E', label: 'Tired' },
  { emoji: '\uD83D\uDE25', label: 'Stressed' },
]

function WellnessView({ showToast }: { showToast: Toast }) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Wellness Hub" icon={Activity} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {WELLNESS_CARDS.map(card => {
          const Icon = card.icon
          return (
            <AdminGlass key={card.id} padding="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${card.bgCls} border ${card.borderCls} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.iconCls}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-1">{card.title}</h4>
                  <p className="text-[11px] text-white/50 leading-relaxed mb-3">{card.desc}</p>
                  <button onClick={() => showToast(`Opening ${card.title}...`, 'info')}
                    className="flex items-center gap-1 text-[10px] font-semibold text-teal-400 hover:text-teal-300 transition-colors">
                    Learn More <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </AdminGlass>
          )
        })}
      </div>
      {/* Quick Mood Poll */}
      <AdminGlass hover={false} padding="p-5">
        <h4 className="text-xs font-semibold text-white mb-1">Quick Poll</h4>
        <p className="text-[11px] text-white/40 mb-4">How are you feeling today?</p>
        <div className="flex items-center gap-3 justify-center">
          {MOODS.map(mood => (
            <button key={mood.label} onClick={() => showToast(`Thanks for sharing! You're feeling: ${mood.label}`, 'success')}
              className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-teal-500/10 hover:border-teal-500/20 transition-all group">
              <span className="text-2xl group-hover:scale-110 transition-transform">{mood.emoji}</span>
              <span className="text-[10px] text-white/40 group-hover:text-teal-300 font-medium">{mood.label}</span>
            </button>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}
