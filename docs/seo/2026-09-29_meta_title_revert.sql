-- Revert for the 2026-09-29 SEO title pass (Pulse TITLE_LONG / TITLE_SHORT).
-- These are the meta_title values as they were BEFORE that pass. Run any
-- subset in the Supabase SQL editor to restore a title. Only meta_title (the
-- <title> tag) was changed; post titles / headlines were not touched.

update blog_posts p set meta_title = v.t from (values
  ('ai-disruption-alternative-investments-2026', 'AI Is Reshaping Alternative Investments in 2026: How Smart Capital Stays Ahead | GHL India Ventures'),
  ('aif-vs-direct-real-estate-why-hnis-are-choosing-funds-over-buying-property-directly', ''),
  ('aif-vs-pms-which-is-right-for-hnis', 'AIF vs PMS: Which Is Right for High-Net-Worth Investors? | GHL India Ventures'),
  ('alternative-investment-funds-in-india-how-aifs-unlock-high-growth-opportunities', 'What Are Alternative Investment Funds (AIFs) in India? | GHL India Ventures'),
  ('category-ii-aif-explained-for-hnis-structure-benefits-and-risks', ''),
  ('category-ii-aif-india-complete-guide', 'Category II AIF India: Complete Guide to SEBI Registered Alternative Investment Funds for HNIs & Institutional Investors | GHL India Ventures'),
  ('category-ii-aif-investments-benefits-for-long-term-investors', 'Category II AIF Investments: Benefits, Features & Long-Term Wealth Creation | GHL India Ventures'),
  ('category-ii-aif-investments-sebi-registered-alternative-investment-fund', 'Category II AIF Investments Explained | SEBI Registered Alternative Investment Fund | GHL India Ventures'),
  ('category-ii-aif-preferred-choice-sophisticated-investors', 'Why Category II AIFs Are Becoming the Preferred Choice for Sophisticated Investors in India | GHL India Ventures'),
  ('distressed-real-estate-investing-india-ghl-india-ventures', 'Why Patience — Not Panic — Defines Success in India''s Distressed Real Estate Market'),
  ('governance-transparency-alternative-investment-funds', 'The Importance of Governance and Transparency in Alternative Investment Funds | GHL India Ventures'),
  ('how-do-aifs-generate-returns-understanding-aif-investment-strategies', ''),
  ('how-ghl-india-ventures-identifies-high-return-real-estate-opportunities', null),
  ('how-much-should-you-allocate-to-alternative-investments-a-portfolio-framework-for-hnis', ''),
  ('how-stressed-real-estate-investing-works-category-ii-aif', 'How Stressed Real Estate Investing Works Through a Category II AIF'),
  ('india-aif-landscape-2025-growth-trends', 'India''s AIF Landscape in 2025: Key Growth Trends Every Investor Should Know | GHL India Ventures'),
  ('investing-in-distressed-assets-in-india-a-strategic-guide-ghl-india-ventures', 'Investing in Distressed Assets in India: A Strategic Guide | GHL India Ventures'),
  ('nris-guide-to-investing-in-indian-aifs-process-repatriation-tax-rules', ''),
  ('sebi-aif-regulations-2026-what-changed', 'SEBI AIF Regulations 2026: What Changed and What It Means for Your Portfolio | GHL India Ventures'),
  ('sebi-co-invest-framework-explained-a-simple-walkthrough-for-first-time-alternative-investors', ''),
  ('sebi-co-invest-framework-professionals-guide', 'SEBI Co-Invest Framework: A Professional''s Guide to Structured Alternative Returns | GHL India Ventures'),
  ('stressed-real-estate-high-alpha-opportunities', 'How Stressed Real Estate Creates High-Alpha Investment Opportunities | GHL India Ventures'),
  ('stressed-real-estate-nclt-hidden-value', 'How NCLT Resolutions Create Hidden Value in Stressed Real Estate | GHL India Ventures'),
  ('the-day-the-investment-superhero-arrived', 'Meet the Investment Superhero: GHL India Ventures Category II AIF, The Hero That Protects While It Grows'),
  ('understanding-category-ii-aifs-a-complete-guide-for-indian-investors', null),
  ('value-investing-in-india-s-distressed-markets-ghl-india-ventures-sebi-category-ii-aif', 'Value Investing in India''s Distressed Markets | GHL India Ventures | SEBI Category II AIF'),
  ('why-india-s-hni-investors-are-moving-capital-into-alternative-assets-ghl-india-ventures', 'Why India''s HNI Investors Are Moving Capital Into Alternative Assets | GHL India Ventures'),
  ('why-stressed-real-estate-is-india-s-best-kept-investment-secret', null)
) as v(slug, t) where p.slug = v.slug;

update financial_iq_posts p set meta_title = v.t from (values
  ('budgeting-your-money-part-1', 'Budgeting your money - Part-1'),
  ('budgeting-your-money-part-2', 'Budgeting your money - Part-2'),
  ('budgeting-your-money-part-3', 'Budgeting your money - Part-3'),
  ('budgeting-your-money-part-4', 'Budgeting your money - Part-4'),
  ('budgeting-your-money-part-5', 'Budgeting your money - Part-5'),
  ('distressed-asset-investing-india-ghl-ventures', null),
  ('how-to-read-fund-fact-sheet', 'How to Read a Fund Fact Sheet: An Investor''s Due-Diligence Checklist'),
  ('portfolio-diversification-alternatives', 'Portfolio Diversification: Why Alternative Investments Matter in 2026'),
  ('smart-capital-doesn-t-sit-in-banks-it-moves-where-it-actually-grows', 'Smart capital doesn’t sit in banks - it moves where it actually grows.'),
  ('understanding-ncd-debentures', 'Understanding NCD Debentures: A Beginner''s Guide to Fixed-Return Investing'),
  ('understanding-stressed-assets-real-estate', 'Understanding Stressed Assets in Real Estate: NCLT Opportunity in India'),
  ('what-is-aif', 'What Is an Alternative Investment Fund (AIF)? 2026 Guide for Indian Investors')
) as v(slug, t) where p.slug = v.slug;

-- Also changed that day (HIGH pass), for completeness:
-- blog_posts 'the-day-the-investment-superhero-arrived'.canonical_url was
--   'https://ghlindiaventures.com/blog/ghl-india-ventures-category-ii-aif-superhero-investment'
-- financial_iq_posts 'leveraging-your-money-part-3'.meta_description / excerpt were
--   identical to part-2's.
-- MEDIUM pass: blog_posts 'how-stressed-real-estate-investing-works-category-ii-aif'.content
--   had a stray empty '<h3></h3>' at the very start (removed). To restore:
--   update blog_posts set content = '<h3></h3>' || E'\n' || content
--   where slug = 'how-stressed-real-estate-investing-works-category-ii-aif';
