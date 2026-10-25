import { useState, type ReactNode } from 'react'
import { compute } from '../lib/compute'
import { loadOverrides, saveOverrides, type Overrides } from '../lib/overrides'
import { eok, reportLabel, staleNote, won } from '../lib/format'
import { ResultView } from './ResultView'
import type { Result } from '../lib/formulas'
import type { Part, StockData, StocksFile } from '../types'

function Card({ title, result, price, children }: { title: string; result: Result; price: number | null; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[14px] border border-line bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="text-right">
          <ResultView result={result} price={price} size="lg" />
        </div>
      </div>
      {children}
    </section>
  )
}

function Formula({ children }: { children: ReactNode }) {
  return <div className="rounded-[10px] bg-ground px-4 py-3.5 text-sm leading-7 text-[#30343B]">{children}</div>
}

function Row({ label, value, parts, total }: { label: string; value: string; parts?: Part[]; total?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 border-t border-[#EFEFEC] py-3 ${total ? 'bg-[#F9F9F7] px-2 font-bold' : ''}`}>
      <div>
        <div className="font-semibold">{label}</div>
        {parts && parts.length > 0 && (
          <div className="mt-0.5 text-xs leading-relaxed text-muted">
            {parts.map((p) => `${p.label} ${eok(p.value)}`).join(' · ')}
          </div>
        )}
      </div>
      <div className="whitespace-nowrap font-semibold">{value}</div>
    </div>
  )
}

function NumberInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-muted">
      {label}
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-40 rounded-[10px] border border-[#CFD1CB] bg-white px-3 text-base font-semibold text-ink"
      />
    </label>
  )
}

const fmtPct = (n: number | null) => (n === null ? '' : String(Math.round(n * 10) / 10))

