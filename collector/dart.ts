import { unzipSync, strFromU8 } from 'fflate'
import type { DartRow, Report } from './extract'

const BASE = 'https://opendart.fss.or.kr/api'
const NO_DATA = '013'

const REPRT_CODE = { 1: '11013', 2: '11012', 3: '11014', 4: '11011' } as const

export type FsDiv = 'CFS' | 'OFS'

export class DartClient {
  constructor(private key: string) {}

  private async json(path: string, params: Record<string, string>) {
    const qs = new URLSearchParams({ crtfc_key: this.key, ...params })
    const res = await fetch(`${BASE}/${path}?${qs}`)
    if (!res.ok) throw new Error(`DART ${path} HTTP ${res.status}`)
    const body = (await res.json()) as { status: string; message: string; list?: unknown[] }
    if (body.status === NO_DATA) return null
    if (body.status !== '000') throw new Error(`DART ${path} ${body.status} ${body.message}`)
    return body.list ?? []
  }

  // 종목코드(6자리) → DART 고유번호(8자리)와 회사명
  async corpCodes(): Promise<Map<string, { corp: string; name: string }>> {
    const res = await fetch(`${BASE}/corpCode.xml?crtfc_key=${this.key}`)
    if (!res.ok) throw new Error(`DART corpCode HTTP ${res.status}`)
    const files = unzipSync(new Uint8Array(await res.arrayBuffer()))
    const xml = strFromU8(Object.values(files)[0])
    const map = new Map<string, { corp: string; name: string }>()
    for (const [block] of xml.matchAll(/<list>[\s\S]*?<\/list>/g)) {
      const corp = block.match(/<corp_code>(\d+)<\/corp_code>/)?.[1]
      const name = block.match(/<corp_name>([^<]*)<\/corp_name>/)?.[1].trim()
      const stock = block.match(/<stock_code>\s*(\d{6})\s*<\/stock_code>/)?.[1]
      if (corp && stock) map.set(stock, { corp, name: name || stock })
    }
    return map
  }

  async report(corp: string, year: number, quarter: 1 | 2 | 3 | 4, fsDiv: FsDiv): Promise<Report | null> {
    const list = await this.json('fnlttSinglAcntAll.json', {
      corp_code: corp,
      bsns_year: String(year),
      reprt_code: REPRT_CODE[quarter],
      fs_div: fsDiv,
    })
    return list && list.length > 0 ? { year, quarter, rows: list as DartRow[] } : null
  }

  // 연결 우선, 없으면 별도
  async reportAnyFs(corp: string, year: number, quarter: 1 | 2 | 3 | 4, prefer: FsDiv = 'CFS') {
    const other: FsDiv = prefer === 'CFS' ? 'OFS' : 'CFS'
    for (const fs of [prefer, other]) {
      const r = await this.report(corp, year, quarter, fs)
      if (r) return { report: r, fsDiv: fs }
    }
    return null
  }

  async shareCount(corp: string, year: number, quarter: 1 | 2 | 3 | 4): Promise<number | null> {
    const list = (await this.json('stockTotqySttus.json', {
      corp_code: corp,
      bsns_year: String(year),
      reprt_code: REPRT_CODE[quarter],
    })) as { se: string; istc_totqy: string }[] | null
    if (!list) return null
    const row = list.find((r) => r.se === '합계') ?? list.find((r) => r.se === '보통주')
    const n = Number(row?.istc_totqy.replace(/,/g, ''))
    return Number.isFinite(n) && n > 0 ? n : null
  }
}

// 최신 보고서부터 거꾸로. 12월 결산 기준
export function reportCandidates(today: Date): { year: number; quarter: 1 | 2 | 3 | 4 }[] {
  const y = today.getFullYear()
  return [
    { year: y, quarter: 3 },
    { year: y, quarter: 2 },
    { year: y, quarter: 1 },
    { year: y - 1, quarter: 4 },
    { year: y - 1, quarter: 3 },
  ]
}
