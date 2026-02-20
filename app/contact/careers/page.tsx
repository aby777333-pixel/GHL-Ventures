'use client'

import { useState } from 'react'
import { Send, Briefcase, GraduationCap, MapPin, Heart, CheckCircle, ArrowRight, ChevronDown, Mail, Clock } from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'
import AnimatedSection from '@/components/AnimatedSection'

const BENEFITS = [
  { icon: Briefcase, title: 'Mission-Driven Work', desc: 'Manage real capital, make real impact. Work on stressed real estate resolution and startup investing that creates tangible value.', glow: 'glow-card-red' },
  { icon: GraduationCap, title: 'Learning-First Culture', desc: 'Regular Investment Committee exposure, mentorship from senior fund managers, and access to industry conferences and certification support.', glow: 'glow-card-blue' },
  { icon: MapPin, title: 'Chennai Headquarters', desc: 'Based in the vibrant financial hub of Egmore, Chennai — with proximity to NCLT, legal firms, and a thriving startup ecosystem.', glow: 'glow-card-emerald' },
  { icon: Heart, title: 'Competitive Compensation', desc: 'Market-competitive salary, performance-linked bonuses, and the opportunity to grow with a high-growth alternative investment firm.', glow: 'glow-card-amber' },
]

type PositionCategory = 'Full-time' | 'Contract' | 'Internship'

interface Position {
  title: string
  department: string
  location: string
  type: PositionCategory
  experience: string
  qualifications: string[]
  responsibilities: string[]
}

