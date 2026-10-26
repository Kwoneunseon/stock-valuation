const URL_ = 'https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2'

type Item = { basDt: string; srtnCd: string; itmsNm: string; mrktCtg: string; clpr: string }

export type Price = { date: string; price: number; name: string; market: string }

const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

// 이 API는 하루 늦게 갱신되므로 최근 2주에서 가장 최근 날짜를 고른다
export async function latestPrice(key: string, code: string, today: Date): Promise<Price | null> {
  const from = new Date(today.getTime() - 14 * 86400_000)
  const qs = new URLSearchParams({
    serviceKey: key,
    resultType: 'json',
    numOfRows: '30',
    likeSrtnCd: code,
    beginBasDt: ymd(from),
  })
  const res = await fetch(`${URL_}?${qs}`)
  if (!res.ok) throw new Error(`시세 API HTTP ${res.status}`)
  const body = (await res.json()) as { response?: { body?: { items?: { item?: Item[] | Item } } } }
  const raw = body.response?.body?.items?.item ?? []
  const items = (Array.isArray(raw) ? raw : [raw]).filter((i) => i.srtnCd === code)
  if (items.length === 0) return null
  const top = items.reduce((a, b) => (b.basDt > a.basDt ? b : a))
  const d = top.basDt
  return {
    date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
    price: Number(top.clpr),
    name: top.itmsNm,
    market: top.mrktCtg,
  }
}
