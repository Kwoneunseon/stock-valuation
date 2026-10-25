import { describe, expect, it } from 'vitest'
import { buildInputs, investmentParts, parseAmount, type DartRow, type Report } from '../extract'

// DART fnlttSinglAcntAll 응답 형태를 본뜬 손으로 만든 예시
const bs = (account_id: string, account_nm: string, thstrm_amount: string): DartRow => ({
  sj_div: 'BS',
  account_id,
  account_nm,
  thstrm_amount,
})

const balanceSheet: DartRow[] = [
  bs('ifrs-full_CurrentAssets', '유동자산', '380'),
  bs('-표준계정코드 미사용-', '기타금융자산', '999'),
  bs('ifrs-full_NoncurrentAssets', '비유동자산', '900'),
  bs('dart_LongTermDepositsNotClassifiedAsCashEquivalents', '장기금융상품', '31'),
  bs('-표준계정코드 미사용-', '기타포괄손익-공정가치 측정 금융자산', '30'),
  bs('ifrs-full_OtherNoncurrentFinancialAssets', '기타비유동금융자산', '12'),
  bs('ifrs-full_InvestmentsInAssociates', '관계기업투자주식', '48'),
  bs('ifrs-full_InvestmentProperty', '투자부동산', '7'),
  bs('ifrs-full_PropertyPlantAndEquipment', '유형자산', '500'),
  bs('ifrs-full_Assets', '자산총계', '1280'),
  bs('ifrs-full_CurrentLiabilities', '유동부채', '150'),
  bs('ifrs-full_NoncurrentLiabilities', '비유동부채', '25'),
  bs('ifrs-full_EquityAttributableToOwnersOfParent', '지배기업 소유주지분', '553'),
]

const is = (account_id: string, account_nm: string, amounts: Partial<DartRow>): DartRow => ({
  sj_div: 'IS',
  account_id,
  account_nm,
  ...amounts,
})

describe('parseAmount', () => {
  it('쉼표와 빈 값 처리', () => {
    expect(parseAmount('1,234')).toBe(1234)
    expect(parseAmount('-50')).toBe(-50)
    expect(parseAmount('')).toBeNull()
    expect(parseAmount(undefined)).toBeNull()
  })
})

describe('investmentParts', () => {
  it('비유동자산 구간의 투자성 항목만 합산', () => {
    expect(investmentParts(balanceSheet)).toEqual([
      { label: '투자부동산', value: 7 },
      { label: '관계·종속기업 투자', value: 48 },
      { label: '장기금융상품', value: 31 },
      { label: '장기투자증권', value: 42 },
    ])
  })
})

describe('buildInputs', () => {
  const annual2025: Report = {
    year: 2025,
    quarter: 4,
    rows: [
      ...balanceSheet,
      is('dart_OperatingIncomeLoss', '영업이익', { thstrm_amount: '41500' }),
      is('ifrs-full_ProfitLossAttributableToOwnersOfParent', '지배기업의 소유주에게 귀속되는 당기순이익', {
        thstrm_amount: '5000',
      }),
      is('ifrs-full_BasicEarningsLossPerShare', '기본주당이익', {
        thstrm_amount: '1331',
        frmtrm_amount: '1210',
        bfefrmtrm_amount: '1100',
      }),
    ],
  }
  const annual2024: Report = {
    year: 2024,
    quarter: 4,
    rows: [is('ifrs-full_BasicEarningsLossPerShare', '기본주당이익', { bfefrmtrm_amount: '1000' })],
  }

  it('3분기 보고서면 TTM = 올해 누적 + 작년 연간 − 작년 같은 기간 누적', () => {
    const q3: Report = {
      year: 2026,
      quarter: 3,
      rows: [
        ...balanceSheet,
        is('dart_OperatingIncomeLoss', '영업이익', {
          thstrm_amount: '11000',
          thstrm_add_amount: '32000',
          frmtrm_add_amount: '31500',
        }),
      ],
    }
    const i = buildInputs(q3, annual2025, annual2024)
    expect(i.operatingIncomeTTM).toBe(42000)
    expect(i.operatingIncomeParts.map((p) => p.value)).toEqual([32000, 41500, -31500])
    expect(i.currentAssets).toBe(380)
    expect(i.investmentAssets).toBe(128)
    expect(i.equityParent).toBe(553)
  })

  it('1분기 보고서는 누적 칸이 비어도 당기·전기 분기 값으로 계산', () => {
    const q1: Report = {
      year: 2026,
      quarter: 1,
      rows: [is('dart_OperatingIncomeLoss', '영업이익', { thstrm_amount: '10000', frmtrm_q_amount: '9500' })],
    }
    expect(buildInputs(q1, annual2025, annual2024).operatingIncomeTTM).toBe(42000)
  })

  it('작년 사업보고서가 없으면 TTM은 null', () => {
    const q2: Report = {
      year: 2026,
      quarter: 2,
      rows: [is('dart_OperatingIncomeLoss', '영업이익', { thstrm_add_amount: '20000', frmtrm_add_amount: '19000' })],
    }
    expect(buildInputs(q2, null, null).operatingIncomeTTM).toBeNull()
  })

  it('사업보고서가 최신이면 연간 값 그대로, EPS 4년치 수집', () => {
    const i = buildInputs(annual2025, annual2025, annual2024)
    expect(i.operatingIncomeTTM).toBe(41500)
    expect(i.netIncomeParentTTM).toBe(5000)
    expect(i.epsHistory).toEqual([
      { year: 2025, eps: 1331 },
      { year: 2024, eps: 1210 },
      { year: 2023, eps: 1100 },
      { year: 2022, eps: 1000 },
    ])
  })

  it('유동 구분이 없는 금융업은 유동자산이 null', () => {
    const bank: Report = { year: 2025, quarter: 4, rows: [bs('ifrs-full_Assets', '자산총계', '100')] }
    expect(buildInputs(bank, null, null).currentAssets).toBeNull()
  })
})