const POSITIONS: Position[] = [
  /* ────────── Full-Time Roles ────────── */
  {
    title: 'Investment Analyst – Stressed Real Estate',
    department: 'Investment Team',
    location: 'Chennai',
    type: 'Full-time',
    experience: '2–4 years in real estate PE, NBFCs, or distressed asset advisory',
    qualifications: [
      'Strong understanding of NCLT/IBC resolution framework and distressed asset underwriting',
      'Experience in financial modeling for real estate recovery and liquidation scenarios',
      'Ability to track IBC resolutions, NCLT orders, and auction processes',
      'MBA Finance / CFA / CA preferred',
    ],
    responsibilities: [
      'Underwrite NCLT acquisitions and model distressed asset recovery scenarios',
      'Conduct end-to-end due diligence on stressed real estate opportunities — legal, financial, and market analysis',
      'Prepare investment memos and present recommendations to the Investment Committee',
      'Track IBC timelines, monitor portfolio performance, and compute NAVs for real estate holdings',
    ],
  },
  {
    title: 'Investment Analyst – Venture Capital',
    department: 'Investment Team',
    location: 'Chennai',
    type: 'Full-time',
    experience: '2–4 years in VC, startup ecosystem, or Big 4 transaction advisory',
    qualifications: [
      'Deep understanding of the Indian startup ecosystem — sectors, valuations, and funding stages',
      'Experience sourcing deals, reviewing pitch decks, and building early-stage financial models',
      'Ex-startup operator, Big 4 with VC exposure, or accelerator/incubator background preferred',
      'MBA Finance / CFA or equivalent analytical credentials',
    ],
    responsibilities: [
      'Source, screen, and evaluate early-stage startup investment opportunities across target sectors',
      'Lead preliminary due diligence — founder interviews, market sizing, unit economics analysis',
      'Build financial models and valuation frameworks for seed to Series A deals',
      'Prepare investment notes and support Investment Committee decision-making',
    ],
  },
  {
    title: 'Investor Relations & Business Development Executive',
    department: 'Client Relations',
    location: 'Chennai / Mumbai / Remote',
    type: 'Full-time',
    experience: '3–6 years in wealth management, private banking, or investor relations',
    qualifications: [
      'Proven track record managing HNI and family office relationships',
      'Strong interpersonal skills with deep knowledge of financial products (AIFs, PMS, structured credit)',
      'Experience in investor onboarding, roadshows, and event representation',
      'NISM certifications and familiarity with SEBI AIF regulations preferred',
    ],
    responsibilities: [
      'Build and manage relationships with HNI investors, family offices, and distribution partners',
      'Handle end-to-end investor onboarding, communications, and reporting',
      'Conduct investor presentations, one-on-one consultations, and roadshows',
      'Represent GHL India Ventures at industry events, conferences, and networking forums',
    ],
  },
  {
    title: 'Compliance & Regulatory Officer',
    department: 'Compliance & Legal',
    location: 'Chennai',
    type: 'Full-time',
    experience: '3–5 years in fund compliance, securities law, or regulatory affairs',
    qualifications: [
      'CA or LLB preferred — strong understanding of SEBI AIF Regulations, PMLA, and KYC/AML norms',
      'Experience with RBI/FEMA compliance for NRI investor onboarding',
      'Familiarity with SEBI filing systems, audit coordination, and regulatory inspections',
      'Knowledge of trust deed and PPM documentation for Category II AIFs',
    ],
    responsibilities: [
      'Manage all SEBI filings, compliance calendars, and regulatory reporting for the fund',
      'Oversee PMLA/KYC documentation, AML screening, and investor verification processes',
      'Handle RBI/FEMA compliance for NRI and foreign investors',
      'Coordinate internal and external audits and ensure regulatory inspection readiness',
    ],
  },
  {
    title: 'Portfolio Associate – Startup Ecosystem',
    department: 'Portfolio Management',
    location: 'Chennai',
    type: 'Full-time',
    experience: '1–3 years in venture capital, startup operations, or management consulting',
    qualifications: [
      'Passion for the startup ecosystem with hands-on understanding of early-stage company challenges',
      'Strong analytical skills — ability to track KPIs, build dashboards, and prepare portfolio reports',
      'Experience working directly with founders on growth strategy, governance, or fundraising',
      'MBA or equivalent from a top-tier institution preferred',
    ],
    responsibilities: [
      'Work directly with investee startups on growth planning, governance frameworks, and board reporting',
      'Track portfolio company KPIs, milestones, and follow-on funding readiness',
      'Prepare quarterly portfolio reviews and LP reporting materials',
      'Support founders with strategic introductions, operational guidance, and ecosystem connections',
    ],
  },
  {
    title: 'Finance & Fund Accounting Associate',
    department: 'Finance',
    location: 'Chennai',
    type: 'Full-time',
    experience: '1–3 years in fund accounting, audit, or financial reporting',
    qualifications: [
      'CA finalist or qualified CA with exposure to fund-level accounting',
      'Experience in NAV calculations, capital account management, and investor reporting',
      'Familiarity with distribution waterfall mechanics, management fee computation, and drawdown schedules',
      'Proficiency in Tally, Excel advanced functions, and financial reporting tools',
    ],
    responsibilities: [
      'Manage fund-level bookkeeping, NAV calculations, and LP capital account reconciliation',
      'Prepare quarterly investor statements, drawdown notices, and distribution reports',
      'Coordinate with fund administrators, custodians, and statutory auditors',
      'Support annual audit processes and ensure timely regulatory financial filings',
    ],
  },
  {
    title: 'Digital Marketing & Content Strategist',
    department: 'Marketing',
    location: 'Chennai / Remote',
    type: 'Full-time',
    experience: '2–4 years in BFSI marketing, content strategy, or financial communications',
    qualifications: [
      'Strong writing skills with an understanding of BFSI compliance around marketing communications',
      'Experience managing blogs, social media, and investor education content for financial services',
      'Knowledge of SEO, email marketing, and performance analytics tools',
      'Familiarity with SEBI advertising guidelines for AIFs and investment products',
    ],
    responsibilities: [
      'Create and manage content for the GHL blog, Financial IQ section, and social media channels',
      'Develop investor education materials, newsletters, and thought leadership pieces',
      'Execute digital marketing campaigns across SEO, email, and social platforms',
      'Ensure all marketing content complies with SEBI advertising and communication guidelines',
    ],
  },
  /* ────────── Contract Role ────────── */
  {
    title: 'Technology / Full-Stack Developer',
    department: 'Technology',
    location: 'Remote',
    type: 'Contract',
    experience: '2–5 years in full-stack web development',
    qualifications: [
      'Proficiency in Next.js, React, TypeScript, and Tailwind CSS',
      'Experience building investor portals, dashboards, or fintech applications',
      'Familiarity with authentication systems, API integrations, and deployment pipelines (Netlify/Vercel)',
      'Understanding of accessibility standards and responsive design',
    ],
    responsibilities: [
      'Maintain and evolve the GHL India Ventures website, investor portal, and financial tools',
      'Build new features — calculators, dashboards, and document management interfaces',
      'Optimize site performance, SEO, and Core Web Vitals',
      'Collaborate with the team on UI/UX improvements and technical infrastructure',
    ],
  },
  /* ────────── Internship Roles ────────── */
  {
    title: 'Investment Research Intern',
    department: 'Investment Team',
    location: 'Chennai',
    type: 'Internship',
    experience: 'MBA Finance students from IIMs, XLRI, IFMR, Great Lakes, or equivalent B-schools',
    qualifications: [
      'Currently pursuing MBA in Finance or equivalent postgraduate program',
      'Strong analytical skills with proficiency in Excel and financial modeling',
      'Interest in alternative investments, stressed assets, or venture capital',
      'Ability to write clear research notes and investment summaries',
    ],
    responsibilities: [
      'Assist the investment team with sector research, company analysis, and market mapping',
      'Prepare research notes on stressed real estate markets, NCLT resolutions, and startup sectors',
      'Support due diligence processes — data collection, competitor analysis, and financial benchmarking',
      'Gain hands-on exposure to Investment Committee processes and deal evaluation',
    ],
  },
  {
    title: 'Legal & Compliance Intern',
    department: 'Compliance & Legal',
    location: 'Chennai',
    type: 'Internship',
    experience: 'Law students interested in securities law and corporate finance',
    qualifications: [
      'Currently pursuing LLB / LLM with interest in securities regulation and fund compliance',
      'Understanding of SEBI regulations, Companies Act, and basic corporate finance concepts',
      'Strong research and drafting skills with attention to detail',
      'Interest in alternative investment funds, NCLT proceedings, or fintech regulation',
    ],
    responsibilities: [
      'Assist with regulatory research on SEBI AIF regulations, FEMA compliance, and PMLA requirements',
      'Support documentation processes — PPM reviews, investor agreements, and compliance checklists',
      'Track regulatory updates and prepare internal compliance briefing notes',
      'Gain exposure to fund structuring, trust deed documentation, and investor protection frameworks',
    ],
  },
  {
    title: 'Financial Content Writing Intern',
    department: 'Marketing',
    location: 'Chennai / Remote',
    type: 'Internship',
    experience: 'Graduate / postgraduate with strong financial writing skills',
    qualifications: [
      'Excellent command of English with ability to simplify complex financial concepts',
      'Interest in alternative investments, personal finance, or BFSI communication',
      'Portfolio of writing samples — blog posts, articles, or academic papers on finance topics',
      'Basic understanding of SEO and digital content best practices',
    ],
    responsibilities: [
      'Write articles for the GHL blog and Financial IQ section — covering AIFs, startup investing, and wealth management',
      'Research and draft investor education content, infographics, and social media copy',
      'Support the content calendar with timely pieces on market trends and regulatory developments',
      'Work with the marketing team to ensure all content meets BFSI compliance standards',
    ],
  },
]

