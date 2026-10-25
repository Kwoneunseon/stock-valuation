import type { StockData } from '../types'

export const won = (n: number) => Math.round(n).toLocaleString('ko-KR')
export const eok = (n: number) => Math.round(n / 1e8).toLocaleString('ko-KR')

export function reportLabel(r: NonNullable<StockData['report']>) {
  const kind = r.quarter === 4 ? '사업보고서' : r.quarter === 2 ? '반기 보고서' : `${r.quarter}분기 보고서`
  return `${r.year}년 ${kind} (${r.fsDiv === 'CFS' ? '연결' : '별도'})`
}

export function staleNote(s: StockData, now = Date.now()): string | null {
  if (!s.error) return null
  if (!s.fetchedAt) return s.error
  const days = Math.floor((now - new Date(s.fetchedAt).getTime()) / 86400_000)
  return `최근 갱신 실패 · ${days}일 전 데이터 (${s.error})`
}
