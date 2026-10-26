import { useState, type ReactNode } from 'react'

const QUESTIONS: { mark: string; key: boolean; text: ReactNode }[] = [
  { mark: '①', key: true, text: <>기업은 <Em>무엇</Em>에서 돈을 벌고 있는가?</> },
  { mark: '②', key: true, text: <><Em>왜</Em> 벌 수 있었는가?</> },
  { mark: '③', key: false, text: <>앞으로 돈을 버는 구조에 <Em>변화</Em>는 있는가?</> },
  { mark: '④', key: false, text: <>이제부터 <Em>얼마나</Em> 돈을 벌 수 있는가?</> },
]

const STRENGTHS = [
  {
    no: '1)',
    title: '시장의 매력도',
    items: [['1-1', '수요구조'], ['1-2', '경쟁환경']],
    point: <>지금의 성장률이 아니라 <b>성장이 얼마나 길게 지속될 것인가</b>를 본다.</>,
  },
  {
    no: '2)',
    title: '비즈니스 유망도',
    items: [['2-1', '높은 이익률'], ['2-2', '확장의 가능성']],
    point: <>높은 이익률을 유지한 채 <b>어디까지 확장을 도모할 수 있는가</b>를 본다.</>,
  },
]

const SELL = [
  { title: '종목 선택을 잘못했을 때', desc: '가치평가를 잘못했거나, 경영 문제가 발생하여 가치가 파괴되었을 때' },
  { title: '현금이 필요해졌을 때' },
  { title: '더 나은 곳이 보일 때', desc: '투자 대상의 저평가 정도가 낮아지고, 다른 유망 종목이 발견되었을 때' },
]

const TRIGGERS = ['배당 확대', '주주 우대', '자사주 매입', '충실한 IR', '신제품', '상장', 'M&A', '액면분할']

const EMOTION = ['기업의 가치를 꿰뚫어 보아야 한다.', '감정적인 행동이 손실을 부른다는 것을 깊이 이해해야 한다.']

const FACTS = [
  ['저평가도', '대차대조표의 건전성, 사업의 유망성'],
  ['경영 능력', '주주 중시도, 자본 정책의 수완'],
  ['가격 수정 계기', '유동성, 테마'],
]

const HABITS: { mark: string; title: ReactNode; body?: ReactNode }[] = [
  {
    mark: '①',
    title: '주가가 올라갈까 내려갈까가 아닌, 저평가되었는가 아닌가에 주목하자.',
    body: '가치와 가격에 차이가 있는지, 그것이 수정될 만한 계기가 있는지 확인하고 투자한다.',
  },
  {
    mark: '②',
    title: '의견이 아니라 사실에 근거해 판단하자.',
    body: (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2">
        {FACTS.map(([t, d]) => (
          <div key={t} className="rounded-[10px] bg-ground px-3.5 py-3">
            <div className="text-sm font-bold text-ink">{t}</div>
            <div className="mt-0.5 text-[13px] leading-normal">{d}</div>
          </div>
        ))}
      </div>
    ),
  },
  { mark: '③', title: '결과가 아니라 그 이면에 있는 원인을 직시하자.' },
  {
    mark: '④',
    title: '모든 것을 알 필요는 없다. 가치의 본질을 간파하자.',
    body: '"회사의 강점을 한마디로 말하면?"에 답할 수 있도록 하자.',
  },
  { mark: '⑤', title: '투자는 수단이지 목적이 아니라는 것을 알자.' },
  { mark: '⑥', title: <>매월 최소한 수입의 <Em>10%</Em>는 증권계좌에 불입하자.</> },
  { mark: '⑦', title: '겸허히 배우는 자세를 간직하자.' },
]

const APPENDIX: { title: string; body: ReactNode }[] = [
  {
    title: '공식 셋이 같은 방향일 때',
    body: '내 공식은 이익과 재산, S-RIM은 자본과 ROE, 그레이엄은 이익과 성장을 봐요. 셋이 같은 쪽을 가리킬 때 더 믿을 만해요.',
  },
  {
    title: '경기를 타는 업종은 성장률을 직접',
    body: (
      <>
        삼성전자 EPS 성장률은 2022→2025로 재면 <b>연 −6.4%</b>, 2023→최근 4분기로 재면 <b>연 100% 이상</b>. 기준
        연도가 숫자를 뒤집어요.
      </>
    ),
  },
  {
    title: '금리만 올라도 적정가는 내려간다',
    body: (
      <>
        요구수익률이 8%에서 10.29%로 오르면 S-RIM 적정가는 <b>22% 낮아져요.</b>
      </>
    ),
  },
  {
    title: '공식이 잘 안 맞는 회사',
    body: '금융업은 내 공식 계산 불가, 지주회사(SK스퀘어)는 높게 나오기 쉽고, 적자 기업은 숫자가 의미를 잃어요.',
  },
]