const glowColors = ['glow-card-red', 'glow-card-blue', 'glow-card-violet', 'glow-card-emerald', 'glow-card-amber']

const typeBadge: Record<PositionCategory, { bg: string; text: string }> = {
  'Full-time': { bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
  'Contract': { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  'Internship': { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
}

const fullTimeRoles = POSITIONS.filter(p => p.type === 'Full-time')
const contractRoles = POSITIONS.filter(p => p.type === 'Contract')
const internRoles = POSITIONS.filter(p => p.type === 'Internship')

export default function CareersPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', position: '',
    experience: '', currentCompany: '', currentCTC: '',
    linkedin: '', portfolio: '', coverLetter: '', privacy: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [expandedRole, setExpandedRole] = useState<number | null>(null)

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyForRole = (roleTitle: string) => {
    setFormData((prev) => ({ ...prev, position: roleTitle }))
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden gradient-dark pt-40 pb-12">
        <SpaceHero variant="mars" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-black/50 pointer-events-none" />
        <div className="container-max mx-auto relative z-10 text-center">
          <AnimatedSection>
            <span className="eyebrow text-brand-red">Join Our Team</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mt-3 mb-5">
              Careers at <span className="text-gradient">GHL India Ventures</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Build the future of alternative investing in India. Join a mission-driven team managing stressed real estate recovery and early-stage startup investments.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Why Work With Us ── */}
      <section className="section-padding bg-white dark:bg-brand-black">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-12">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Culture & Benefits</span>
            <h2 className="section-title mt-2 text-brand-black">Why Work With Us</h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
                <div className={`card h-full hover:-translate-y-1 ${item.glow}`}>
                  <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-brand-red" />
                  </div>
                  <h3 className="font-bold text-brand-black mb-2 text-sm">{item.title}</h3>
                  <p className="text-brand-grey text-xs leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open Positions ── */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto max-w-3xl">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Current Openings</span>
            <h2 className="section-title mt-2 text-brand-black">Open Positions</h2>
            <p className="text-brand-grey text-sm mt-3 max-w-xl mx-auto">{POSITIONS.length} open roles across investment, operations, and technology teams</p>
          </AnimatedSection>

          {/* Full-Time Roles */}
          <AnimatedSection className="mb-3">
            <h3 className="text-sm font-bold text-brand-black uppercase tracking-wider flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-brand-red" /> Full-Time Positions
              <span className="text-xs font-normal text-brand-grey">({fullTimeRoles.length})</span>
            </h3>
          </AnimatedSection>
          <div className="space-y-4 mb-10">
            {fullTimeRoles.map((role, i) => {
              const globalIdx = POSITIONS.indexOf(role)
              return (
              <AnimatedSection key={role.title} delay={i * 80}>
                <div className={`border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-brand-black ${glowColors[i % 5]}`}>
                  <button
                    onClick={() => setExpandedRole(expandedRole === globalIdx ? null : globalIdx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <h3 className="font-bold text-brand-black text-base">{role.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full font-medium">{role.department}</span>
                        <span className="text-xs bg-gray-100 text-brand-grey px-2 py-0.5 rounded-full">{role.location}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${typeBadge[role.type].bg} ${typeBadge[role.type].text}`}>{role.type}</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-brand-grey shrink-0 transition-transform duration-300 ${expandedRole === globalIdx ? 'rotate-180 text-brand-red' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${expandedRole === globalIdx ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-5">
                      <div className="flex items-center gap-2 text-xs text-brand-grey mb-4 bg-gray-50 px-3 py-2 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-brand-red shrink-0" />
                        <span><strong className="text-brand-black">Experience:</strong> {role.experience}</span>
                      </div>
                      <h4 className="font-semibold text-brand-black text-sm mb-2">Key Responsibilities</h4>
                      <ul className="space-y-1.5 mb-4">
                        {role.responsibilities.map((resp, j) => (
                          <li key={j} className="text-brand-grey text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-brand-red rounded-full shrink-0 mt-1.5" />
                            {resp}
                          </li>
                        ))}
                      </ul>
                      <h4 className="font-semibold text-brand-black text-sm mb-2">Qualifications</h4>
                      <ul className="space-y-1.5 mb-5">
                        {role.qualifications.map((qual, j) => (
                          <li key={j} className="text-brand-grey text-sm flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                            {qual}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleApplyForRole(role.title)}
                        className="inline-flex items-center px-5 py-2 bg-brand-red text-white font-semibold text-xs rounded-lg hover:bg-red-700 transition-all"
                      >
                        Apply for This Role <ArrowRight className="ml-2 w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            )})}
          </div>

          {/* Contract Roles */}
          <AnimatedSection className="mb-3">
            <h3 className="text-sm font-bold text-brand-black uppercase tracking-wider flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-blue-600" /> Contract / Part-Time
              <span className="text-xs font-normal text-brand-grey">({contractRoles.length})</span>
            </h3>
          </AnimatedSection>
          <div className="space-y-4 mb-10">
            {contractRoles.map((role) => {
              const globalIdx = POSITIONS.indexOf(role)
              return (
              <AnimatedSection key={role.title}>
                <div className={`border border-blue-100 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-brand-black glow-card-blue`}>
                  <button
                    onClick={() => setExpandedRole(expandedRole === globalIdx ? null : globalIdx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <h3 className="font-bold text-brand-black text-base">{role.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full font-medium">{role.department}</span>
                        <span className="text-xs bg-gray-100 text-brand-grey px-2 py-0.5 rounded-full">{role.location}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${typeBadge[role.type].bg} ${typeBadge[role.type].text}`}>{role.type}</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-brand-grey shrink-0 transition-transform duration-300 ${expandedRole === globalIdx ? 'rotate-180 text-brand-red' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${expandedRole === globalIdx ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-5">
                      <div className="flex items-center gap-2 text-xs text-brand-grey mb-4 bg-gray-50 px-3 py-2 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span><strong className="text-brand-black">Experience:</strong> {role.experience}</span>
                      </div>
                      <h4 className="font-semibold text-brand-black text-sm mb-2">Key Responsibilities</h4>
                      <ul className="space-y-1.5 mb-4">
                        {role.responsibilities.map((resp, j) => (
                          <li key={j} className="text-brand-grey text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                            {resp}
                          </li>
                        ))}
                      </ul>
                      <h4 className="font-semibold text-brand-black text-sm mb-2">Qualifications</h4>
                      <ul className="space-y-1.5 mb-5">
                        {role.qualifications.map((qual, j) => (
                          <li key={j} className="text-brand-grey text-sm flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                            {qual}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleApplyForRole(role.title)}
                        className="inline-flex items-center px-5 py-2 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition-all"
                      >
                        Apply for This Role <ArrowRight className="ml-2 w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            )})}
          </div>

          {/* Internship Roles */}
          <AnimatedSection className="mb-3">
            <h3 className="text-sm font-bold text-brand-black uppercase tracking-wider flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-purple-600" /> Internship & Trainee Programmes
              <span className="text-xs font-normal text-brand-grey">({internRoles.length})</span>
            </h3>
          </AnimatedSection>
          <div className="space-y-4">
            {internRoles.map((role, i) => {
              const globalIdx = POSITIONS.indexOf(role)
              return (
              <AnimatedSection key={role.title} delay={i * 80}>
                <div className={`border border-purple-100 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-brand-black glow-card-violet`}>
                  <button
                    onClick={() => setExpandedRole(expandedRole === globalIdx ? null : globalIdx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <h3 className="font-bold text-brand-black text-base">{role.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full font-medium">{role.department}</span>
                        <span className="text-xs bg-gray-100 text-brand-grey px-2 py-0.5 rounded-full">{role.location}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${typeBadge[role.type].bg} ${typeBadge[role.type].text}`}>{role.type}</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-brand-grey shrink-0 transition-transform duration-300 ${expandedRole === globalIdx ? 'rotate-180 text-brand-red' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${expandedRole === globalIdx ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-5">
                      <div className="flex items-center gap-2 text-xs text-brand-grey mb-4 bg-purple-50 px-3 py-2 rounded-lg">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span><strong className="text-brand-black">Ideal Candidate:</strong> {role.experience}</span>
                      </div>
                      <h4 className="font-semibold text-brand-black text-sm mb-2">What You&apos;ll Do</h4>
                      <ul className="space-y-1.5 mb-4">
                        {role.responsibilities.map((resp, j) => (
                          <li key={j} className="text-brand-grey text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0 mt-1.5" />
                            {resp}
                          </li>
                        ))}
                      </ul>
                      <h4 className="font-semibold text-brand-black text-sm mb-2">What We&apos;re Looking For</h4>
                      <ul className="space-y-1.5 mb-5">
                        {role.qualifications.map((qual, j) => (
                          <li key={j} className="text-brand-grey text-sm flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                            {qual}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleApplyForRole(role.title)}
                        className="inline-flex items-center px-5 py-2 bg-purple-600 text-white font-semibold text-xs rounded-lg hover:bg-purple-700 transition-all"
                      >
                        Apply for This Internship <ArrowRight className="ml-2 w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            )})}
          </div>
        </div>
      </section>

      {/* ── Application Form ── */}
      <section id="apply" className="section-padding bg-white dark:bg-brand-black">
        <div className="container-max mx-auto max-w-3xl">
          <AnimatedSection>
            <div className="card glow-card-red">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-xl font-bold text-brand-black mb-2">Apply Now</h2>
                  <p className="text-brand-grey text-sm mb-6">Fill out the form below and our HR team will get back to you within 5 working days.</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Full Name *" required className="input-field" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                    <input type="email" placeholder="Email *" required className="input-field" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey text-sm">+91</span>
                      <input type="tel" placeholder="Phone *" required className="input-field pl-14" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                    </div>
                    <select className="input-field" value={formData.position} onChange={(e) => handleChange('position', e.target.value)} required>
                      <option value="">Position Applying For *</option>
                      <optgroup label="Full-Time Positions">
                        {fullTimeRoles.map((p) => (
                          <option key={p.title} value={p.title}>{p.title}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Contract / Part-Time">
                        {contractRoles.map((p) => (
                          <option key={p.title} value={p.title}>{p.title}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Internship & Trainee">
                        {internRoles.map((p) => (
                          <option key={p.title} value={p.title}>{p.title}</option>
                        ))}
                      </optgroup>
                      <option value="General Application">General Application</option>
                    </select>
                    <select className="input-field" value={formData.experience} onChange={(e) => handleChange('experience', e.target.value)} required>
                      <option value="">Years of Experience *</option>
                      <option value="0-1">0 – 1 years</option>
                      <option value="1-3">1 – 3 years</option>
                      <option value="3-5">3 – 5 years</option>
                      <option value="5-10">5 – 10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                    <input type="text" placeholder="Current Company / Institution" className="input-field" value={formData.currentCompany} onChange={(e) => handleChange('currentCompany', e.target.value)} />
                    <input type="text" placeholder="Current CTC (Optional)" className="input-field" value={formData.currentCTC} onChange={(e) => handleChange('currentCTC', e.target.value)} />
                    <input type="url" placeholder="LinkedIn Profile URL" className="input-field" value={formData.linkedin} onChange={(e) => handleChange('linkedin', e.target.value)} />
                  </div>

                  <input type="url" placeholder="Portfolio / Work Samples URL (Optional)" className="input-field" value={formData.portfolio} onChange={(e) => handleChange('portfolio', e.target.value)} />

                  <div>
                    <textarea placeholder="Why do you want to join GHL India Ventures? *" required className="input-field resize-none" rows={4} maxLength={500} value={formData.coverLetter} onChange={(e) => handleChange('coverLetter', e.target.value)} />
                    <p className="text-xs text-brand-grey mt-1">{formData.coverLetter.length}/500 characters</p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" required checked={formData.privacy} onChange={(e) => handleChange('privacy', e.target.checked)} className="w-4 h-4 text-brand-red rounded border-gray-300 mt-0.5 focus:ring-brand-red" />
                    <span className="text-xs text-brand-grey">I consent to GHL India Ventures processing my personal data for recruitment purposes and confirm that the information provided is accurate.</span>
                  </label>

                  <button type="submit" className="btn-primary w-full text-center flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Submit Application
                  </button>
                </form>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-black mb-2">Application Submitted!</h3>
                  <p className="text-brand-grey text-sm mb-6">Thank you for your interest in joining GHL India Ventures. Our HR team will review your application and reach out within 5 working days.</p>
                  <button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', position: '', experience: '', currentCompany: '', currentCTC: '', linkedin: '', portfolio: '', coverLetter: '', privacy: false }) }} className="text-brand-red font-semibold text-sm hover:underline">
                    Submit Another Application
                  </button>
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section-padding bg-brand-red">
        <div className="container-max mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Not Seeing a Fit?</h2>
            <p className="text-white/80 text-base max-w-2xl mx-auto mb-8">
              We are always looking for exceptional talent. Send your CV and a note about what excites you about alternative investments.
            </p>
            <a href="mailto:careers@ghlindiaventures.com" className="inline-flex items-center px-8 py-3 bg-white text-brand-red font-bold text-sm rounded-lg hover:bg-gray-100 transition-all shadow-lg">
              <Mail className="mr-2 w-5 h-5" /> careers@ghlindiaventures.com
            </a>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
