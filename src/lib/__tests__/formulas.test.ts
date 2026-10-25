import { describe, expect, it } from 'vitest'
import { epsGrowth, gap, graham, myFormula, srim } from '../formulas'
import type { StockInputs } from '../../types'

const EOK = 1e8

const inputs: StockInputs = {
  operatingIncomeTTM: 42_000 * EOK,
  operatingIncomeParts: [],
  currentAssets: 380_000 * EOK,
  currentLiabilities: 150_000 * EOK,
  investmentAssets: 128_000 * EOK,
  investmentParts: [],
  nonCurrentLiabilities: 25_000 * EOK,
  equityParent: 553_350 * EOK,
  netIncomeParentTTM: 55_335 * EOK,
  epsHistory: [],
}
const shares = 1_000_000_000

describe('myFormula', () => {
  it('목업 숫자로 72,300원', () => {
    const r = myFormula(inputs, shares)
    expect(r.ok && r.value).toBeCloseTo(72_300, 6)
  })

  it('영업적자면 계산하되 경고', () => {
    const r = myFormula({ ...inputs, operatingIncomeTTM: -1 * EOK }, shares)
    expect(r.ok && r.warning).toBe('영업적자 주의')
  })

  it('유동 구분이 없으면 금융업으로 계산 불가', () => {
    const r = myFormula({ ...inputs, currentAssets: null }, shares)
    expect(!r.ok && r.reason).toContain('금융업')
  })

  it('주식수가 없으면 계산 불가', () => {
    expect(myFormula(inputs, null).ok).toBe(false)
  })
})

describe('srim', () => {
  it('요구수익률 8.5%면 65,100원', () => {
    const r = srim(inputs, shares, 8.5)
    expect(r.ok && r.value).toBeCloseTo(65_100, 6)
  })

  it('ROE가 요구수익률보다 낮으면 안내', () => {
    const r = srim(inputs, shares, 12)
    expect(r.ok && r.warning).toContain('ROE')
  })

  it('자본잠식이면 계산 불가', () => {
    const r = srim({ ...inputs, equityParent: 0 }, shares, 8.5)
    expect(!r.ok && r.reason).toContain('자본잠식')
  })

  it('요구수익률 0이면 입력값 확인', () => {
    const r = srim(inputs, shares, 0)
    expect(!r.ok && r.reason).toBe('입력값을 확인해주세요')
  })
})

describe('graham', () => {
  it('EPS 3,037 · g 5 · Y 4.0이면 61,803원', () => {
    const r = graham(3037, 5, 4)
    expect(r.ok && Math.round(r.value)).toBe(61_803)
  })

  it('EPS 적자면 계산 불가', () => {
    expect(graham(0, 5, 4)).toEqual({ ok: false, reason: 'EPS 적자' })
  })

  it('성장률이 없으면 직접 입력 안내', () => {
    const r = graham(3037, null, 4)
    expect(!r.ok && r.reason).toContain('직접 입력')
  })

  it('금리 0이나 8.5+2g ≤ 0이면 입력값 확인', () => {
    expect(graham(3037, 5, 0).ok).toBe(false)
    expect(graham(3037, -5, 4).ok).toBe(false)
  })
})

describe('epsGrowth', () => {
  it('3년 연평균 성장률', () => {
    const g = epsGrowth([
      { year: 2025, eps: 1331 },
      { year: 2022, eps: 1000 },
      { year: 2023, eps: 1100 },
    ])
    expect(g).toBeCloseTo(10, 1)
  })

  it('상한 15%', () => {
    expect(epsGrowth([{ year: 2025, eps: 3000 }, { year: 2022, eps: 1000 }])).toBe(15)
  })

  it('적자가 끼면 null', () => {
    expect(epsGrowth([{ year: 2025, eps: 1000 }, { year: 2022, eps: -10 }])).toBeNull()
  })

  it('3년 전 데이터가 없으면 null', () => {
    expect(epsGrowth([{ year: 2025, eps: 1000 }, { year: 2023, eps: 900 }])).toBeNull()
  })
})

describe('gap', () => {
  it('적정가가 높으면 양수', () => {
    expect(gap(72_300, 58_000)).toBeCloseTo(24.66, 2)
  })
})
