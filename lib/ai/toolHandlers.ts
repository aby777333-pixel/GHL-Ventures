/* ─────────────────────────────────────────────────────────────
   AI Tool Handlers — Portal-specific tool configurations

   Defines which AI tools are available per portal, their
   configurations, and input schemas. Used by the AI modules
   to render tool UIs and route to aiService.executeAITool().
   ───────────────────────────────────────────────────────────── */

export interface AIToolConfig {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  portal: ('admin' | 'staff' | 'client')[]
  inputFields: AIToolInputField[]
  requiresAuth: boolean
  premium?: boolean
}

export interface AIToolInputField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'file' | 'number' | 'toggle'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
}

// ── Admin AI Tools ──────────────────────────────────────────

export const ADMIN_AI_TOOLS: AIToolConfig[] = [
  {
    id: 'document-analyzer',
    name: 'Document Analyzer',
    description: 'Analyze documents for key entities, risk flags, and compliance issues.',
    category: 'Analysis',
    icon: 'FileSearch',
    color: '#3B82F6',
    portal: ['admin'],
    requiresAuth: true,
    inputFields: [
      { name: 'type', label: 'Document Type', type: 'select', required: true, options: [
        { value: 'financial', label: 'Financial Statement' },
        { value: 'kyc', label: 'KYC Document' },
        { value: 'legal', label: 'Legal Agreement' },
        { value: 'compliance', label: 'Compliance Report' },
      ]},
      { name: 'content', label: 'Document Content / Description', type: 'textarea', placeholder: 'Paste document text or describe the document...', required: true },
    ],
  },
  {
    id: 'email-composer',
    name: 'Email Composer',
    description: 'Generate professional emails for client and internal communications.',
    category: 'Communication',
    icon: 'Mail',
    color: '#10B981',
    portal: ['admin', 'staff'],
    requiresAuth: true,
    inputFields: [
      { name: 'recipient', label: 'Recipient Name', type: 'text', placeholder: 'Client or team member name', required: true },
      { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject', required: true },
      { name: 'context', label: 'Context', type: 'textarea', placeholder: 'What should the email cover?', required: true },
      { name: 'tone', label: 'Tone', type: 'select', options: [
        { value: 'professional', label: 'Professional' },
        { value: 'friendly', label: 'Friendly' },
        { value: 'formal', label: 'Formal' },
        { value: 'urgent', label: 'Urgent' },
      ]},
    ],
  },
  {
    id: 'risk-engine',
    name: 'Risk Assessment Engine',
    description: 'Analyze portfolio risk factors and generate risk scores.',
    category: 'Risk',
    icon: 'Shield',
    color: '#EF4444',
    portal: ['admin'],
    requiresAuth: true,
    inputFields: [
      { name: 'portfolioId', label: 'Portfolio / Client ID', type: 'text', placeholder: 'Enter portfolio or client identifier', required: true },
      { name: 'scope', label: 'Assessment Scope', type: 'select', options: [
        { value: 'full', label: 'Full Portfolio' },
        { value: 'concentration', label: 'Concentration Risk' },
        { value: 'market', label: 'Market Risk' },
        { value: 'liquidity', label: 'Liquidity Risk' },
      ]},
    ],
  },
  {
    id: 'compliance-checker',
    name: 'Compliance Checker',
    description: 'Verify regulatory compliance across SEBI, FATCA, and AML frameworks.',
    category: 'Compliance',
    icon: 'CheckSquare',
    color: '#8B5CF6',
    portal: ['admin'],
    requiresAuth: true,
    inputFields: [
      { name: 'scope', label: 'Check Scope', type: 'select', required: true, options: [
        { value: 'full', label: 'Full Compliance Review' },
        { value: 'kyc', label: 'KYC/AML Only' },
        { value: 'sebi', label: 'SEBI Regulations' },
        { value: 'fatca', label: 'FATCA Compliance' },
      ]},
      { name: 'entity', label: 'Entity / Fund Name', type: 'text', placeholder: 'Specify fund or entity to check' },
    ],
  },
  {
    id: 'contract-generator',
    name: 'Contract Generator',
    description: 'Generate investment agreements and legal documents.',
    category: 'Legal',
    icon: 'FileText',
    color: '#F59E0B',
    portal: ['admin'],
    requiresAuth: true,
    premium: true,
    inputFields: [
      { name: 'type', label: 'Contract Type', type: 'select', required: true, options: [
        { value: 'investment-agreement', label: 'Investment Agreement' },
        { value: 'subscription', label: 'Subscription Form' },
        { value: 'side-letter', label: 'Side Letter' },
        { value: 'nda', label: 'Non-Disclosure Agreement' },
      ]},
      { name: 'partyName', label: 'Counterparty Name', type: 'text', required: true },
      { name: 'amount', label: 'Investment Amount', type: 'number', placeholder: '₹' },
    ],
  },
  {
    id: 'meeting-summarizer',
    name: 'Meeting Summarizer',
    description: 'Extract key points and action items from meeting notes.',
    category: 'Productivity',
    icon: 'MessageSquare',
    color: '#06B6D4',
    portal: ['admin', 'staff'],
    requiresAuth: true,
    inputFields: [
      { name: 'notes', label: 'Meeting Notes', type: 'textarea', placeholder: 'Paste meeting notes or transcript...', required: true },
      { name: 'participants', label: 'Number of Participants', type: 'number' },
      { name: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g., 45 minutes' },
    ],
  },
  {
    id: 'report-builder',
    name: 'Report Builder',
    description: 'Generate comprehensive reports from portfolio and market data.',
    category: 'Reporting',
    icon: 'BarChart3',
    color: '#EC4899',
    portal: ['admin'],
    requiresAuth: true,
    inputFields: [
      { name: 'type', label: 'Report Type', type: 'select', required: true, options: [
        { value: 'quarterly-performance', label: 'Quarterly Performance' },
        { value: 'annual-review', label: 'Annual Review' },
        { value: 'risk-report', label: 'Risk Report' },
        { value: 'compliance-report', label: 'Compliance Report' },
      ]},
      { name: 'period', label: 'Period', type: 'text', placeholder: 'e.g., Q4 2024' },
    ],
  },
  {
    id: 'market-analyzer',
    name: 'Market Analyzer',
    description: 'Analyze market trends, sectors, and investment opportunities.',
    category: 'Research',
    icon: 'TrendingUp',
    color: '#14B8A6',
    portal: ['admin'],
    requiresAuth: true,
    inputFields: [
      { name: 'sector', label: 'Sector', type: 'select', options: [
        { value: 'real-estate', label: 'Real Estate' },
        { value: 'startups', label: 'Startups & VCs' },
        { value: 'fixed-income', label: 'Fixed Income' },
        { value: 'equities', label: 'Equities' },
        { value: 'commodities', label: 'Commodities' },
      ]},
      { name: 'query', label: 'Analysis Focus', type: 'textarea', placeholder: 'What aspect of the market would you like analyzed?' },
    ],
  },
]

// ── Staff AI Tools ──────────────────────────────────────────

export const STAFF_AI_TOOLS: AIToolConfig[] = [
  {
    id: 'smart-reply',
    name: 'Smart Reply',
    description: 'Generate professional reply suggestions for client communications.',
    category: 'Communication',
    icon: 'MessageCircle',
    color: '#3B82F6',
    portal: ['staff'],
    requiresAuth: true,
    inputFields: [
      { name: 'context', label: 'Client Message', type: 'textarea', placeholder: 'Paste the client message you need to respond to...', required: true },
      { name: 'tone', label: 'Response Tone', type: 'select', options: [
        { value: 'empathetic', label: 'Empathetic' },
        { value: 'professional', label: 'Professional' },
        { value: 'concise', label: 'Brief & Concise' },
      ]},
    ],
  },
  {
    id: 'sentiment-analyzer',
    name: 'Sentiment Analyzer',
    description: 'Analyze client sentiment from messages, calls, and interactions.',
    category: 'Analysis',
    icon: 'Heart',
    color: '#EC4899',
    portal: ['staff'],
    requiresAuth: true,
    inputFields: [
      { name: 'text', label: 'Client Communication', type: 'textarea', placeholder: 'Paste the communication to analyze...', required: true },
    ],
  },
  {
    id: 'ticket-classifier',
    name: 'Ticket Classifier',
    description: 'Auto-classify support tickets by category, priority, and suggested assignee.',
    category: 'Automation',
    icon: 'Tag',
    color: '#F59E0B',
    portal: ['staff'],
    requiresAuth: true,
    inputFields: [
      { name: 'subject', label: 'Ticket Subject', type: 'text', required: true },
      { name: 'description', label: 'Ticket Description', type: 'textarea', required: true },
    ],
  },
  {
    id: 'knowledge-search',
    name: 'Knowledge Search',
    description: 'Search the internal knowledge base for quick answers.',
    category: 'Support',
    icon: 'Search',
    color: '#10B981',
    portal: ['staff'],
    requiresAuth: true,
    inputFields: [
      { name: 'query', label: 'Search Query', type: 'text', placeholder: 'What do you need help with?', required: true },
    ],
  },
  {
    id: 'call-script',
    name: 'Call Script Generator',
    description: 'Generate personalized call scripts for client outreach.',
    category: 'Sales',
    icon: 'Phone',
    color: '#8B5CF6',
    portal: ['staff'],
    requiresAuth: true,
    inputFields: [
      { name: 'clientName', label: 'Client Name', type: 'text', required: true },
      { name: 'purpose', label: 'Call Purpose', type: 'select', options: [
        { value: 'quarterly-review', label: 'Quarterly Review' },
        { value: 'new-opportunity', label: 'New Investment Opportunity' },
        { value: 'kyc-followup', label: 'KYC Follow-up' },
        { value: 'complaint-resolution', label: 'Complaint Resolution' },
      ]},
      { name: 'agentName', label: 'Your Name', type: 'text' },
    ],
  },
  {
    id: 'escalation-advisor',
    name: 'Escalation Advisor',
    description: 'Determine if a case needs escalation and suggest the right path.',
    category: 'Support',
    icon: 'AlertTriangle',
    color: '#EF4444',
    portal: ['staff'],
    requiresAuth: true,
    inputFields: [
      { name: 'issue', label: 'Issue Description', type: 'textarea', placeholder: 'Describe the situation...', required: true },
      { name: 'interactionCount', label: 'Previous Interactions', type: 'number', placeholder: 'How many times has client contacted about this?' },
    ],
  },
]

// ── Shared AI Tools ─────────────────────────────────────────

export const SHARED_AI_TOOLS: AIToolConfig[] = [
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'General-purpose AI assistant for questions and analysis.',
    category: 'General',
    icon: 'Bot',
    color: '#6366F1',
    portal: ['admin', 'staff', 'client'],
    requiresAuth: false,
    inputFields: [
      { name: 'query', label: 'Your Question', type: 'textarea', placeholder: 'Ask anything...', required: true },
    ],
  },
  {
    id: 'translate',
    name: 'Translator',
    description: 'Translate text between English and Indian languages.',
    category: 'Language',
    icon: 'Languages',
    color: '#06B6D4',
    portal: ['admin', 'staff'],
    requiresAuth: false,
    inputFields: [
      { name: 'text', label: 'Text to Translate', type: 'textarea', required: true },
      { name: 'targetLang', label: 'Target Language', type: 'select', options: [
        { value: 'Hindi', label: 'Hindi' },
        { value: 'Tamil', label: 'Tamil' },
        { value: 'Telugu', label: 'Telugu' },
        { value: 'Kannada', label: 'Kannada' },
        { value: 'Malayalam', label: 'Malayalam' },
        { value: 'Bengali', label: 'Bengali' },
        { value: 'Marathi', label: 'Marathi' },
        { value: 'Gujarati', label: 'Gujarati' },
      ]},
    ],
  },
  {
    id: 'summarize',
    name: 'Text Summarizer',
    description: 'Summarize long documents, emails, or reports into key points.',
    category: 'Productivity',
    icon: 'FileStack',
    color: '#F97316',
    portal: ['admin', 'staff'],
    requiresAuth: false,
    inputFields: [
      { name: 'text', label: 'Text to Summarize', type: 'textarea', placeholder: 'Paste the text to summarize...', required: true },
      { name: 'style', label: 'Summary Style', type: 'select', options: [
        { value: 'bullets', label: 'Bullet Points' },
        { value: 'paragraph', label: 'Short Paragraph' },
        { value: 'executive', label: 'Executive Summary' },
      ]},
    ],
  },
]

// ── Get tools by portal ─────────────────────────────────────

export function getToolsForPortal(portal: 'admin' | 'staff' | 'client'): AIToolConfig[] {
  const allTools = [...ADMIN_AI_TOOLS, ...STAFF_AI_TOOLS, ...SHARED_AI_TOOLS]
  return allTools.filter(tool => tool.portal.includes(portal))
}

export function getToolById(toolId: string): AIToolConfig | undefined {
  const allTools = [...ADMIN_AI_TOOLS, ...STAFF_AI_TOOLS, ...SHARED_AI_TOOLS]
  return allTools.find(tool => tool.id === toolId)
}

export function getToolCategories(portal: 'admin' | 'staff' | 'client'): string[] {
  const tools = getToolsForPortal(portal)
  return Array.from(new Set(tools.map(t => t.category)))
}
