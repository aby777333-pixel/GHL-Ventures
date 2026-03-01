/* Scene Registry — maps PlaceholderImage themes to 3D scene factories */

import type { SceneFactory } from './types'

const sceneMap: Record<string, () => Promise<{ default: SceneFactory }>> = {
  'real-estate': () => import('./RealEstateScene'),
  'startup': () => import('./StartupScene'),
  'finance': () => import('./FinanceScene'),
  'team': () => import('./TeamScene'),
  'analytics': () => import('./AnalyticsScene'),
  'compliance': () => import('./ComplianceScene'),
  'education': () => import('./EducationScene'),
  'portfolio': () => import('./PortfolioScene'),
  'location': () => import('./LocationScene'),
  'fund': () => import('./FundScene'),
  'default': () => import('./DefaultScene'),
}

export async function loadScene(theme: string): Promise<SceneFactory> {
  const loader = sceneMap[theme] || sceneMap['default']
  const mod = await loader()
  return mod.default
}
