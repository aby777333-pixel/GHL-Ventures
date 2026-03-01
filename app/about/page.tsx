'use client'

import { useState } from 'react'
import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import PlaceholderImage from '@/components/PlaceholderImage'
import dynamic from 'next/dynamic'
const WebGLVideoPresentation = dynamic(
  () => import('@/components/webgl/video/WebGLVideoPresentation'),
  { ssr: false }
)
import { BRAND, TEAM_MEMBERS, ADVISORY_BOARD, MILESTONES } from '@/lib/constants'
import Image from 'next/image'
import {
  ArrowRight, Target, Eye, Heart, Shield, Users, Award,
  CheckCircle, TrendingUp, Globe, Briefcase, Star,
  Lightbulb, Lock, ChevronDown, ChevronUp, Linkedin,
  Home, ChevronRight, Building2, Sparkles, MapPin
} from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'

/* ───────────────────────────── 1. HERO ───────────────────────────── */
function AboutHero() {
  return (
    <section className="relative min-h-[80vh] flex items-center gradient-dark overflow-hidden">
      {/* Space: Constellation theme */}
      <SpaceHero variant="constellation" />
      {/* Decorative blurs */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-96 h-96 bg-brand-red rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-brand-red rounded-full blur-3xl" />
      </div>

      <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-40 pb-12">
        <AnimatedSection>
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
            <Link href="/" className="hover:text-white transition-colors flex items-center">
              <Home className="w-3.5 h-3.5 mr-1" /> Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-brand-red font-medium">About</span>
          </nav>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-5 leading-tight">
            Built on Trust.<br />
            Driven by <span className="text-gradient">Intelligence.</span>
          </h1>
          <p className="text-sm md:text-base text-gray-300 max-w-3xl leading-relaxed mb-8">
            GHL India Ventures is a SEBI-registered Category II Alternative Investment Fund
            identifying high-growth opportunities in stressed real estate and early-stage startups across India.
          </p>
        </AnimatedSection>

        {/* Investment Overview Video */}
        <AnimatedSection delay={200}>
          <div className="max-w-3xl mt-4">
            <WebGLVideoPresentation className="shadow-2xl shadow-brand-red/10" />
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── 2. OUR STORY (Horizontal Timeline) ───────────────────────────── */
function OurStoryTimeline() {
  const [activeYear, setActiveYear] = useState(MILESTONES.length - 1)

  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-12">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Our Story</span>
          <h2 className="section-title mt-2 text-brand-black">Born From Conviction</h2>
          <p className="section-subtitle mx-auto mt-4 max-w-3xl">
            GHL India Ventures was founded from a deep conviction that India&apos;s stressed real estate market
            and burgeoning startup ecosystem represent generational investment opportunities. With roots in Chennai
            and a pan-India outlook, we set out to build a platform that combines institutional rigour with
            entrepreneurial empathy.
          </p>
        </AnimatedSection>

        {/* Horizontal timeline bar */}
        <AnimatedSection delay={150}>
          <div className="relative mb-12">
            {/* Track line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2" />

            <div className="flex justify-between items-center relative">
              {MILESTONES.map((milestone, i) => (
                <button
                  key={milestone.year}
                  onClick={() => setActiveYear(i)}
                  className="relative flex flex-col items-center group focus:outline-none"
                >
                  {/* Dot */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                    activeYear === i
                      ? 'bg-brand-red text-white scale-110 shadow-lg shadow-brand-red/30'
                      : 'bg-white border-2 border-gray-300 text-brand-grey group-hover:border-brand-red group-hover:text-brand-red'
                  }`}>
                    <span className="text-xs font-bold">{milestone.year.slice(-2)}</span>
                  </div>
                  {/* Year label */}
                  <span className={`mt-2 text-sm font-semibold transition-colors ${
                    activeYear === i ? 'text-brand-red' : 'text-brand-grey'
                  }`}>
                    {milestone.year}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Active milestone card */}
        <AnimatedSection delay={200}>
          <div className="max-w-2xl mx-auto">
            <div className="card text-center glow-card-red">
              <span className="text-brand-red font-bold text-3xl">{MILESTONES[activeYear].year}</span>
              <h3 className="font-bold text-xl text-brand-black mt-3 mb-3">{MILESTONES[activeYear].title}</h3>
              <p className="text-brand-grey leading-relaxed">{MILESTONES[activeYear].description}</p>
            </div>
          </div>
        </AnimatedSection>

        {/* Narrative paragraphs */}
        <div className="grid lg:grid-cols-2 gap-6 mt-10">
          <AnimatedSection direction="left">
            <div className="space-y-4 text-brand-grey leading-relaxed">
              <p>
                India&apos;s stressed real estate market is worth lakhs of crores, yet
                most of it sits locked in disputes, incomplete projects, and distressed assets.
                We saw what others overlooked: a once-in-a-generation chance to create value
                by resolving, restructuring, and reviving these assets with disciplined capital.
              </p>
              <p>
                Simultaneously, India&apos;s startup ecosystem was producing world-class founders
                who needed more than just funding. They needed partners who understand the
                Indian regulatory landscape, can open doors, and have the patience to see
                a vision through.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right">
            <div className="bg-gradient-to-br from-brand-black to-brand-darkgrey rounded-3xl p-8 text-white">
              <div className="space-y-5">
                {[
                  { icon: Shield, text: 'SEBI Registered: ' + BRAND.sebi, href: BRAND.sebiUrl },
                  { icon: Briefcase, text: 'Category II Alternative Investment Fund' },
                  { icon: Globe, text: 'Headquartered in Chennai, investing across India' },
                  { icon: Building2, text: 'Stressed real estate resolution focus' },
                  { icon: Sparkles, text: 'Early-stage startup investment vertical' },
                ].map((item: any) => (
                  <div key={item.text} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-brand-red/20 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-brand-red" />
                    </div>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-gray-300 text-sm hover:text-brand-red transition-colors">{item.text}</a>
                    ) : (
                      <span className="text-gray-300 text-sm">{item.text}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 3. MISSION & VISION ───────────────────────────── */
function MissionVision() {
  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Purpose</span>
          <h2 className="section-title mt-2 text-brand-black">Mission & Vision</h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-10">
          <AnimatedSection direction="left">
            <div className="card h-full group hover:-translate-y-2 glow-card-red">
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-red transition-all">
                <Target className="w-8 h-8 text-brand-red group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-brand-black mb-3">Our Mission</h3>
              <p className="text-brand-grey leading-relaxed">
                To identify and invest in high-growth Indian enterprises across two compelling verticals:
                stressed real estate assets ripe for resolution and early-stage startups poised for
                exponential growth. We combine institutional discipline with entrepreneurial agility
                to create lasting economic and social value for our investors and the communities we touch.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right">
            <div className="card h-full group hover:-translate-y-2 glow-card-blue">
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-red transition-all">
                <Eye className="w-8 h-8 text-brand-red group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-brand-black mb-3">Our Vision</h3>
              <p className="text-brand-grey leading-relaxed">
                To be India&apos;s most trusted alternative investment partner, recognised for
                superior risk-adjusted returns, ethical governance, and transformative impact.
                We aspire to set the benchmark for how alternative capital can responsibly
                unlock value in India&apos;s most dynamic asset classes.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 4. LEADERSHIP TEAM ───────────────────────────── */
function LeadershipTeam() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Leadership</span>
          <h2 className="section-title mt-2 text-brand-black">Our Team</h2>
          <p className="section-subtitle mx-auto mt-4">
            Experienced professionals united by a shared passion for investing in India&apos;s future.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TEAM_MEMBERS.map((member, i) => {
            const isExpanded = expandedIndex === i
            return (
              <AnimatedSection key={member.name} delay={i * 100}>
                <div className={`card text-center group hover:-translate-y-2 h-full flex flex-col ${['glow-card-red','glow-card-blue','glow-card-violet'][i % 3]}`}>
                  {/* Photo placeholder */}
                  <div className="w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden">
                    <PlaceholderImage theme="team" aspectRatio="w-28 h-28" className="rounded-full" />
                  </div>
                  <h3 className="font-bold text-lg text-brand-black">{member.name}</h3>
                  <p className="text-brand-red text-sm font-medium mb-3">{member.role}</p>

                  {/* Bio - collapsed / expanded */}
                  <p className={`text-brand-grey text-sm leading-relaxed flex-grow ${
                    isExpanded ? '' : 'line-clamp-3'
                  }`}>
                    {member.bio}
                  </p>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    className="inline-flex items-center justify-center mt-3 text-brand-red text-xs font-medium hover:text-red-700 transition-colors"
                  >
                    {isExpanded ? (
                      <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></>
                    ) : (
                      <>Read More <ChevronDown className="w-3 h-3 ml-1" /></>
                    )}
                  </button>

                  {/* LinkedIn */}
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center mt-4 text-brand-grey hover:text-brand-red transition-colors"
                    aria-label={`${member.name} LinkedIn`}
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 5. OUR VALUES ───────────────────────────── */
function OurValues() {
  const values = [
    { icon: Lock, title: 'Trust', desc: 'We earn trust by honouring commitments, protecting capital, and putting investors first in every decision.' },
    { icon: Eye, title: 'Transparency', desc: 'Timely reporting, open communication, and full regulatory disclosure define how we operate.' },
    { icon: TrendingUp, title: 'Performance', desc: 'We relentlessly pursue superior risk-adjusted returns through disciplined investing and active value creation.' },
    { icon: Shield, title: 'Ethics', desc: 'Unwavering ethical standards in deal-making, governance, and stakeholder relationships.' },
    { icon: Lightbulb, title: 'Innovation', desc: 'We embrace data-driven insights and creative structuring to unlock value where others see risk.' },
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Principles</span>
          <h2 className="section-title mt-2 text-brand-black">Our Values</h2>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {values.map((v, i) => (
            <AnimatedSection key={v.title} delay={i * 100}>
              <div className={`card text-center h-full group hover:-translate-y-2 ${['glow-card-red','glow-card-blue','glow-card-violet','glow-card-emerald','glow-card-amber'][i % 5]}`}>
                <div className="w-14 h-14 bg-brand-red/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-brand-red transition-all">
                  <v.icon className="w-7 h-7 text-brand-red group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-brand-black mb-2">{v.title}</h3>
                <p className="text-brand-grey text-sm leading-relaxed">{v.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 6. ADVISORY BOARD ───────────────────────────── */
function AdvisoryBoardSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Advisors</span>
          <h2 className="section-title mt-2 text-brand-black">Advisory Board</h2>
          <p className="section-subtitle mx-auto mt-4">
            Distinguished professionals who provide strategic counsel to our investment team.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {ADVISORY_BOARD.map((member, i) => {
            const isExpanded = expandedIndex === i
            return (
              <AnimatedSection key={member.name} delay={i * 120}>
                <div className={`card text-center group hover:-translate-y-2 h-full flex flex-col ${['glow-card-amber','glow-card-emerald','glow-card-cyan'][i % 3]}`}>
                  <div className="w-24 h-24 rounded-full mx-auto mb-5 overflow-hidden">
                    <PlaceholderImage theme="team" aspectRatio="w-24 h-24" className="rounded-full" />
                  </div>
                  <h3 className="font-bold text-lg text-brand-black">{member.name}</h3>
                  <p className="text-brand-red text-sm font-medium mb-3">{member.role}</p>
                  <p className={`text-brand-grey text-sm leading-relaxed flex-grow ${
                    isExpanded ? '' : 'line-clamp-3'
                  }`}>
                    {member.bio}
                  </p>
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    className="inline-flex items-center justify-center mt-3 text-brand-red text-xs font-medium hover:text-red-700 transition-colors"
                  >
                    {isExpanded ? (
                      <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></>
                    ) : (
                      <>Read More <ChevronDown className="w-3 h-3 ml-1" /></>
                    )}
                  </button>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center mt-4 text-brand-grey hover:text-brand-red transition-colors"
                    aria-label={`${member.name} LinkedIn`}
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 7. REGULATORY COMPLIANCE ───────────────────────────── */
function RegulatoryCompliance() {
  return (
    <section className="section-padding bg-white">
      <div className="container-max mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <AnimatedSection direction="left">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Governance</span>
            <h2 className="section-title mt-2 text-brand-black">Regulatory Compliance</h2>
            <p className="text-brand-grey text-base mt-3 leading-relaxed">
              As a SEBI-registered entity, we adhere to the highest standards of corporate governance,
              transparency, and regulatory compliance in all our operations. Our compliance framework
              is designed to protect investors at every stage.
            </p>
            <div className="mt-8 space-y-4">
              {[
                'SEBI (AIF) Regulations, 2012 — full compliance',
                'Regular NAV reporting and audited financials',
                'Independent custodian and auditor',
                'Comprehensive KYC/AML procedures',
                'Periodic investor reporting and communication',
                'Advisory committee oversight',
                'Whistle-blower policy and grievance redressal mechanism',
              ].map((item) => (
                <div key={item} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-brand-red shrink-0" />
                  <span className="text-brand-black text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection direction="right">
            <div className="bg-brand-offwhite rounded-3xl p-8">
              <div className="text-center mb-8">
                <Shield className="w-16 h-16 text-brand-red mx-auto mb-4" />
                <h3 className="text-xl font-bold text-brand-black">SEBI Registration</h3>
              </div>
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-brand-grey text-sm">Registration No.</span>
                  <a href={BRAND.sebiUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-black hover:text-brand-red transition-colors">{BRAND.sebi}</a>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-brand-grey text-sm">Category</span>
                  <span className="font-bold text-brand-black">Category II AIF</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-brand-grey text-sm">Regulation</span>
                  <span className="font-bold text-brand-black">SEBI (AIF) Regulations, 2012</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-brand-grey text-sm">Regulator</span>
                  <span className="font-bold text-brand-black">SEBI</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-grey text-sm">Status</span>
                  <span className="font-bold text-green-600 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />Active
                  </span>
                </div>
              </div>

              {/* Investor protection note */}
              <div className="mt-6 bg-brand-red/5 rounded-xl p-4 border border-brand-red/10">
                <p className="text-xs text-brand-grey leading-relaxed">
                  <strong className="text-brand-black">Investor Protection:</strong> All investments are
                  held by an independent custodian. Fund operations are audited annually by a
                  SEBI-empanelled auditor. Investors receive quarterly NAV statements and annual reports.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 8. OFFICE GALLERY — TABBED ───────────────────────────── */
const OFFICE_TABS = [
  {
    id: 'reception',
    label: 'Reception',
    image: '/images/office/reception.jpg',
    title: 'Welcome Lounge',
    description: 'Our warm reception area greets every visitor with the refined elegance that mirrors GHL\u2019s commitment to excellence. A first impression designed to inspire confidence.',
  },
  {
    id: 'conference',
    label: 'Conference Room',
    image: '/images/office/conference.jpg',
    title: 'Executive Boardroom',
    description: 'Where investment strategies take shape. Our state-of-the-art conference room is equipped for high-level presentations, investor meetings, and deal closings.',
  },
  {
    id: 'workspace',
    label: 'Team Workspace',
    image: '/images/office/workspace.jpg',
    title: 'The Engine Room',
    description: 'An open, collaborative workspace where our analysts, fund managers, and operations team work together to deliver exceptional investment outcomes.',
  },
  {
    id: 'meeting',
    label: 'Meeting Area',
    image: '/images/office/meeting.jpg',
    title: 'Consultation Suite',
    description: 'Private meeting spaces designed for one-on-one investor consultations, portfolio reviews, and confidential discussions about your investment journey.',
  },
]

function OfficeGallery() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Our Space</span>
          <h2 className="section-title mt-2 text-brand-black">Our Office</h2>
          <div className="flex items-center justify-center gap-2 mt-2 text-brand-grey text-sm">
            <MapPin className="w-4 h-4 text-brand-red" />
            <span>{BRAND.address}</span>
          </div>
        </AnimatedSection>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-2xl p-1.5 shadow-lg border border-gray-100">
            {OFFICE_TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === i
                    ? 'bg-brand-red text-white shadow-md shadow-brand-red/20'
                    : 'text-gray-500 hover:text-brand-red hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Tab Content */}
        <AnimatedSection>
          <div className="grid lg:grid-cols-5 gap-8 items-center">
            {/* Large Image */}
            <div className="lg:col-span-3 relative rounded-2xl overflow-hidden shadow-2xl group">
              <div className="aspect-[16/10] relative">
                <Image
                  src={OFFICE_TABS[activeTab].image}
                  alt={`GHL India Ventures - ${OFFICE_TABS[activeTab].label}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority={activeTab === 0}
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="inline-block px-3 py-1 bg-brand-red/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-full mb-2">
                    {OFFICE_TABS[activeTab].label}
                  </span>
                  <h3 className="text-white text-xl font-bold">{OFFICE_TABS[activeTab].title}</h3>
                </div>
              </div>
            </div>

            {/* Description + Thumbnail Grid */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-brand-black mb-3">{OFFICE_TABS[activeTab].title}</h3>
                <p className="text-brand-grey text-sm leading-relaxed">{OFFICE_TABS[activeTab].description}</p>
              </div>

              {/* Thumbnail grid — click to switch tabs */}
              <div className="grid grid-cols-4 gap-2">
                {OFFICE_TABS.map((tab, i) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(i)}
                    className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-300 ${
                      activeTab === i
                        ? 'ring-2 ring-brand-red ring-offset-2 scale-105 shadow-lg'
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <Image
                      src={tab.image}
                      alt={tab.label}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    {activeTab === i && (
                      <div className="absolute inset-0 border-2 border-brand-red rounded-xl" />
                    )}
                  </button>
                ))}
              </div>

              {/* Visit CTA */}
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-brand-red" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-brand-black">Visit Our Office</p>
                  <p className="text-[10px] text-brand-grey">Queens Court, Egmore, Chennai</p>
                </div>
                <a
                  href="https://maps.google.com/?q=Queens+Court+Egmore+Chennai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-brand-red text-white text-[10px] font-bold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Directions
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── 9. CTA STRIP ───────────────────────────── */
function AboutCTA() {
  return (
    <section className="section-padding bg-brand-red">
      <div className="container-max mx-auto text-center">
        <AnimatedSection>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Join Our Growing Community of Sophisticated Investors
          </h2>
          <p className="text-white/80 text-base max-w-2xl mx-auto mb-8">
            Whether you&apos;re an HNI seeking differentiated returns or a founder looking for
            growth capital, we&apos;d love to start a conversation.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-3 bg-white text-brand-red font-bold text-sm rounded-lg hover:bg-gray-100 transition-all shadow-lg"
          >
            Schedule a Call <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </AnimatedSection>
      </div>
    </section>
  )
}

/* ───────────────────────────── PAGE ───────────────────────────── */
export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <OurStoryTimeline />
      <MissionVision />
      <LeadershipTeam />
      <OurValues />
      <AdvisoryBoardSection />
      <RegulatoryCompliance />
      <OfficeGallery />
      <AboutCTA />
    </>
  )
}
