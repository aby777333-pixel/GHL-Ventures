'use client'

import {
  P, SectionHeading, BulletList, NumberedList, BlogImage,
  BlogTable, RegisterButton, HighlightBox, InternalLink
} from '@/components/RichBlogArticle'

export default function Blog3EarlyStageGrowth() {
  return (
    <>
      <BlogImage
        src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=80"
        alt="Startup team working together in a modern office with laptops"
        caption="India's early-stage companies are revenue-generating, capital-efficient, and strategically positioned for scale"
      />

      <P>
        In a small office, a founder studies a dashboard glowing on his laptop. Revenue has doubled. Customers renew without hesitation. The product works. The model works. What is needed now is fuel.
      </P>
      <P>
        India&apos;s startup ecosystem has matured. Today&apos;s early-stage companies are not speculative experiments. Many are revenue-generating, capital-efficient, and strategically positioned for scale.
      </P>

      <SectionHeading level={2}>The Inflection Point Opportunity</SectionHeading>

      <P>
        The most compelling stage for disciplined venture investing often lies between Series A and pre-IPO. At this stage:
      </P>

      <BulletList items={[
        'Product-market fit is validated',
        'Revenue traction is visible',
        'Unit economics are measurable',
        'Market size is established',
        'Leadership teams are tested',
      ]} />

      <P>
        The risk of concept failure decreases. The potential for scale remains significant.
      </P>

      <BlogImage
        src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80"
        alt="SaaS dashboard showing growth metrics and analytics"
        caption="Disciplined investors focus on revenue traction, unit economics, and path to profitability"
      />

      <SectionHeading level={2}>Sectoral Drivers of Growth</SectionHeading>

      <P>India&apos;s structural trends create durable opportunity across:</P>

      <BlogTable
        caption="Key Growth Sectors in India"
        headers={['Sector', 'Opportunity Drivers', 'Growth Potential']}
        rows={[
          ['Technology & SaaS', 'Recurring revenue, scalable platforms, global expansion', 'High'],
          ['Healthcare & Wellness', 'Rising awareness, digital adoption, large markets', 'High'],
          ['Consumer & D2C', 'Premiumization, brand loyalty, omnichannel growth', 'Medium-High'],
          ['Industrial & Manufacturing', 'Make in India tailwinds, export potential, tech efficiencies', 'Medium-High'],
          ['Fintech', 'Digital payments, lending innovation, UPI ecosystem', 'High'],
        ]}
      />

      <SectionHeading level={2}>What Separates High-Quality Ventures</SectionHeading>

      <P>Disciplined investors focus on:</P>

      <BulletList items={[
        'ARR above ₹5–10 Cr (demonstrating real revenue traction)',
        '50%+ annual growth (sustainable scaling)',
        'Path to EBITDA profitability within 24 months',
        'LTV:CAC above 3:1 (efficient customer acquisition)',
        'Strong governance and ethical leadership',
      ]} />

      <P>The difference between growth and hype is data.</P>

      <BlogTable
        caption="Venture Capital Target Returns"
        headers={['Parameter', 'Target']}
        rows={[
          ['Target IRR', '22–30%'],
          ['Equity Multiple', '3x–5x'],
          ['Investment Horizon', '5–7 years'],
          ['Portfolio Size', '10–15 companies'],
          ['Exit Strategy', 'IPO / Strategic Sale / Secondary'],
        ]}
      />

      <RegisterButton />

      <SectionHeading level={2}>Value Beyond Capital</SectionHeading>

      <BlogImage
        src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80"
        alt="Business mentor coaching a startup founder at a whiteboard"
        caption="Strategic capital accelerates scale through board governance, mentorship, and network access"
      />

      <P>Strategic capital accelerates scale through:</P>

      <BulletList items={[
        'Board-level governance and strategic oversight',
        'Sales process optimization and market access',
        'Talent acquisition and organizational development',
        'Follow-on funding facilitation and investor introductions',
        'Exit planning and IPO readiness preparation',
      ]} />

      <P>
        Target returns of 22–30% IRR are achieved not by speculation, but by structured involvement.
      </P>

      <HighlightBox title="When Expertise Meets Execution">
        <P>
          When expertise meets execution-ready founders, compounding begins. <InternalLink href="/fund/direct-aif">GHL India Ventures&apos; venture capital strategy</InternalLink> backs validated companies across India&apos;s growth sectors, delivering structured returns through active portfolio management within our <InternalLink href="/fund">SEBI-registered AIF structure</InternalLink>.
        </P>
      </HighlightBox>

      <RegisterButton />
    </>
  )
}