const FORMULAS: { name: string; summary: string; lines: string[]; points: [string, ReactNode][] }[] = [
  {
    name: '내 공식',
    summary: '돈 버는 사업과 가진 재산을 따로 값 매기고, 장기 빚을 뺀다',
    lines: [
      '사업가치 = 영업이익(최근 4분기) × 10',
      '재산가치 = 유동자산 − 유동부채 × 1.2 + 투자자산',
      '1주당 가치 = (사업가치 + 재산가치 − 비유동부채) ÷ 발행주식총수',
    ],
    points: [
      ['× 10', '영업이익 10년치로 사업을 평가해요. PER 10배쯤으로 보는 셈이에요.'],
      ['× 1.2', '곧 갚아야 할 빚(유동부채)을 20% 더 무겁게 잡아 보수적으로 계산해요.'],
      ['투자자산', '장기금융상품 + 장기투자증권 + 관계·종속기업 투자 + 투자부동산'],
      ['데이터', 'DART 재무제표, 연결 우선(없으면 별도). 최근 4분기는 작년 연간 − 작년 같은 기간 누적 + 올해 누적'],
    ],
  },
  {
    name: 'S-RIM',
    summary: '주주 돈으로 요구수익률보다 더 벌면, 그만큼 자기자본보다 비싸게 쳐준다',
    lines: [
      '적정주가 = [자기자본 + 자기자본 × (ROE − 요구수익률) ÷ 요구수익률] ÷ 발행주식총수',
      '= 자기자본 × ROE ÷ 요구수익률 ÷ 발행주식총수',
    ],
    points: [
      ['ROE', '최근 4분기 지배주주순이익 ÷ 지배주주 자기자본'],
      ['요구수익률', '기본값은 BBB- 회사채 3년 금리(한국은행 ECOS). 원래는 5년물인데 무료 API가 없어 3년물로 대신해요.'],
      ['읽는 법', 'ROE가 요구수익률보다 높으면 자기자본보다 높게, 낮으면 낮게 평가돼요.'],
      ['가정', '지금의 초과이익이 앞으로도 계속 유지된다고 봐요. 실제로는 줄어드는 경우가 많아요.'],
    ],
  },
  {
    name: '그레이엄 공식',
    summary: '성장 없는 회사의 기본 PER에 성장률만큼 웃돈을 얹고, 금리로 보정한다',
    lines: ['내재가치 = EPS × (8.5 + 2 × 성장률) × 4.4 ÷ 회사채 금리'],
    points: [
      ['8.5', '성장이 없는 회사에 적당하다고 본 PER이에요.'],
      ['2 × 성장률', '예상 성장률 1%마다 PER을 2씩 더 쳐줘요.'],
      ['4.4 ÷ 금리', '4.4%는 그레이엄 당시 AAA 회사채 금리예요. 지금 금리가 높으면 적정가가 내려가요.'],
      ['EPS', '최근 4분기 지배주주순이익 ÷ 발행주식총수'],
      [
        '성장률',
        '기본값은 사업보고서 기준 최근 3년 EPS 연평균 성장률, 상한 15%. 경기를 타는 업종은 직접 넣는 게 정확해요.',
      ],
      ['회사채 금리', '기본값은 AA- 회사채 3년(한국은행 ECOS). 원래는 AAA인데 무료 API가 없어 대신해요.'],
    ],
  },
]