export function DetailPage({ data, stock: s }: { data: StocksFile; stock: StockData }) {
  const [o, setO] = useState<Overrides>(() => loadOverrides(s.code))
  const [open, setOpen] = useState(true)
  const c = compute(s, data.rates, o)
  const i = s.inputs
  const note = staleNote(s)

  const update = (patch: Overrides) => {
    const next = { ...o, ...patch }
    setO(next)
    saveOverrides(s.code, next)
  }
  const reset = () => {
    setO({})
    saveOverrides(s.code, {})
  }

  const rateNote = data.rates.date ? `${data.rates.date} 기준` : '조회 실패, 고정값'

  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-5 px-4 pb-16 pt-8">
      <a href="#/" className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-under">
        ‹ 관심종목
      </a>

      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[28px] font-bold tracking-tight">{s.name}</h1>
            <span className="text-sm text-muted">
              {s.code}
              {s.market && ` · ${s.market}`}
            </span>
          </div>
          <p className="text-sm text-muted">재무 기준: {s.report ? reportLabel(s.report) : '-'}</p>
          {note && <p className="text-[13px] font-semibold text-over">{note}</p>}
        </div>
        <div className="text-right">
          <div className="text-[13px] text-muted">현재가 ({data.priceDate ?? '-'} 종가)</div>
          <div className="text-[30px] font-bold">{s.price === null ? '-' : `${won(s.price)}원`}</div>
        </div>
      </header>

      <Card title="내 공식" result={c.mine} price={s.price}>
        <Formula>
          <div>사업가치 = 영업이익(최근 4분기) × 10</div>
          <div>재산가치 = 유동자산합계 − 유동부채 × 1.2 + 투자자산</div>
          <div className="font-semibold text-ink">1주당 가치 = (사업가치 + 재산가치 − 비유동부채) ÷ 발행주식총수</div>
        </Formula>
        {i && (
          <>
            <button
              onClick={() => setOpen(!open)}
              className="min-h-11 self-start rounded-[10px] border border-[#D5D6D1] bg-white px-3.5 text-sm font-semibold"
            >
              {open ? '계산 과정 접기 ▴' : '계산 과정 펼쳐보기 ▾'}
            </button>
            {open && (
              <div className="flex flex-col text-sm">
                <div className="pb-1.5 text-xs text-muted">단위: 억원 · 출처: DART 재무제표</div>
                <Row
                  label="영업이익 (최근 4분기)"
                  value={i.operatingIncomeTTM === null ? '없음' : eok(i.operatingIncomeTTM)}
                  parts={i.operatingIncomeParts}
                />
                <Row
                  label="사업가치 (× 10)"
                  value={i.operatingIncomeTTM === null ? '-' : eok(i.operatingIncomeTTM * 10)}
                  total
                />
                <Row label="유동자산합계" value={i.currentAssets === null ? '없음' : eok(i.currentAssets)} />
                <Row
                  label="유동부채 × 1.2"
                  value={i.currentLiabilities === null ? '없음' : `−${eok(i.currentLiabilities * 1.2)}`}
                  parts={i.currentLiabilities === null ? [] : [{ label: '유동부채합계', value: i.currentLiabilities }]}
                />
                <Row label="투자자산" value={`+${eok(i.investmentAssets)}`} parts={i.investmentParts} />
                <Row
                  label="재산가치"
                  value={
                    i.currentAssets === null || i.currentLiabilities === null
                      ? '-'
                      : eok(i.currentAssets - i.currentLiabilities * 1.2 + i.investmentAssets)
                  }
                  total
                />
                <Row
                  label="비유동부채 (고정부채)"
                  value={i.nonCurrentLiabilities === null ? '없음' : `−${eok(i.nonCurrentLiabilities)}`}
                />
                <Row label="발행주식총수" value={s.shares === null ? '없음' : `${won(s.shares)}주`} />
              </div>
            )}
          </>
        )}
      </Card>

      <Card title="S-RIM" result={c.srim} price={s.price}>
        <Formula>
          <div className="font-semibold text-ink">적정주가 = 자기자본 × ROE ÷ 요구수익률 ÷ 발행주식총수</div>
          <div className="text-[13px] text-muted">자기자본 + 자기자본 × (ROE − 요구수익률) ÷ 요구수익률 을 정리한 식이에요</div>
        </Formula>
        {i && (
          <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
            <div>
              <div className="text-[13px] text-muted">자기자본 (지배주주)</div>
              <div className="font-semibold">{i.equityParent === null ? '없음' : `${eok(i.equityParent)}억`}</div>
            </div>
            <div>
              <div className="text-[13px] text-muted">ROE (최근 4분기)</div>
              <div className="font-semibold">
                {i.equityParent && i.netIncomeParentTTM !== null
                  ? `${((i.netIncomeParentTTM / i.equityParent) * 100).toFixed(1)}%`
                  : '없음'}
              </div>
            </div>
          </div>
        )}
        <NumberInput
          label={`요구수익률 (%) · 기본값 회사채 3년 BBB- (${rateNote})`}
          value={o.r ?? fmtPct(data.rates.bbbMinus3y)}
          onChange={(v) => update({ r: v })}
        />
      </Card>

      <Card title="그레이엄 공식" result={c.graham} price={s.price}>
        <Formula>
          <div className="font-semibold text-ink">내재가치 = EPS × (8.5 + 2 × 성장률) × 4.4 ÷ 회사채 금리</div>
        </Formula>
        <div className="text-sm">
          <div className="text-[13px] text-muted">EPS (최근 4분기 지배주주순이익 ÷ 발행주식총수)</div>
          <div className="font-semibold">{c.eps === null ? '없음' : `${won(c.eps)}원`}</div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-4">
          <NumberInput
            label="예상 성장률 (%) · 기본값 최근 3년 EPS 연평균, 상한 15%"
            value={o.g ?? fmtPct(c.g)}
            onChange={(v) => update({ g: v })}
          />
          <NumberInput
            label={`회사채 금리 (%) · 기본값 회사채 3년 AA- (${rateNote})`}
            value={o.y ?? fmtPct(data.rates.aaMinus3y)}
            onChange={(v) => update({ y: v })}
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">바꾼 입력값은 이 브라우저에 저장돼요.</p>
        <button
          onClick={reset}
          className="min-h-11 rounded-[10px] border border-[#D5D6D1] bg-white px-4 text-sm font-semibold"
        >
          기본값으로 되돌리기
        </button>
      </div>
    </div>
  )
}
