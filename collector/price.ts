const URL_ = 'https://apis.data.go.kr/1160100/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2'

type Item = { basDt: string; srtnCd: string; itmsNm: string; mrktCtg: string; clpr: string }

export type Price = { date: string; price: number; name: string; market: string }

const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

// 해외(GitHub 러너)에서 접속이 간헐적으로 끊겨 3번까지 다시 시도한다
async function fetchWithRetry(url: string, tries = 3): Promise<Response> {
  let last: unknown
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url, { signal: AbortSignal.timeout(20_000) })
    } catch (e) {
      last = e
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)))
    }
  }
  const err = last as Error & { cause?: { code?: string; message?: string } }
  throw new Error(`시세 API 접속 실패: ${err.cause?.code ?? err.cause?.message ?? err.message}`)
}

// 이 API는 하루 늦게 갱신되므로 최근 2주에서 가장 최근 날짜를 고른다
export async function latestPrice(key: string, code: string, today: Date): Promise<Price | null> {
  const from = new Date(today.getTime() - 14 * 86400_000)
  const qs = new URLSearchParams({
    resultType: 'json',
    numOfRows: '30',
    likeSrtnCd: code,
    beginBasDt: ymd(from),
  })
  // 이미 인코딩된 키(Encoding 키)를 다시 인코딩하면 '등록되지 않은 서비스키'가 된다
  const serviceKey = key.includes('%') ? key : encodeURIComponent(key)
  const res = await fetchWithRetry(`${URL_}?serviceKey=${serviceKey}&${qs}`)
  if (!res.ok) {
    const reason = (await res.text()).match(/"errMsg"\s*:\s*"([^"]+)"|<errMsg>([^<]+)/)
    throw new Error(`시세 API HTTP ${res.status}${reason ? ` ${reason[1] ?? reason[2]}` : ''}`)
  }
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
