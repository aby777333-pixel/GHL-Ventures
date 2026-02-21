'use client'

import {
  P, SectionHeading, BulletList, NumberedList, BlogImage,
  BlogTable, RegisterButton, HighlightBox, InternalLink
} from '@/components/RichBlogArticle'

export default function Blog4GovernanceTransparency() {
  return (
    <>
      <BlogImage
        src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80"
        alt="Professional reviewing compliance documents and regulatory paperwork"
        caption="In alternative investments, governance is not a footnote — it is the foundation"
      />

      <P>
        Trust in finance is built slowly and lost instantly. For investors allocating as per SEBI AIF Regulations into private markets, governance is not a footnote. It is the foundation.
      </P>

      <SectionHeading level={2}>Why Regulation Matters</SectionHeading>

      <P>A SEBI-registered Category II AIF operates under:</P>

      <BulletList items={[
        'Defined investment concentration limits (max 25% in single investee)',
        'Quarterly regulatory reporting to SEBI',
        'Independent valuation norms for all portfolio assets',
        'Annual audits by qualified external auditors',
        'Structured investor disclosures with transparent reporting',
      ]} />

      <P>
        This creates institutional discipline within a private market structure.
      </P>

      <BlogImage
        src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80"
        alt="Balanced scales representing justice and governance"
        caption="SEBI oversight ensures investor protection through structured regulatory compliance"
      />

      <SectionHeading level={2}>The Role of Independent Trustees and Custodians</SectionHeading>

      <P>Professional trusteeship and custody ensure:</P>

      <BulletList items={[
        'Asset protection through independent custody',
        'Segregation of investor capital from fund operations',
        'Independent oversight of fund operations and decisions',
        'Continuous compliance monitoring and regulatory adherence',
      ]} />

      <P>
        Investors gain institutional-grade safeguards comparable to large global funds.
      </P>

      <BlogTable
        caption="Governance Framework — Category II AIF"
        headers={['Governance Layer', 'Purpose', 'Benefit to Investors']}
        rows={[
          ['SEBI Registration', 'Regulatory oversight', 'Legal protection & compliance'],
          ['Independent Trustee', 'Fiduciary responsibility', 'Asset protection'],
          ['Custodian', 'Asset segregation', 'Capital safety'],
          ['External Auditor', 'Financial verification', 'Transparency'],
          ['Valuation Agency', 'Independent NAV', 'Fair value reporting'],
          ['Compliance Officer', 'Regulatory adherence', 'Ongoing monitoring'],
        ]}
      />

      <RegisterButton />

      <SectionHeading level={2}>Transparency Drives Alignment</SectionHeading>

      <BlogImage
        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80"
        alt="Financial dashboard showing transparent performance metrics"
        caption="Clear communication through quarterly NAV updates, performance attribution, and transparent fee structures"
      />

      <P>Clear communication builds credibility:</P>

      <BulletList items={[
        'Quarterly NAV updates with detailed portfolio breakdowns',
        'Detailed performance attribution for each investment',
        'Disclosure of realized vs. unrealized gains',
        'Transparent fee structures with no hidden charges',
        'Independent audits available to all investors',
      ]} />

      <P>
        Performance should not require interpretation. It should require evaluation.
      </P>

      <SectionHeading level={2}>Alignment of Interests</SectionHeading>

      <P>
        When fund managers commit their own capital, implement hurdle rates, and earn carry only above predefined thresholds, incentives align naturally.
      </P>

      <BlogTable
        caption="Alignment Mechanisms in Category II AIFs"
        headers={['Mechanism', 'How It Works']}
        rows={[
          ['Manager Co-Investment', 'Fund managers invest their own capital alongside investors'],
          ['Hurdle Rate', 'Carry earned only after minimum return threshold is met'],
          ['Performance Fees', 'Success-based compensation aligned with investor returns'],
          ['Quarterly Reporting', 'Full transparency on portfolio performance and decisions'],
          ['Independent Valuation', 'Third-party NAV assessment prevents conflicts of interest'],
        ]}
      />

      <HighlightBox title="Discipline Compounds">
        <P>
          Good governance does not reduce returns. It strengthens them by protecting capital from avoidable risk. In alternative investments, discipline compounds. At <InternalLink href="/about">GHL India Ventures</InternalLink>, our commitment to <InternalLink href="/dashboard">transparent investor reporting</InternalLink> and SEBI-compliant governance ensures that your capital is protected by institutional-grade frameworks.
        </P>
      </HighlightBox>

      <RegisterButton />
    </>
  )
}
