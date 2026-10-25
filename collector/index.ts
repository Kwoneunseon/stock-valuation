import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { DartClient, reportCandidates } from './dart'
import { buildInputs } from './extract'
import { latestPrice } from './price'
import { corporateBondRates } from './rates'
import type { Rates, StockData, StocksFile } from '../src/types'

const OUT = 'public/data/stocks.json'
const FALLBACK_RATES: Rates = { bbbMinus3y: 8.0, aaMinus3y: 4.0, date: null }

function env(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`환경변수 ${name} 없음`)
  return v
}

async function readPrevious(): Promise<StocksFile | null> {
  try {
    return JSON.parse(await readFile(OUT, 'utf8')) as StocksFile
  } catch {
    return null
  }
}

async function collectStock(
  dart: DartClient,
  corps: Map<string, string>,
  priceKey: string,
  code: string,
  today: Date,
): Promise<StockData & { priceDate: string | null }> {
  const corp = corps.get(code)
  if (!corp) throw new Error('종목코드를 찾을 수 없음')

  let found = null
  for (const c of reportCandidates(today)) {
    found = await dart.reportAnyFs(corp, c.year, c.quarter)
    if (found) break
  }
  if (!found) throw new Error('최근 정기보고서 없음')
  const { report: latest, fsDiv } = found

  const a0Year = latest.quarter === 4 ? latest.year : latest.year - 1
  const annual0 = latest.quarter === 4 ? latest : (await dart.reportAnyFs(corp, a0Year, 4, fsDiv))?.report ?? null
  const annual1 = (await dart.reportAnyFs(corp, a0Year - 1, 4, fsDiv))?.report ?? null

  const shares = await dart.shareCount(corp, latest.year, latest.quarter)
  const price = await latestPrice(priceKey, code, today)

  return {
    code,
    name: price?.name ?? code,
    market: price?.market ?? '',
    price: price?.price ?? null,
    priceDate: price?.date ?? null,
    report: { year: latest.year, quarter: latest.quarter, fsDiv },
    shares,
    inputs: buildInputs(latest, annual0, annual1),
    error: price ? null : '현재가 조회 실패',
    fetchedAt: today.toISOString(),
  }
}

async function main() {
  const today = new Date()
  const watchlist = JSON.parse(await readFile('watchlist.json', 'utf8')) as string[]
  const prev = await readPrevious()
  const prevByCode = new Map(prev?.stocks.map((s) => [s.code, s]))

  const dart = new DartClient(env('DART_API_KEY'))
  const priceKey = env('DATA_GO_KR_KEY')
  const corps = await dart.corpCodes()

  let rates: Rates
  try {
    rates = await corporateBondRates(env('ECOS_API_KEY'), today)
  } catch (e) {
    console.error('금리 조회 실패:', (e as Error).message)
    rates = prev?.rates.date ? prev.rates : FALLBACK_RATES
  }

  const stocks: StockData[] = []
  const priceDates: string[] = []
  let okCount = 0
  for (const code of watchlist) {
    try {
      const { priceDate, ...s } = await collectStock(dart, corps, priceKey, code, today)
      if (priceDate) priceDates.push(priceDate)
      stocks.push(s)
      okCount++
      console.log(`${code} ${s.name} 완료`)
    } catch (e) {
      const msg = (e as Error).message
      console.error(`${code} 실패: ${msg}`)
      const old = prevByCode.get(code)
      stocks.push(
        old
          ? { ...old, error: msg }
          : { code, name: code, market: '', price: null, report: null, shares: null, inputs: null, error: msg, fetchedAt: null },
      )
    }
  }

  const out: StocksFile = {
    updatedAt: today.toISOString(),
    priceDate: priceDates.sort().at(-1) ?? prev?.priceDate ?? null,
    rates,
    stocks,
  }
  await mkdir('public/data', { recursive: true })
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`${okCount}/${watchlist.length}개 수집`)

  if (watchlist.length > 0 && okCount === 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
