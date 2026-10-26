import { useState } from 'react'
import { compute } from '../lib/compute'
import { loadOverrides } from '../lib/overrides'
import { staleNote, won } from '../lib/format'
import { ResultView } from './ResultView'
import type { StocksFile } from '../types'

const repo = import.meta.env.VITE_REPO as string | undefined

export function ListPage({ data }: { data: StocksFile }) {
  const [help, setHelp] = useState(false)

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-5 px-4 pb-16 pt-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] font-bold tracking-tight">적정주가 계산기</h1>
          <p className="text-sm text-muted">
            관심종목 {data.stocks.length}개 · {data.priceDate ?? '-'} 종가 기준 · 평일 저녁 자동 갱신
          </p>
        </div>
        <button
          onClick={() => setHelp(!help)}
          className="min-h-11 rounded-[10px] border border-[#D5D6D1] bg-white px-[18px] text-sm font-semibold"
        >
          + 종목 추가하는 법
        </button>
      </header>

      {help && (
        <section className="flex flex-col gap-3 rounded-[14px] border border-line bg-white px-6 py-5">
          <h2 className="text-base font-bold">종목 추가는 GitHub에서 해요</h2>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-[#30343B]">
            <li>
              저장소의 <code className="rounded-md bg-[#F1F1EE] px-1.5 text-[13px]">watchlist.json</code> 파일을 열어요
            </li>
            <li>종목코드 6자리를 따옴표로 감싸 목록에 추가해요</li>
            <li>저장(커밋)하면 1~2분 뒤 이 목록에 나타나요</li>
          </ol>
          {repo && (
            <a
              href={`https://github.com/${repo}/edit/main/watchlist.json`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center self-start rounded-[10px] bg-under px-4 text-sm font-semibold text-white"
            >
              GitHub에서 목록 파일 열기 ↗
            </a>
          )}
        </section>
      )}

      {data.rates.date === null && (
        <p className="rounded-[10px] bg-over-bg px-3.5 py-2.5 text-[13px] font-semibold text-over">
          금리 조회 실패, 고정값 사용 (S-RIM {data.rates.bbbMinus3y}% · 그레이엄 {data.rates.aaMinus3y}%)
        </p>
      )}

      <div className="overflow-x-auto rounded-[14px] border border-line bg-white">
        <table className="w-full min-w-[760px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-line text-[13px] font-semibold text-muted">
              <th className="px-5 py-3.5 text-left font-semibold">종목</th>
              <th className="px-5 py-3.5 text-right font-semibold">현재가</th>
              <th className="px-5 py-3.5 text-right font-semibold">내 공식</th>
              <th className="px-5 py-3.5 text-right font-semibold">S-RIM</th>
              <th className="px-5 py-3.5 text-right font-semibold">그레이엄</th>
            </tr>
          </thead>
          <tbody>
            {data.stocks.map((s) => {
              const c = compute(s, data.rates, loadOverrides(s.code))
              const note = staleNote(s)
              return (
                <tr key={s.code} className="border-b border-[#EFEFEC] last:border-0">
                  <td className="px-5 py-4 align-top">
                    <a href={`#/stock/${s.code}`} className="font-semibold text-ink">
                      {s.name} <span className="text-[13px] text-under">상세 ›</span>
                    </a>
                    <div className="mt-0.5 text-xs text-muted">
                      {s.code}
                      {s.market && ` · ${s.market}`}
                    </div>
                    {note && <div className="mt-1 max-w-[240px] text-xs font-semibold text-over">{note}</div>}
                  </td>
                  <td className="px-5 py-4 text-right align-top font-semibold">{s.price === null ? '-' : won(s.price)}</td>
                  {[c.mine, c.srim, c.graham].map((r, i) => (
                    <td key={i} className="px-5 py-4 text-right align-top">
                      <ResultView result={r} price={s.price} />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[13px] leading-relaxed text-muted">
        괴리율 = (적정가 − 현재가) ÷ 현재가. + 저평가는 현재가가 적정가보다 싸다는 뜻이에요. 재무는 연결 우선(없으면
        별도), 가장 최근 정기보고서 기준이에요. 적정가는 공식으로 계산한 값이며 투자 권유가 아니에요.
      </p>
      <p className="text-xs leading-relaxed text-muted">
        출처: 금융위원회 주식시세정보(공공데이터포털, 저작자표시-비영리-변경금지) · 금융감독원 DART 오픈API · 한국은행
        ECOS
      </p>
    </div>
  )
}
