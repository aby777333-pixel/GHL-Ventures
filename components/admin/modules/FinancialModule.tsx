'use client'

import { useState, useMemo } from 'react'
import {
  IndianRupee, TrendingUp, TrendingDown, Receipt, CreditCard,
  FileText, PieChart, ArrowUpRight, ArrowDownRight, Eye,
  CheckCircle2, Clock, AlertCircle, Calendar, Download,
  BarChart3, Wallet, Banknote, CircleDollarSign, Building, Upload,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import { INVOICES_DATA, EXPENSES_DATA, REVENUE_BREAKDOWN, OVERVIEW_KPIS, COMMISSIONS_DATA } from '@/lib/admin/adminMockData'
import { formatINR, formatDate } from '@/lib/admin/adminHooks'
import type { Invoice, Expense, InvoiceStatus, ExpenseCategory } from '@/lib/admin/adminTypes'
import { saveBlobAs, uploadFile } from '@/lib/supabase/storageService'

// ── Sub-tabs ─────────────────────────────────────────────────────
const FINANCIAL_TABS = [
  { id: 'overview', label: 'Revenue Overview', icon: BarChart3 },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'expenses', label: 'Expenses', icon: CreditCard },
  { id: 'payouts', label: 'Payouts', icon: Banknote },
] as const

type FinancialTab = typeof FINANCIAL_TABS[number]['id']

interface FinancialModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function FinancialModule({ subTab, navigate, showToast }: FinancialModuleProps) {
  const activeTab = (FINANCIAL_TABS.some(t => t.id === subTab) ? subTab : 'overview') as FinancialTab

