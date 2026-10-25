export type Part = { label: string; value: number }

export type StockInputs = {
  operatingIncomeTTM: number | null
  operatingIncomeParts: Part[]
  currentAssets: number | null
  currentLiabilities: number | null
  investmentAssets: number
  investmentParts: Part[]
  nonCurrentLiabilities: number | null
  equityParent: number | null
  netIncomeParentTTM: number | null
  epsHistory: { year: number; eps: number }[]
}

export type StockData = {
  code: string
  name: string
  market: string
  price: number | null
  report: { year: number; quarter: 1 | 2 | 3 | 4; fsDiv: 'CFS' | 'OFS' } | null
  shares: number | null
  inputs: StockInputs | null
  error: string | null
  fetchedAt: string | null
}

export type Rates = {
  bbbMinus3y: number
  aaMinus3y: number
  // null이면 조회 실패로 고정값을 쓴 것
  date: string | null
}

export type StocksFile = {
  updatedAt: string
  priceDate: string | null
  rates: Rates
  stocks: StockData[]
}
