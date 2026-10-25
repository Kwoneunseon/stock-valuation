const BASE = 'https://ecos.bok.or.kr/api'
// 시장금리(일별)
const TABLE = '817Y002'

type ItemRow = { ITEM_CODE: string; ITEM_NAME: string }
type DataRow = { TIME: string; DATA_VALUE: string }

const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')

async function rows<T>(url: string, root: string): Promise<T[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ECOS HTTP ${res.status}`)
  const body = (await res.json()) as Record<string, { row?: T[] } | undefined>
  return body[root]?.row ?? []
}

// 항목 코드를 외워두지 않고 이름으로 찾는다
export async function corporateBondRates(key: string, today: Date) {
  const items = await rows<ItemRow>(`${BASE}/StatisticItemList/${key}/json/kr/1/200/${TABLE}`, 'StatisticItemList')
  const code = (grade: string) => {
    const hit = items.find((i) => {
      const n = i.ITEM_NAME.replace(/\s/g, '')
      return n.includes('회사채') && n.includes('3년') && n.includes(grade)
    })
    if (!hit) throw new Error(`ECOS 회사채 3년 ${grade} 항목 없음`)
    return hit.ITEM_CODE
  }
  const from = ymd(new Date(today.getTime() - 14 * 86400_000))
  const latest = async (itemCode: string) => {
    const data = await rows<DataRow>(
      `${BASE}/StatisticSearch/${key}/json/kr/1/30/${TABLE}/D/${from}/${ymd(today)}/${itemCode}`,
      'StatisticSearch',
    )
    const last = data.at(-1)
    if (!last) throw new Error(`ECOS ${itemCode} 데이터 없음`)
    return { time: last.TIME, value: Number(last.DATA_VALUE) }
  }
  const bbb = await latest(code('BBB-'))
  const aa = await latest(code('AA-'))
  const t = bbb.time
  return {
    bbbMinus3y: bbb.value,
    aaMinus3y: aa.value,
    date: `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`,
  }
}
