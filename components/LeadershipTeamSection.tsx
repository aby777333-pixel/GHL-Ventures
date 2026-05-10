'use client'

/* ============================================================
   Leadership Team — shared section
   ------------------------------------------------------------
   Extracted 2026-05-10 so both /about and / (home) can mount the
   same team layout. Per the spec the home page now hosts this
   block in place of the "Find Your Ideal Investment Route"
   calculator panel.

   Styling rules from the same spec:
     - photo card background = off-white
     - no glow / hover-lift / image-scale effects
     - section background = off-white
   ============================================================ */

import Image from 'next/image'
import { TEAM_MEMBERS } from '@/lib/constants'
import AnimatedSection from '@/components/AnimatedSection'

export default function LeadershipTeamSection() {
  return (
    <section className="section-padding bg-brand-offwhite">
      <div className="container-max mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="text-brand-red font-semibold text-xs uppercase tracking-wider">Leadership</span>
          <h2 className="section-title mt-2 text-brand-black dark:text-white">Our Team</h2>
          <p className="section-subtitle mx-auto mt-4">
            Experienced professionals united by a shared passion for investing in India&apos;s future.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TEAM_MEMBERS.map((member) => (
            <AnimatedSection key={member.name}>
              {/* Plain off-white card — no glow ring, no hover-lift,
                  no image scale on hover. The portrait wrapper is also
                  off-white so when a photo finishes loading or has any
                  transparent edge, the frame around it stays off-white.
                  NOTE: the source headshots were shot on a black studio
                  backdrop, so the photo itself still carries that dark
                  bg inside the rounded frame — replacing it would need
                  re-photographed / matted assets. */}
              <div className="card text-center h-full flex flex-col bg-brand-offwhite">
                <div className="team-portrait w-full aspect-[4/5] rounded-xl overflow-hidden mb-6 bg-brand-offwhite">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={320}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-lg text-brand-black dark:text-white">{member.name}</h3>
                <p className="text-brand-red text-sm font-medium mb-3">{member.role}</p>
                <p className="text-brand-grey dark:text-gray-300 text-sm leading-relaxed flex-grow italic line-clamp-3">
                  &ldquo;{member.quote}&rdquo;
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