  // ── KPIs ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalInvoiced = INVOICES_DATA.reduce((s, inv) => s + inv.total, 0)
    const collected = INVOICES_DATA.filter(i => i.status === 'paid').reduce((s, inv) => s + inv.total, 0)
    const overdue = INVOICES_DATA.filter(i => i.status === 'overdue').reduce((s, inv) => s + inv.total, 0)
    const totalExpenses = EXPENSES_DATA.reduce((s, e) => s + e.amount, 0)
    const pendingPayouts = COMMISSIONS_DATA.filter(c => c.status === 'pending' || c.status === 'approved').reduce((s, c) => s + c.commissionAmount, 0)
    return {
      monthlyRevenue: OVERVIEW_KPIS.monthlyRevenue,
      totalInvoiced,
      collected,
      overdue,
      totalExpenses,
      pendingPayouts,
      netIncome: OVERVIEW_KPIS.monthlyRevenue - totalExpenses,
    }
  }, [])

  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'overview' ? 'financial' : `financial/${tabId}`)
  }

  return (
    <div className="space-y-6 admin-section-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Controls</h1>
          <p className="text-sm text-gray-500 mt-1">Revenue, invoices, expenses, and payout management</p>
        </div>
        <button
          onClick={async () => {
            showToast('Generating financial report...', 'info')
            const rows = ['Type,Client,Amount,GST,Total,Status,Date']
            INVOICES_DATA.forEach(inv => rows.push(`${inv.type},${inv.clientName},${inv.amount},${inv.gst},${inv.total},${inv.status},${inv.date}`))
            const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
            await saveBlobAs(blob, `GHL_Financial_Report_${new Date().toISOString().slice(0,10)}.csv`, showToast as any)
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors self-start admin-btn-press"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Monthly Revenue" value={formatINR(kpis.monthlyRevenue)} trend="up" trendValue="+15.7%" icon={IndianRupee} color="#10B981" delay={0} />
        <AdminKPICard title="Total Invoiced" value={formatINR(kpis.totalInvoiced)} icon={Receipt} color="#3B82F6" delay={50} />
        <AdminKPICard title="Overdue Amount" value={formatINR(kpis.overdue)} icon={AlertCircle} color="#EF4444" delay={100} />
        <AdminKPICard title="Net Income" value={formatINR(kpis.netIncome)} trend={kpis.netIncome > 0 ? 'up' : 'down'} trendValue={kpis.netIncome > 0 ? 'Profitable' : 'Loss'} icon={TrendingUp} color="#8B5CF6" delay={150} />
      </div>

      {/* Sub-tab Nav */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {FINANCIAL_TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                isActive ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="admin-tab-switch">
        {activeTab === 'overview' && <RevenueOverviewTab kpis={kpis} />}
        {activeTab === 'invoices' && <InvoicesTab showToast={showToast} />}
        {activeTab === 'expenses' && <ExpensesTab showToast={showToast} />}
        {activeTab === 'payouts' && <PayoutsTab showToast={showToast} />}
      </div>
    </div>
  )
}

// ── Revenue Overview Tab ────────────────────────────────────────
function RevenueOverviewTab({ kpis }: { kpis: { monthlyRevenue: number; totalInvoiced: number; collected: number; overdue: number; totalExpenses: number; netIncome: number; pendingPayouts: number } }) {
  const CATEGORY_COLORS = ['#DC2626', '#3B82F6', '#10B981', '#8B5CF6']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Revenue Breakdown Chart */}
      <AdminGlass className="lg:col-span-2">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-red" />
          Revenue Breakdown (Last 6 Months)
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={REVENUE_BREAKDOWN} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}L`} />
              <Tooltip
                contentStyle={{ background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                labelStyle={{ color: '#fff', marginBottom: '4px' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: any, name: any) => [`₹${value}L`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]) as any}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value: string) => <span className="text-gray-400 capitalize">{value}</span>}
              />
              <Bar dataKey="management" fill="#DC2626" radius={[4, 4, 0, 0]} name="Management Fees" />
              <Bar dataKey="performance" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Performance Fees" />
              <Bar dataKey="placement" fill="#10B981" radius={[4, 4, 0, 0]} name="Placement Fees" />
              <Bar dataKey="advisory" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Advisory Fees" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AdminGlass>

      {/* Cash Flow Summary */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-brand-red" />
          Cash Flow Summary
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Revenue (This Month)', value: kpis.monthlyRevenue, color: 'text-emerald-400', icon: ArrowUpRight },
            { label: 'Invoiced (Outstanding)', value: kpis.totalInvoiced - kpis.collected, color: 'text-blue-400', icon: Receipt },
            { label: 'Overdue Payments', value: kpis.overdue, color: 'text-red-400', icon: AlertCircle },
            { label: 'Total Expenses', value: kpis.totalExpenses, color: 'text-amber-400', icon: ArrowDownRight },
            { label: 'Pending Payouts', value: kpis.pendingPayouts, color: 'text-purple-400', icon: Banknote },
          ].map(item => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs text-gray-400">{item.label}</span>
                </div>
                <span className={`text-sm font-semibold ${item.color}`}>{formatINR(item.value)}</span>
              </div>
            )
          })}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Net Income</span>
            <span className={`text-lg font-bold ${kpis.netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatINR(kpis.netIncome)}
            </span>
          </div>
        </div>
      </AdminGlass>

      {/* Expense Category Breakdown */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-brand-red" />
          Expense Categories
        </h3>
        {(() => {
          const categories: Record<string, number> = {}
          EXPENSES_DATA.forEach(e => { categories[e.category] = (categories[e.category] || 0) + e.amount })
          const total = Object.values(categories).reduce((s, v) => s + v, 0)
          const colors: Record<string, string> = {
            technology: '#3B82F6', legal: '#8B5CF6', marketing: '#DC2626',
            operations: '#10B981', hr: '#F59E0B', travel: '#EC4899',
          }
          return (
            <div className="space-y-3">
              {Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                const pct = total > 0 ? Math.round((amount / total) * 100) : 0
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400 capitalize">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{formatINR(amount)}</span>
                        <span className="text-gray-600">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, backgroundColor: colors[cat] || '#6B7280' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </AdminGlass>
    </div>
  )
}

// ── Invoices Tab ────────────────────────────────────────────────
function InvoicesTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return INVOICES_DATA
    return INVOICES_DATA.filter(i => i.status === statusFilter)
  }, [statusFilter])

  const getInvoiceVariant = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return 'success' as const
      case 'sent': return 'info' as const
      case 'overdue': return 'error' as const
      case 'draft': return 'neutral' as const
    }
  }

  const columns: Column<Invoice>[] = [
    {
      key: 'id',
      label: 'Invoice',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.id}</p>
          <p className="text-[11px] text-gray-500">{row.type}</p>
        </div>
      ),
    },
    { key: 'clientName', label: 'Client', render: (row) => <span className="text-white">{row.clientName}</span> },
    { key: 'amount', label: 'Amount', render: (row) => <span className="text-gray-300">{formatINR(row.amount)}</span> },
    { key: 'gst', label: 'GST (18%)', render: (row) => <span className="text-gray-400 text-xs">{formatINR(row.gst)}</span> },
    { key: 'total', label: 'Total', render: (row) => <span className="text-white font-semibold">{formatINR(row.total)}</span> },
    { key: 'date', label: 'Date', render: (row) => <span className="text-xs text-gray-400">{formatDate(row.date)}</span> },
    { key: 'dueDate', label: 'Due', render: (row) => <span className="text-xs text-gray-400">{formatDate(row.dueDate)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <AdminBadge label={row.status} variant={getInvoiceVariant(row.status)} dot />,
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: '50px',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedInvoice(row) }}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ]

  const filters: { id: InvoiceStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'sent', label: 'Sent' },
    { id: 'paid', label: 'Paid' },
    { id: 'overdue', label: 'Overdue' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === f.id
                ? 'bg-brand-red/20 text-white border-brand-red/30'
                : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AdminGlass padding="p-4">
        <AdminDataTable<Invoice>
          columns={columns}
          data={filtered}
          searchKeys={['id', 'clientName', 'type']}
          searchPlaceholder="Search invoices..."
          onRowClick={(row) => setSelectedInvoice(row)}
          exportable
          title="Invoices"
        />
      </AdminGlass>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <AdminModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={selectedInvoice.id}
          subtitle={`${selectedInvoice.type} — ${selectedInvoice.clientName}`}
          footer={
            <>
              <ModalButton onClick={() => setSelectedInvoice(null)}>Close</ModalButton>
              <ModalButton variant="primary" onClick={async () => {
                showToast('Generating invoice PDF...', 'info')
                const inv = selectedInvoice
                const content = `INVOICE: ${inv.id}\nClient: ${inv.clientName}\nType: ${inv.type}\nAmount: ${inv.amount}\nGST: ${inv.gst}\nTotal: ${inv.total}\nStatus: ${inv.status}\nDate: ${inv.date}\nDue Date: ${inv.dueDate}`
                const blob = new Blob([content], { type: 'application/pdf' })
                await saveBlobAs(blob, `Invoice_${inv.id}.pdf`, showToast as any)
                setSelectedInvoice(null)
              }}>Download PDF</ModalButton>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Amount', value: formatINR(selectedInvoice.amount) },
                { label: 'GST (18%)', value: formatINR(selectedInvoice.gst) },
                { label: 'Total', value: formatINR(selectedInvoice.total) },
                { label: 'Status', value: selectedInvoice.status },
                { label: 'Issue Date', value: formatDate(selectedInvoice.date) },
                { label: 'Due Date', value: formatDate(selectedInvoice.dueDate) },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-white mt-1 capitalize">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  )
}

// ── Expenses Tab ────────────────────────────────────────────────
function ExpensesTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: 'operations' as ExpenseCategory,
    amount: '',
    date: '',
    vendor: '',
    paymentMethod: 'bank-transfer',
    status: 'pending',
    notes: '',
  })

  const handleExpenseSubmit = () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.date) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    showToast('Expense recorded successfully', 'success')
    setAddExpenseOpen(false)
    setExpenseForm({
      description: '',
      category: 'operations',
      amount: '',
      date: '',
      vendor: '',
      paymentMethod: 'bank-transfer',
      status: 'pending',
      notes: '',
    })
  }

  const getExpenseVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success' as const
      case 'approved': return 'info' as const
      case 'pending': return 'warning' as const
      case 'rejected': return 'error' as const
      default: return 'neutral' as const
    }
  }

  const columns: Column<Expense>[] = [
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.description}</p>
          <p className="text-[11px] text-gray-500">{row.id}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => <AdminBadge label={row.category} variant="purple" />,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => <span className="text-white font-semibold">{formatINR(row.amount)}</span>,
    },
    { key: 'submittedBy', label: 'Submitted By', render: (row) => <span className="text-xs text-gray-400">{row.submittedBy}</span> },
    { key: 'date', label: 'Date', render: (row) => <span className="text-xs text-gray-400">{formatDate(row.date)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <AdminBadge label={row.status} variant={getExpenseVariant(row.status)} dot />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.status === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); showToast(`Expense ${row.id} approved`, 'success') }}
                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 transition-colors"
                title="Approve"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); showToast(`Expense ${row.id} rejected`, 'error') }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                title="Reject"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); showToast('Opening receipt viewer...', 'info') }}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
            title="View Receipt"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <AdminGlass padding="p-4">
        <AdminDataTable<Expense>
          columns={columns}
          data={EXPENSES_DATA}
          searchKeys={['description', 'category', 'submittedBy']}
          searchPlaceholder="Search expenses..."
          exportable
          title="Expense Tracker"
          actions={
            <button
              onClick={() => setAddExpenseOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-brand-red/20 border border-brand-red/30 rounded-lg hover:bg-brand-red/30 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Add Expense
            </button>
          }
        />
      </AdminGlass>

      {/* Add Expense Modal */}
      <AdminModal
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        title="Add New Expense"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Row 1: Description (full width) */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description *</label>
            <input
              type="text"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(f => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Office furniture purchase"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
            />
          </div>

          {/* Row 2: Category + Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Category *</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              >
                <option value="operations">Office Supplies</option>
                <option value="travel">Travel</option>
                <option value="technology">Software &amp; Licenses</option>
                <option value="legal">Professional Services</option>
                <option value="marketing">Marketing &amp; Advertising</option>
                <option value="hr">Utilities</option>
                <option value="operations">Rent</option>
                <option value="legal">Insurance</option>
                <option value="hr">Training &amp; Development</option>
                <option value="operations">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Amount (INR) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Date + Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Date *</label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Vendor / Paid To</label>
              <input
                type="text"
                value={expenseForm.vendor}
                onChange={(e) => setExpenseForm(f => ({ ...f, vendor: e.target.value }))}
                placeholder="e.g. Amazon, Swiggy"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
          </div>

          {/* Row 4: Payment Method + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Payment Method</label>
              <select
                value={expenseForm.paymentMethod}
                onChange={(e) => setExpenseForm(f => ({ ...f, paymentMethod: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              >
                <option value="bank-transfer">Bank Transfer</option>
                <option value="credit-card">Credit Card</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
              <select
                value={expenseForm.status}
                onChange={(e) => setExpenseForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="reimbursed">Reimbursed</option>
              </select>
            </div>
          </div>

          {/* Row 5: Notes (full width) */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Additional details about this expense..."
              rows={3}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-none"
            />
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Receipt</label>
            <button
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.pdf,.jpg,.jpeg,.png,.gif'
                input.onchange = async () => {
                  if (input.files?.[0]) {
                    showToast('Uploading receipt...', 'info')
                    const result = await uploadFile(input.files[0], 'admin/expenses')
                    if (result.success) showToast('Receipt uploaded', 'success')
                    else showToast('Upload failed', 'error')
                  }
                }
                input.click()
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
            >
              <Upload className="w-4 h-4" />
              Attach Receipt
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => setAddExpenseOpen(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExpenseSubmit}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-brand-red hover:bg-red-600 transition-colors"
          >
            Add Expense
          </button>
        </div>
      </AdminModal>
    </>
  )
}

// ── Payouts Tab ─────────────────────────────────────────────────
function PayoutsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const payouts = useMemo(() => {
    return COMMISSIONS_DATA.map(c => ({
      ...c,
      payoutType: 'Commission' as const,
    }))
  }, [])

  const totalPending = payouts.filter(p => p.status === 'pending' || p.status === 'approved').reduce((s, p) => s + p.commissionAmount, 0)
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.commissionAmount, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Pending Payouts</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{formatINR(totalPending)}</p>
          <p className="text-[11px] text-gray-500 mt-1">{payouts.filter(p => p.status !== 'paid').length} pending transactions</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Total Disbursed</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatINR(totalPaid)}</p>
          <p className="text-[11px] text-gray-500 mt-1">{payouts.filter(p => p.status === 'paid').length} completed</p>
        </AdminGlass>
      </div>

      <AdminGlass padding="p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Payout Queue</h3>
        <div className="space-y-2">
          {payouts.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-red/30 to-purple-500/30 flex items-center justify-center text-[10px] font-bold text-white">
                  {p.salesRep.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{p.salesRep}</p>
                  <p className="text-[11px] text-gray-500">{p.clientName} • {p.period}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">{formatINR(p.commissionAmount)}</span>
                <AdminBadge
                  label={p.status}
                  variant={p.status === 'paid' ? 'success' : p.status === 'approved' ? 'info' : 'warning'}
                  dot
                />
                {p.status === 'approved' && (
                  <button
                    onClick={() => showToast(`Payout of ${formatINR(p.commissionAmount)} processed for ${p.salesRep}`, 'success')}
                    className="px-3 py-1 rounded-lg text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                  >
                    Process
                  </button>
                )}
              </div>
            </div>
          ))}
          {payouts.length === 0 && (
            <AdminEmptyState title="No payouts" description="Payouts will appear here when commissions are approved." />
          )}
        </div>
      </AdminGlass>
    </div>
  )
}
