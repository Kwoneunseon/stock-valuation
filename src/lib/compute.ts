import { epsGrowth, epsTTM, graham, myFormula, srim, type Result } from './formulas'
import type { Overrides } from './overrides'
import type { Rates, StockData } from '../types'

export type Computed = { mine: Result; srim: Result; graham: Result; r: number; g: number | null; y: number; eps: number | null }

const num = (s: string | undefined) => (s === undefined || s.trim() === '' ? undefined : Number(s))

export function compute(s: StockData, rates: Rates, o: Overrides = {}): Computed {
  if (!s.inputs) {
    const fail: Result = { ok: false, reason: s.error ?? '재무 데이터 부족' }
    return { mine: fail, srim: fail, graham: fail, r: rates.bbbMinus3y, g: null, y: rates.aaMinus3y, eps: null }
  }
  const r = num(o.r) ?? rates.bbbMinus3y
  const y = num(o.y) ?? rates.aaMinus3y
  const g = o.g !== undefined && o.g.trim() !== '' ? Number(o.g) : epsGrowth(s.inputs.epsHistory)
  const eps = epsTTM(s.inputs, s.shares)
  return {
    mine: myFormula(s.inputs, s.shares),
    srim: srim(s.inputs, s.shares, r),
    graham: graham(eps, g, y),
    r,
    g,
    y,
    eps,
  }
}