function FormulaItem({ f }: { f: (typeof FORMULAS)[number] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#EFEFEC] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-4 px-[22px] py-4 text-left"
      >
        <div>
          <div className="text-base font-bold">{f.name}</div>
          <div className="mt-0.5 text-sm text-muted">{f.summary}</div>
        </div>
        <span className="shrink-0 text-sm font-semibold text-under">{open ? '접기 ▴' : '펼치기 ▾'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 px-[22px] pb-5">
          <div className="rounded-[10px] bg-ground px-4 py-3.5 text-sm leading-7 text-[#30343B]">
            {f.lines.map((l) => (
              <div key={l} className="font-semibold">
                {l}
              </div>
            ))}
          </div>
          <dl className="flex flex-col">
            {f.points.map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[#EFEFEC] py-2.5 text-sm">
                <dt className="w-24 shrink-0 font-bold">{k}</dt>
                <dd className="min-w-0 flex-1 leading-relaxed text-[#30343B]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

function Em({ children }: { children: ReactNode }) {
  return <span className="text-under">{children}</span>
}

function Section({ no, title, children }: { no: string; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-baseline gap-2.5">
        <span className="text-[13px] font-bold text-under">{no}</span>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

const card = 'rounded-[14px] border border-line bg-white'

export function MindsetPage() {
  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-9 px-4 pb-[72px] pt-8">
      <div className="flex flex-col gap-2">
        <a href="#/" className="inline-flex min-h-11 items-center self-start text-sm font-semibold text-under">
          ‹ 관심종목
        </a>
        <h1 className="text-[28px] font-bold tracking-tight">투자 마인드셋</h1>
        <p className="text-[15px] text-muted">기억하고 새길 것</p>
      </div>

      <section className="flex flex-col gap-3.5 rounded-2xl bg-ink px-7 py-8 text-white">
        <p className="text-[26px] font-bold leading-snug tracking-tight">
          주가가 오를까 내릴까가 아니라,
          <br />
          저평가인가 아닌가.
        </p>
        <p className="text-[15px] leading-relaxed text-[#D3D8E2]">
          가치와 가격에 차이가 있는지, 그것이 수정될 만한 계기가 있는지 확인하고 투자한다.
        </p>
      </section>

      <Section no="01" title="기업을 볼 때 던질 4가지 질문">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2.5">
          {QUESTIONS.map((q) => (
            <div
              key={q.mark}
              className={`flex flex-col gap-2.5 rounded-[14px] bg-white p-[18px] ${
                q.key ? 'border-2 border-under' : 'border border-line'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[22px] font-bold ${q.key ? 'text-under' : 'text-muted'}`}>{q.mark}</span>
                {q.key && (
                  <span className="rounded-full bg-under px-2 py-0.5 text-[11px] font-bold text-white">가장 중요</span>
                )}
              </div>
              <div className="text-base font-bold leading-normal">{q.text}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section no="02" title="회사의 강점이 무엇인지 먼저 생각하자">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
          {STRENGTHS.map((s) => (
            <div key={s.title} className={`${card} flex flex-col gap-3.5 p-[22px]`}>
              <div>
                <div className="text-[13px] font-bold text-muted">{s.no}</div>
                <div className="text-[19px] font-bold">{s.title}</div>
              </div>
              <div className="flex flex-col gap-2">
                {s.items.map(([n, t]) => (
                  <div key={n} className="flex items-center gap-2.5 rounded-[10px] bg-ground px-3.5 py-3 text-[15px] font-semibold">
                    <span className="text-[13px] text-muted">{n}</span>
                    {t}
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-[#D5D6D1] pt-3 text-sm leading-relaxed">
                <b className="text-under">⇒</b> {s.point}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section no="03" title="주식을 팔아야 할 때">
        <div className={`${card} overflow-hidden`}>
          {SELL.map((s, i) => (
            <div key={s.title} className="flex gap-4 border-b border-[#EFEFEC] px-[22px] py-[18px] last:border-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-over-bg font-bold text-over">
                {i + 1}
              </div>
              <div className={s.desc ? '' : 'pt-1'}>
                <div className="text-base font-bold">{s.title}</div>
                {s.desc && <div className="mt-1 text-sm leading-relaxed text-muted">{s.desc}</div>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section no="04" title="주가가 오르는 계기">
        <div className="flex flex-wrap gap-2">
          {TRIGGERS.map((t) => (
            <span key={t} className="rounded-full border border-line bg-white px-4 py-2.5 text-[15px] font-semibold">
              {t}
            </span>
          ))}
          <span className="rounded-full border border-dashed border-[#CFD1CB] bg-white px-4 py-2.5 text-[15px] font-semibold text-muted">
            대중매체의 영향 · 단기
          </span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl bg-over-bg px-5 py-[18px] text-[#7A3206]">
          <div className="text-[15px] font-bold">회사의 주가가 오르는 시나리오를 기대하지 않는 편이 좋다.</div>
          <div className="text-sm">계기는 참고만. 가격과 가치의 차이를 중요하게 생각하자.</div>
        </div>
      </Section>

      <Section no="05" title="투자를 감정적으로 하지 않으려면">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
          {EMOTION.map((t, i) => (
            <div key={t} className={`${card} flex gap-3.5 p-5`}>
              <span className="text-lg font-bold text-under">{i + 1})</span>
              <span className="text-base font-semibold leading-relaxed">{t}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section no="06" title="투자에 도움이 되는 습관">
        <div className={`${card} overflow-hidden`}>
          {HABITS.map((h) => (
            <div key={h.mark} className="flex gap-4 border-b border-[#EFEFEC] px-[22px] py-5 last:border-0">
              <span className="w-7 shrink-0 text-xl font-bold text-under">{h.mark}</span>
              <div className="flex flex-1 flex-col gap-3">
                <div className="text-base font-bold leading-normal">{h.title}</div>
                {h.body && <div className="text-sm leading-relaxed text-muted">{h.body}</div>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <section className="flex flex-col gap-3.5 border-t border-[#D5D6D1] pt-7">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[13px] font-bold text-muted">부록</span>
          <h2 className="text-lg font-bold">이 계산기 숫자를 볼 때</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-2.5">
          {APPENDIX.map((a) => (
            <div key={a.title} className={`${card} flex flex-col gap-1.5 p-[18px]`}>
              <div className="text-[15px] font-bold">{a.title}</div>
              <div className="text-sm leading-relaxed text-[#30343B]">{a.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3.5">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[13px] font-bold text-muted">부록</span>
          <h2 className="text-lg font-bold">공식 설명</h2>
        </div>
        <div className={`${card} overflow-hidden`}>
          {FORMULAS.map((f) => (
            <FormulaItem key={f.name} f={f} />
          ))}
        </div>
      </section>
    </div>
  )
}
