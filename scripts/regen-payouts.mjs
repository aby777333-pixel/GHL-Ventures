import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const APPLY = process.argv.includes('--apply')
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

const PAYOUT_DAY = 6
const r2 = n => Math.round(n * 100) / 100
const isoLocal = d => d.getFullYear() + '-' +
  String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

function addMonthsSafe(d, n, day) {
  const out = new Date(d.getFullYear(), d.getMonth(), 1)
  out.setMonth(out.getMonth() + n)
  const lastDay = new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate()
  out.setDate(Math.min(day, lastDay))
  return out
}

function effectiveStart(app) {
  const pick = v => (v ? String(v).split('T')[0] : null)
  return pick(app.final_investment_date) || pick(app.credit_given_at)
      || pick(app.investment_date) || pick(app.created_at)
}

function buildSchedule(app) {
  const startStr = effectiveStart(app)
  if (!startStr) return null
  const fv = app.fund_vehicle || ''
  const isAIF = fv.includes('AIF Direct') || fv === 'Direct AIF Route'
    || (fv.includes('AIF') && !fv.toLowerCase().includes('debenture') && !fv.toLowerCase().includes('llp'))
  const freq = isAIF ? 12 : 1
  const amount = Number(app.final_investment_amount) || Number(app.investment_amount) || 0
  if (amount <= 0) return null
  const rate = Number(app.interest_rate) || 12
  const tdsPct = Number(app.tds_rate) || 10
  const start = new Date(startStr + 'T00:00:00')
  const years = Number(String(app.tenure_preference || '').replace(/[^0-9]/g, '')) || 3
  const expMat = new Date(start); expMat.setFullYear(expMat.getFullYear() + years)
  const maturity = app.maturity_date
    ? new Date(String(app.maturity_date).split('T')[0] + 'T00:00:00') : expMat

  const gross = r2(isAIF ? amount * rate / 100 : amount * rate / 100 / 12)
  const startDay = start.getDate()
  const dim = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
  const needsProrate = !isAIF && startDay > 1
  const firstGross = needsProrate ? r2(gross * (dim - startDay + 1) / dim) : gross
  const trailGross = needsProrate ? r2(gross * (startDay - 1) / dim) : 0

  const step = from => {
    if (isAIF) { const c = new Date(from); c.setMonth(c.getMonth() + freq); return c }
    return addMonthsSafe(from, freq, PAYOUT_DAY)
  }
  const dates = []
  let cur = step(start)
  while (cur <= maturity) { dates.push(isoLocal(cur)); cur = step(cur) }
  if (!dates.length) return null
  if (needsProrate && trailGross > 0) {
    dates.push(isoLocal(step(new Date(dates[dates.length - 1] + 'T00:00:00'))))
  }
  return dates.map((due_date, i) => {
    let g = gross
    if (i === 0) g = firstGross
    else if (i === dates.length - 1 && needsProrate && trailGross > 0) g = trailGross
    const tds = r2(g * tdsPct / 100)
    return { due_date, gross_amount: g, tds_amount: tds, net_interest: r2(g - tds),
             tds_percentage: tdsPct, investment_amount: amount, investment_date: startStr }
  })
}

const { data: apps } = await sb.from('investment_applications')
  .select('*').in('status', ['approved', 'credited', 'completed'])
console.log('applications:', apps.length)

const report = []
let nIns = 0, nUpdDate = 0, nUpdAmt = 0, nDel = 0, nSkip = 0, nFlag = 0

for (const app of apps) {
  const want = buildSchedule(app)
  if (!want) { nSkip++; continue }
  const { data: have } = await sb.from('monthly_payouts')
    .select('id, due_date, gross_amount, net_interest, payment_status')
    .eq('investment_id', app.id).order('due_date')
  const rows = have || []

  if (rows.length > want.length) {
    nFlag++
    report.push([app.id, 'FLAG', 'has ' + rows.length + ' rows, schedule wants ' + want.length, '', ''])
    continue
  }

  for (let i = 0; i < want.length; i++) {
    const w = want[i]
    const h = rows[i]
    if (!h) {
      nIns++
      report.push([app.id, 'INSERT', w.due_date, w.gross_amount, ''])
      if (APPLY) {
        const { data: c } = await sb.from('clients')
          .select('client_code, full_name').eq('id', app.client_id).maybeSingle()
        const { data: b } = await sb.from('kyc_bank_details')
          .select('account_number, account_holder_name, bank_name, ifsc_code')
          .eq('client_id', app.client_id).maybeSingle()
        await sb.from('monthly_payouts').insert({
          client_id: app.client_id, investment_id: app.id,
          ghl_id: c?.client_code || '', fund_type: app.fund_vehicle || '',
          ...w, payment_status: 'pending',
          account_number: b?.account_number || null,
          account_holder_name: b?.account_holder_name || c?.full_name || null,
          bank_name: b?.bank_name || null, ifsc_code: b?.ifsc_code || null,
        })
      }
      continue
    }
    const paid = String(h.payment_status || '').toLowerCase() === 'paid'
    const patch = {}
    if (h.due_date !== w.due_date) { patch.due_date = w.due_date; nUpdDate++ }
    if (!paid && Number(h.gross_amount) !== w.gross_amount) {
      Object.assign(patch, { gross_amount: w.gross_amount, tds_amount: w.tds_amount,
        net_interest: w.net_interest, tds_percentage: w.tds_percentage,
        investment_amount: w.investment_amount, investment_date: w.investment_date })
      nUpdAmt++
    }
    if (paid && Number(h.gross_amount) !== w.gross_amount) {
      report.push([app.id, 'PAID-MISMATCH', h.due_date + ' -> ' + w.due_date,
                   'paid ' + h.gross_amount, 'schedule ' + w.gross_amount])
    }
    if (Object.keys(patch).length) {
      report.push([app.id, paid ? 'MOVE-PAID' : 'UPDATE', h.due_date + ' -> ' + w.due_date,
                   h.gross_amount, w.gross_amount])
      if (APPLY) await sb.from('monthly_payouts').update(patch).eq('id', h.id)
    }
  }
}

fs.writeFileSync('/root/payout-regen-report.csv',
  'app_id,action,detail,old,new\n' +
  report.map(r => r.map(v => '"' + String(v) + '"').join(',')).join('\n'))

console.log('\n==== ' + (APPLY ? 'APPLIED' : 'DRY RUN - nothing changed') + ' ====')
console.log('inserts        :', nIns)
console.log('date moves     :', nUpdDate)
console.log('amount updates :', nUpdAmt)
console.log('skipped apps   :', nSkip)
console.log('FLAGGED apps   :', nFlag)
console.log('report         : /root/payout-regen-report.csv')
