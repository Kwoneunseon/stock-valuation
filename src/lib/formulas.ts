import type { StockInputs } from '../types'

export type Result =
  | { ok: true; value: number; warning?: string }
  | { ok: false; reason: string }

const MISSING: Result = { ok: false, reason: '재무 데이터 부족' }
const BAD_INPUT: Result = { ok: false, reason: '입력값을 확인해주세요' }
const GROWTH_CAP = 15

export function myFormula(i: StockInputs, shares: number | null): Result {
  if (i.currentAssets === null || i.currentLiabilities === null) {
    return { ok: false, reason: '금융업 · 유동/비유동 구분 없음' }
  }
  if (i.operatingIncomeTTM === null || i.nonCurrentLiabilities === null || !shares) return MISSING
  const business = i.operatingIncomeTTM * 10
  const property = i.currentAssets - i.currentLiabilities * 1.2 + i.investmentAssets
  const value = (business + property - i.nonCurrentLiabilities) / shares
  return i.operatingIncomeTTM < 0 ? { ok: true, value, warning: '영업적자 주의' } : { ok: true, value }
}

// 자기자본 + 자기자본 × (ROE − r) ÷ r 은 자기자본 × ROE ÷ r 로 정리된다
export function srim(i: StockInputs, shares: number | null, rPct: number): Result {
  if (i.equityParent === null || i.netIncomeParentTTM === null || !shares) return MISSING
  if (i.equityParent <= 0) return { ok: false, reason: '자본잠식' }
  if (!(rPct > 0)) return BAD_INPUT
  const roe = i.netIncomeParentTTM / i.equityParent
  const value = (i.equityParent * roe) / (rPct / 100) / shares
  return roe * 100 < rPct
    ? { ok: true, value, warning: 'ROE가 요구수익률보다 낮아 자기자본보다 낮게 평가돼요' }
    : { ok: true, value }
}

export function graham(eps: number | null, gPct: number | null, yPct: number): Result {
  if (eps === null) return MISSING
  if (eps <= 0) return { ok: false, reason: 'EPS 적자' }
  if (gPct === null || Number.isNaN(gPct)) return { ok: false, reason: '성장률 추정 불가 · 직접 입력해주세요' }
  const multiple = 8.5 + 2 * gPct
  if (multiple <= 0 || !(yPct > 0)) return BAD_INPUT
  return { ok: true, value: (eps * multiple * 4.4) / yPct }
}

export function epsTTM(i: StockInputs, shares: number | null): number | null {
  if (i.netIncomeParentTTM === null || !shares) return null
  return i.netIncomeParentTTM / shares
}

export function epsGrowth(history: { year: number; eps: number }[]): number | null {
  if (history.length === 0) return null
  const latest = history.reduce((a, b) => (b.year > a.year ? b : a))
  const base = history.find((h) => h.year === latest.year - 3)
  if (!base || base.eps <= 0 || latest.eps <= 0) return null
  const g = (Math.pow(latest.eps / base.eps, 1 / 3) - 1) * 100
  return Math.min(g, GROWTH_CAP)
}

export function gap(value: number, price: number): number {
  return ((value - price) / price) * 100
}
