'use client'

import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import {
  ArrowRight,
  MapPin,
  Sun,
  Factory,
  TrendingUp,
  Landmark,
  Shield,
  Zap,
  Target,
  BarChart3,
} from 'lucide-react'
import SpaceHero from '@/components/SpaceHero'

/* ─── Project Data ─── */
const PROJECTS = [
  {
    id: 'narikudi',
    name: 'Narikudi Solar Land',
    subtitle: 'Renewable Energy Development Opportunity',
    location: 'Narikudi, ~50 km from Madurai, Tamil Nadu',
    landArea: '~145 Acres',
    sector: 'Renewable Energy',
    sectorIcon: Sun,
    image: '/images/portfolio/narikudi-bridge.jpg',
    acquisitionCost: '\u20B922.5 Cr',
    projectedValue: '\u20B925 Cr',
    discount: '40%',
    description:
      'Approximately 145 acres of contiguous land ideal for large-scale solar power development. The site leverages the region\u2019s abundant sunlight, favourable terrain, and existing infrastructure.',
    highlights: [
      'Situated close to a major power substation for seamless grid connectivity',
      'Near Greenko Group\u2019s SEI Aadhavan & SEI Kathiravan Power Plants',
      'Prospective Dubai-based buyer showing strong development interest',
      'Region\u2019s growing prominence as a renewable energy hub',
      'Acquired at 40% discount to current market value',
    ],
    stats: [
      { label: 'Land Area', value: '~145 Acres' },
      { label: 'Acquisition', value: '\u20B922.5 Cr' },
      { label: 'Investment Projected', value: '\u20B925 Cr' },
      { label: 'Below Market', value: '40%' },
    ],
    gradient: 'from-amber-500/20 to-orange-500/10',
    glowClass: 'glow-card-amber',
  },
  {
    id: 'karadivavi',
    name: 'Karadivavi Industrial Land',
    subtitle: 'Industrial and Strategic Development Asset',
    location: 'Karadivavi, ~35 km from Coimbatore, Tamil Nadu',
    landArea: '~30 Acres',
    sector: 'Industrial & Defence Corridor',
    sectorIcon: Factory,
    image: '/images/portfolio/karadivavi-palace.jpg',
    acquisitionCost: '\u20B945 Cr',
    projectedValue: '\u20B975 Cr',
    discount: '40%',
    description:
      'A 30-acre strategic land parcel offering prime potential for industrial and infrastructure expansion, near the Defence Corridor and Sulur Airbase.',
    highlights: [
      'Proximity to the Defence Corridor and Sulur Airbase',
      'Rapidly evolving industrial and logistics hub',
      'Growing defence and manufacturing investments in the region',
      'Post-development fair market value of approximately \u20B975 Cr',
      'Acquired at 40% discount to prevailing market rates',
    ],
    stats: [
      { label: 'Land Area', value: '~30 Acres' },
      { label: 'Acquisition', value: '\u20B945 Cr' },
      { label: 'Investment Projected', value: '\u20B975 Cr' },
      { label: 'Below Market', value: '40%' },
    ],
    gradient: 'from-blue-500/20 to-cyan-500/10',
    glowClass: 'glow-card-blue',
  },
]

