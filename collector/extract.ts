import type { Part, StockInputs } from '../src/types'

// DART fnlttSinglAcntAll 응답의 한 행
export type DartRow = {
  sj_div: string
  account_id: string
  account_nm: string
  thstrm_amount?: string
  thstrm_add_amount?: string
  frmtrm_amount?: string
  frmtrm_q_amount?: string
  frmtrm_add_amount?: string
  bfefrmtrm_amount?: string
}

export type Report = { year: number; quarter: 1 | 2 | 3 | 4; rows: DartRow[] }

type Field = Exclude<keyof DartRow, 'sj_div' | 'account_id' | 'account_nm'>

export function parseAmount(s: string | undefined): number | null {
  const t = s?.replace(/,/g, '').trim()
  if (!t || t === '-') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function find(rows: DartRow[], sj: string[], ids: string[], name: RegExp): DartRow | undefined {
  const scoped = rows.filter((r) => sj.includes(r.sj_div))
  for (const id of ids) {
    const hit = scoped.find((r) => r.account_id === id)
    if (hit) return hit
  }
  return scoped.find((r) => name.test(r.account_nm.replace(/\s/g, '')))
}

const BS = ['BS']
// 포괄손익계산서 하나로 공시하는 회사가 있어 CIS도 본다
const IS = ['IS', 'CIS']

const ACCOUNTS = {
  currentAssets: { sj: BS, ids: ['ifrs-full_CurrentAssets'], name: /^유동자산/ },
  currentLiabilities: { sj: BS, ids: ['ifrs-full_CurrentLiabilities'], name: /^유동부채/ },
  nonCurrentLiabilities: { sj: BS, ids: ['ifrs-full_NoncurrentLiabilities'], name: /^비유동부채/ },
  equityParent: {
    sj: BS,
    ids: ['ifrs-full_EquityAttributableToOwnersOfParent', 'ifrs-full_Equity'],
    name: /지배기업.*지분|^자본총계/,
  },
  operatingIncome: { sj: IS, ids: ['dart_OperatingIncomeLoss'], name: /^영업이익/ },
  netIncomeParent: {
    sj: IS,
    ids: ['ifrs-full_ProfitLossAttributableToOwnersOfParent', 'ifrs-full_ProfitLoss'],
    name: /지배기업.*(소유주|지분)|^당기순이익/,
  },
  eps: { sj: IS, ids: ['ifrs-full_BasicEarningsLossPerShare'], name: /기본주당/ },
}

type AccountKey = keyof typeof ACCOUNTS

function row(rows: DartRow[], key: AccountKey) {
  const a = ACCOUNTS[key]
  return find(rows, a.sj, a.ids, a.name)
}

function amount(rows: DartRow[], key: AccountKey, field: Field = 'thstrm_amount') {
  return parseAmount(row(rows, key)?.[field])
}

// 순서가 중요하다: '관계기업투자주식'이 '금융자산'보다 먼저 걸려야 한다
const INVESTMENT_CATEGORIES: { label: string; name: RegExp }[] = [
  { label: '투자부동산', name: /투자부동산/ },
  { label: '관계·종속기업 투자', name: /관계기업|공동기업|종속기업|지분법/ },
  { label: '장기금융상품', name: /장기금융상품|장기예치금|장기예금/ },
  { label: '장기투자증권', name: /투자증권|장기투자자산|금융자산/ },
]

export function investmentParts(rows: DartRow[]): Part[] {
  const bs = rows.filter((r) => r.sj_div === 'BS')
  const start = bs.findIndex(
    (r) => r.account_id === 'ifrs-full_NoncurrentAssets' || /^비유동자산/.test(r.account_nm.replace(/\s/g, '')),
  )
  if (start < 0) return []
  const end = bs.findIndex(
    (r, i) => i > start && (r.account_id === 'ifrs-full_Assets' || /^자산총계/.test(r.account_nm.replace(/\s/g, ''))),
  )
  const section = bs.slice(start + 1, end < 0 ? undefined : end)

  const sums = new Map<string, number>()
  for (const r of section) {
    const name = r.account_nm.replace(/\s/g, '')
    const cat = INVESTMENT_CATEGORIES.find((c) => c.name.test(name))
    const v = parseAmount(r.thstrm_amount)
    if (!cat || v === null) continue
    sums.set(cat.label, (sums.get(cat.label) ?? 0) + v)
  }
  return INVESTMENT_CATEGORIES.filter((c) => sums.has(c.label)).map((c) => ({
    label: c.label,
    value: sums.get(c.label)!,
  }))
}

// 최근 4분기 합. DART는 4분기를 따로 주지 않아 작년 연간 − 작년 같은 기간 누적으로 메운다
function ttm(latest: Report, prevAnnual: Report | null, key: AccountKey): { value: number | null; parts: Part[] } {
  if (latest.quarter === 4) {
    const v = amount(latest.rows, key)
    return { value: v, parts: v === null ? [] : [{ label: `${latest.year}년 연간`, value: v }] }
  }
  const r = row(latest.rows, key)
  const cur = parseAmount(r?.thstrm_add_amount) ?? parseAmount(r?.thstrm_amount)
  const prevSame = parseAmount(r?.frmtrm_add_amount) ?? parseAmount(r?.frmtrm_q_amount)
  const prevYear = prevAnnual ? amount(prevAnnual.rows, key) : null
  if (cur === null || prevSame === null || prevYear === null) return { value: null, parts: [] }
  return {
    value: cur + prevYear - prevSame,
    parts: [
      { label: `${latest.year}년 1~${latest.quarter}분기 누적`, value: cur },
      { label: `${latest.year - 1}년 연간`, value: prevYear },
      { label: `${latest.year - 1}년 1~${latest.quarter}분기 누적`, value: -prevSame },
    ],
  }
}

// annual0 = 가장 최근 사업보고서, annual1 = 그 전 해 사업보고서
function epsHistory(annual0: Report | null, annual1: Report | null) {
  const out: { year: number; eps: number }[] = []
  const push = (year: number, v: number | null) => v !== null && out.push({ year, eps: v })
  if (annual0) {
    push(annual0.year, amount(annual0.rows, 'eps', 'thstrm_amount'))
    push(annual0.year - 1, amount(annual0.rows, 'eps', 'frmtrm_amount'))
    push(annual0.year - 2, amount(annual0.rows, 'eps', 'bfefrmtrm_amount'))
  }
  if (annual1) push(annual1.year - 2, amount(annual1.rows, 'eps', 'bfefrmtrm_amount'))
  return out
}

export function buildInputs(latest: Report, annual0: Report | null, annual1: Report | null): StockInputs {
  const prevAnnual = latest.quarter === 4 ? null : annual0
  const oi = ttm(latest, prevAnnual, 'operatingIncome')
  const ni = ttm(latest, prevAnnual, 'netIncomeParent')
  const inv = investmentParts(latest.rows)
  return {
    operatingIncomeTTM: oi.value,
    operatingIncomeParts: oi.parts,
    currentAssets: amount(latest.rows, 'currentAssets'),
    currentLiabilities: amount(latest.rows, 'currentLiabilities'),
    investmentAssets: inv.reduce((s, p) => s + p.value, 0),
    investmentParts: inv,
    nonCurrentLiabilities: amount(latest.rows, 'nonCurrentLiabilities'),
    equityParent: amount(latest.rows, 'equityParent'),
    netIncomeParentTTM: ni.value,
    epsHistory: epsHistory(annual0, annual1),
  }
}
