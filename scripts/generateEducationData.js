const fs = require('fs');
const AdmZip = require('adm-zip');
const path = require('path');

const zip = new AdmZip('C:/Users/abetr/Downloads/GHL_Education_Hub (1).docx');
const xml = zip.readAsText('word/document.xml');

const pRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
const paragraphs = [];
let pMatch;
while ((pMatch = pRegex.exec(xml)) !== null) {
  let texts = [];
  tRegex.lastIndex = 0;
  let tMatch;
  while ((tMatch = tRegex.exec(pMatch[0])) !== null) {
    texts.push(tMatch[1]);
  }
  if (texts.length > 0) {
    paragraphs.push(texts.join(''));
  }
}

// Parse articles
const articles = [];
let currentCategory = null;
let currentCategoryName = '';
let currentArticle = null;

for (let i = 0; i < paragraphs.length; i++) {
  const p = paragraphs[i].trim();
  const catMatch = p.match(/^CATEGORY\s+(\d+)$/);
  if (catMatch) {
    currentCategory = parseInt(catMatch[1]);
    if (i + 1 < paragraphs.length) currentCategoryName = paragraphs[i + 1].trim();
    continue;
  }
  const artMatch = p.match(/^ARTICLE\s+(\d+)\s+\|\s+(\d+)\s+min\s+read$/);
  if (artMatch) {
    if (currentArticle) articles.push(currentArticle);
    currentArticle = {
      id: parseInt(artMatch[1]),
      readTime: parseInt(artMatch[2]),
      categoryId: currentCategory,
      title: '',
      content: []
    };
    if (i + 1 < paragraphs.length) {
      currentArticle.title = paragraphs[i + 1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      i++;
    }
    continue;
  }
  if (p.includes('w:pBdr') || p.includes('w:rPr') || p.startsWith('Disclaimer:')) continue;
  if (p === 'GHL INDIA VENTURES' || p.includes('SEBI Registered') || p === 'Investor Education Hub' ||
      p === 'The Complete Guide' || p.includes('53 Articles') || p.includes('www.ghlindiaventures') ||
      p === 'IMPORTANT DISCLAIMER' || p === currentCategoryName) continue;
  if (currentArticle && p.length > 20) {
    let clean = p.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    currentArticle.content.push(clean);
  }
}
if (currentArticle) articles.push(currentArticle);

// Difficulty
function getDifficulty(art) {
  if (art.categoryId === 8) return 'beginner';
  const beginnerIds = [1,3,5,11,19,24,33,34,35,36,38,39,41,42,46,51,53];
  const advancedIds = [6,9,14,17,21,26,27,28,29,30,43,47];
  if (beginnerIds.includes(art.id)) return 'beginner';
  if (advancedIds.includes(art.id)) return 'advanced';
  return 'intermediate';
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
}

function getDescription(art) {
  if (!art.content.length) return art.title;
  let desc = art.content[0];
  if (desc.length > 160) desc = desc.substring(0, 157) + '...';
  return desc;
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
}

// Build TS
let ts = `// Auto-generated from GHL_Education_Hub.docx — DO NOT EDIT MANUALLY
// 53 articles across 8 categories

import {
  BookOpen, Building2, Rocket, Calculator,
  PiggyBank, Globe, TrendingUp, BookMarked,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  description: string
  articleCount: number
}

export interface Article {
  id: number
  slug: string
  title: string
  categoryId: number
  readTime: number
  difficulty: Difficulty
  description: string
  content: string[]
}

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */

export const CATEGORIES: Category[] = [
  {
    id: 1,
    name: 'Understanding AIFs',
    slug: 'understanding-aifs',
    icon: 'BookOpen',
    color: 'blue',
    description: 'Learn the fundamentals of Alternative Investment Funds, SEBI regulations, and how they work.',
    articleCount: 10,
  },
  {
    id: 2,
    name: 'Stressed Real Estate & IBC',
    slug: 'stressed-real-estate-ibc',
    icon: 'Building2',
    color: 'amber',
    description: 'Understand how distressed real estate creates value through the IBC and NCLT framework.',
    articleCount: 8,
  },
  {
    id: 3,
    name: 'Startup & Venture Capital',
    slug: 'startup-venture-capital',
    icon: 'Rocket',
    color: 'violet',
    description: 'Explore the world of venture capital, startup metrics, and early-stage investing.',
    articleCount: 7,
  },
  {
    id: 4,
    name: 'Taxation & Wealth Planning',
    slug: 'taxation-wealth-planning',
    icon: 'Calculator',
    color: 'emerald',
    description: 'Navigate AIF taxation, pass-through structures, and wealth planning strategies.',
    articleCount: 7,
  },
  {
    id: 5,
    name: 'Personal Finance & Wealth',
    slug: 'personal-finance-wealth',
    icon: 'PiggyBank',
    color: 'rose',
    description: 'Build strong financial foundations with diversification, compounding, and risk management.',
    articleCount: 8,
  },
  {
    id: 6,
    name: 'NRI Investor Guide',
    slug: 'nri-investor-guide',
    icon: 'Globe',
    color: 'cyan',
    description: 'Step-by-step guides for NRI investors on FEMA, NRO accounts, and repatriation.',
    articleCount: 5,
  },
  {
    id: 7,
    name: 'Market & Economic Insights',
    slug: 'market-economic-insights',
    icon: 'TrendingUp',
    color: 'orange',
    description: 'Macro trends, GDP growth, private credit, and real estate market outlooks.',
    articleCount: 5,
  },
  {
    id: 8,
    name: 'Glossary & Quick References',
    slug: 'glossary-quick-references',
    icon: 'BookMarked',
    color: 'gray',
    description: 'Essential terms, investor rights, and readiness checklists for AIF investing.',
    articleCount: 3,
  },
]

/* ------------------------------------------------------------------ */
/*  Category icon map                                                  */
/* ------------------------------------------------------------------ */

export const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  BookOpen,
  Building2,
  Rocket,
  Calculator,
  PiggyBank,
  Globe,
  TrendingUp,
  BookMarked,
}

/* ------------------------------------------------------------------ */
/*  Articles                                                           */
/* ------------------------------------------------------------------ */

export const ARTICLES: Article[] = [
`;

articles.forEach((art) => {
  const diff = getDifficulty(art);
  const slug = slugify(art.title);
  const desc = getDescription(art);

  ts += `  {
    id: ${art.id},
    slug: '${esc(slug)}',
    title: '${esc(art.title)}',
    categoryId: ${art.categoryId},
    readTime: ${art.readTime},
    difficulty: '${diff}',
    description: '${esc(desc)}',
    content: [
`;
  art.content.forEach(para => {
    ts += `      '${esc(para)}',\n`;
  });
  ts += `    ],
  },
`;
});

ts += `]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function getCategory(id: number): Category | undefined {
  return CATEGORIES.find(c => c.id === id)
}

export function getArticlesByCategory(categoryId: number): Article[] {
  return ARTICLES.filter(a => a.categoryId === categoryId)
}

export function getArticle(id: number): Article | undefined {
  return ARTICLES.find(a => a.id === id)
}

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find(a => a.slug === slug)
}

export function getNextArticle(currentId: number): Article | undefined {
  const idx = ARTICLES.findIndex(a => a.id === currentId)
  return idx >= 0 && idx < ARTICLES.length - 1 ? ARTICLES[idx + 1] : undefined
}

export function getPreviousArticle(currentId: number): Article | undefined {
  const idx = ARTICLES.findIndex(a => a.id === currentId)
  return idx > 0 ? ARTICLES[idx - 1] : undefined
}

export function searchArticles(query: string): Article[] {
  const q = query.toLowerCase()
  return ARTICLES.filter(
    a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.content.some(p => p.toLowerCase().includes(q))
  )
}

export const DIFFICULTY_CONFIG = {
  beginner:     { label: 'Beginner',     color: 'emerald', emoji: '🟢', points: 1 },
  intermediate: { label: 'Intermediate', color: 'amber',   emoji: '🟡', points: 2 },
  advanced:     { label: 'Advanced',     color: 'red',     emoji: '🔴', points: 3 },
} as const
`;

fs.writeFileSync(path.join(__dirname, '..', 'lib', 'educationData.ts'), ts, 'utf-8');
console.log(`Written lib/educationData.ts (${ts.length} chars, ${articles.length} articles)`);