export default function PortfolioPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-40 pb-20 gradient-dark relative overflow-hidden">
        <SpaceHero variant="satellite" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-brand-red/3 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <span className="inline-flex items-center px-4 py-1.5 bg-brand-red/10 border border-brand-red/20 rounded-full text-brand-red text-sm font-semibold uppercase tracking-wider mb-6">
              <Target className="w-4 h-4 mr-2" />
              Strategic Acquisitions
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-4 mb-5 leading-tight">
              High-Value Assets with{' '}
              <span className="text-gradient-shimmer">Strong Appreciation Potential</span>
            </h1>
            <p className="text-base text-gray-300 max-w-3xl leading-relaxed">
              GHL India Ventures acquires strategically selected land parcels at significant discounts
              to market value, positioned in high-growth corridors for renewable energy and industrial expansion.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Portfolio Stats */}
      <section className="bg-white section-padding pb-8">
        <div className="container-max mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '2', label: 'Strategic Assets', icon: Landmark },
              { value: '~175', label: 'Total Acres', icon: MapPin },
              { value: '\u20B967.5 Cr', label: 'Capital Deployed', icon: BarChart3 },
              { value: '40%', label: 'Below Market Value', icon: TrendingUp },
            ].map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 100}>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mb-3">
                    <stat.icon className="w-6 h-6 text-brand-red" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-brand-red mb-1">{stat.value}</div>
                  <div className="text-brand-grey text-sm">{stat.label}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider-animated" />

      {/* Project Cards — Full Detail */}
      <section className="section-padding bg-brand-offwhite">
        <div className="container-max mx-auto space-y-20">
          {PROJECTS.map((project, pi) => (
            <AnimatedSection key={project.id} delay={pi * 150}>
              <div className={`card overflow-hidden ${project.glowClass}`}>
                {/* Full-width hero image */}
                <div className="relative aspect-[21/9] -mx-6 -mt-6 mb-0 overflow-hidden">
                  <img
                    src={project.image}
                    alt={`${project.name} — ${project.location}`}
                    className="w-full h-full object-cover"
                    loading={pi === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">{project.name}</h2>
                    <p className="text-white/80 text-sm mt-1">{project.subtitle}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-8 pb-2">
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {project.stats.map((stat) => (
                      <div key={stat.label} className="bg-brand-offwhite rounded-xl p-4 text-center">
                        <div className="text-xl md:text-2xl font-bold text-brand-red">{stat.value}</div>
                        <div className="text-[11px] text-brand-grey font-medium mt-1 uppercase tracking-wider">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Description + Location */}
                  <div className="grid lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3">
                      <p className="text-brand-grey text-base leading-relaxed mb-6">{project.description}</p>
                      <div className="flex items-center gap-2 text-brand-grey text-sm mb-2">
                        <MapPin className="w-4 h-4 text-brand-red shrink-0" />
                        <span>{project.location}</span>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="lg:col-span-2">
                      <h4 className="text-sm font-bold text-brand-black uppercase tracking-wider mb-4">Key Highlights</h4>
                      <ul className="space-y-3">
                        {project.highlights.map((h, hi) => (
                          <li key={hi} className="flex items-start gap-3">
                            <Shield className="w-4 h-4 text-brand-red mt-0.5 shrink-0" />
                            <span className="text-brand-grey text-sm leading-relaxed">{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <hr className="section-divider-animated" />

      {/* Investment Philosophy */}
      <section className="section-padding bg-white">
        <div className="container-max mx-auto">
          <AnimatedSection className="text-center mb-10">
            <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Our Approach</span>
            <h2 className="section-title text-brand-black mt-2">Why These Acquisitions</h2>
            <p className="section-subtitle mx-auto mt-4">
              Every acquisition reflects strategic selection, inherent growth potential, and synergy with
              GHL&apos;s core investment focus.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: TrendingUp,
                title: 'Below Market Acquisition',
                desc: 'Both properties acquired at approximately 40% below prevailing market value, creating immediate equity cushion.',
                gradient: 'from-amber-500/10 to-yellow-500/5',
              },
              {
                icon: Zap,
                title: 'High-Growth Corridors',
                desc: 'Positioned in Tamil Nadu\u2019s fastest-growing renewable energy and defence manufacturing corridors.',
                gradient: 'from-blue-500/10 to-cyan-500/5',
              },
              {
                icon: Shield,
                title: 'Strategic Value',
                desc: 'Proximity to existing infrastructure — power substations, airbases, and industrial zones — amplifies inherent value.',
                gradient: 'from-violet-500/10 to-purple-500/5',
              },
              {
                icon: BarChart3,
                title: 'Capital Appreciation',
                desc: 'Strong prospects for diversified project development and high-value appreciation driven by macro tailwinds.',
                gradient: 'from-emerald-500/10 to-green-500/5',
              },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 100}>
                <div className={'card group hover-lift h-full text-center ' + ['glow-card-amber', 'glow-card-blue', 'glow-card-violet', 'glow-card-emerald'][i % 4]}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform icon-ring-hover`}>
                    <item.icon className="w-8 h-8 text-brand-red" />
                  </div>
                  <h3 className="font-bold text-lg text-brand-black mb-3">{item.title}</h3>
                  <p className="text-brand-grey text-sm leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-brand-red text-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-3xl" />
        </div>
        <div className="container-max mx-auto relative z-10">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Interested in Strategic Land Investments?
            </h2>
            <p className="text-white/80 text-base max-w-2xl mx-auto mb-6">
              Explore how GHL India Ventures identifies and acquires high-value assets at significant
              discounts for superior capital appreciation.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 text-sm bg-white text-brand-red font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Get In Touch <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/fund"
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm border-2 border-white/30 text-white font-bold rounded-lg hover:bg-white/10 transition-all"
              >
                Learn About Our Fund <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
