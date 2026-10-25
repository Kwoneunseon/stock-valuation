# 적정주가 계산기 설계

## 목표

관심종목(한국 상장사)의 적정주가를 공식 3개로 계산해서 현재가와 비교해 보여주는 개인용 정적 사이트.

- 공식: 내 공식, S-RIM, 그레이엄 공식
- 대상: `watchlist.json`에 넣은 종목만 (전 종목 수집 안 함)
- 마법공식(그린블라트)은 전 종목 순위 방식이라 범위에서 제외
- 목업: https://claude.ai/artifact/5iWjQPWbEQTxRrdUF4C3QE

## 구조

GitHub Actions가 데이터를 모아 JSON으로 저장하고, GitHub Pages의 정적 사이트가 그 JSON만 읽는다. 서버 없음.

```
watchlist.json          관심종목 코드 목록
collector/              데이터 수집 스크립트 (Node 20, TypeScript, tsx로 실행)
src/                    사이트 (React + Vite + Tailwind)
src/lib/formulas.ts     공식 계산 (collector와 사이트가 같이 씀)
public/data/            수집 결과 JSON (봇이 커밋)
.github/workflows/      수집 + 배포 워크플로
```

한 저장소, 한 `package.json`. 공식 함수는 순수 함수로 두고 collector와 사이트가 같은 파일을 import한다. 사이트는 S-RIM·그레이엄을 사용자 입력값으로 다시 계산해야 하므로 공유가 필요하다.

### 워크플로 실행 시점

- 평일 18:00 KST (cron `0 9 * * 1-5`)
- `watchlist.json`이 바뀐 push
- 수동 실행 (`workflow_dispatch`)

실행 순서: 수집 → `public/data/` 커밋 → 빌드 → Pages 배포.

### API 키 (GitHub Secrets)

| Secret | 용도 |
|---|---|
| `DART_API_KEY` | DART 오픈API: 재무제표, 주식총수, 고유번호 |
| `DATA_GO_KR_KEY` | 공공데이터포털 금융위원회 주식시세정보: 종가 |
| `ECOS_API_KEY` | 한국은행 ECOS: 회사채 금리 |

키는 collector에서만 쓰고 사이트 번들에는 절대 들어가지 않는다.

## 데이터 규칙

### 공통

- 재무제표: **연결 우선, 없으면 별도** (DART `fs_div` = `CFS`, 없으면 `OFS`)
- 기준 보고서: 가장 최근에 제출된 정기보고서 (1분기·반기·3분기·사업보고서)
- 종목코드 → DART 고유번호: `corpCode.xml`(zip)을 받아 매핑
- 발행주식수: **발행주식 총수** (DART 주식총수 현황, 자기주식 차감 안 함)
- 금액 단위: 내부는 원, 화면은 억원

### 최근 4분기 합계 (TTM)

손익 항목(영업이익, 지배주주순이익)에 쓴다.

- DART는 4분기를 따로 주지 않는다. 4분기 = 사업보고서 연간 값 − 3분기 누적 값.
- 일반식: TTM = 올해 누적 + (작년 연간 − 작년 같은 기간 누적)
- 최근 보고서가 사업보고서면 TTM = 그 연간 값
- 필요한 보고서가 하나라도 없으면 해당 공식은 "계산 불가 (재무 데이터 부족)"

### 현재가

공공데이터포털 주식시세정보의 가장 최근 종가. 이 API는 하루 늦게 갱신되므로 화면에 **기준일**을 항상 표시한다.

### 금리 기본값 (ECOS 시장금리 일별, 가장 최근 값)

- S-RIM 요구수익률: **회사채 3년 BBB-**
- 그레이엄 회사채 금리: **회사채 3년 AA-**
- 원래 공식은 각각 BBB- 5년, AAA를 쓰지만 무료 API에 없어서 대체한다. 화면에 어떤 금리인지 표시한다.
- ECOS 통계표·항목 코드는 구현 시 ECOS 통계코드 검색으로 확인한다.

## 공식

### 내 공식

```
사업가치 = 영업이익(TTM) × 10
재산가치 = 유동자산합계 − 유동부채합계 × 1.2 + 투자자산
1주당 가치 = (사업가치 + 재산가치 − 비유동부채합계) ÷ 발행주식총수
```

- 재무상태표 항목은 기준 보고서 시점 값
- 고정부채 = 비유동부채합계
- 투자자산 = 다음 계정의 합 (없는 계정은 0)
  - 장기금융상품
  - 장기투자증권 / 기타비유동금융자산 (공정가치측정금융자산 포함)
  - 관계기업·공동기업·종속기업 투자
  - 투자부동산
- 계정 매칭은 DART `account_id`(IFRS 태그) 우선, 없으면 `account_nm` 이름 매칭. 매칭 규칙은 `collector/accounts.ts` 한 곳에 둔다.
- 영업이익 TTM이 음수면 계산은 하되 "영업적자 주의" 표시
- 유동자산합계 또는 유동부채합계가 없으면 (은행·보험·증권 등 금융업) "계산 불가 (금융업 · 유동/비유동 구분 없음)"

### S-RIM

```
적정주가 = 자기자본 × ROE ÷ 요구수익률 ÷ 발행주식총수
```

(자기자본 + 자기자본 × (ROE − r) ÷ r 을 정리한 식)

- 자기자본: 지배주주 지분, 기준 보고서 시점
- ROE: 지배주주순이익(TTM) ÷ 지배주주 자기자본
- 요구수익률 r: 기본값 ECOS 회사채 3년 BBB-, 사용자 수정 가능
- ROE < r 이면 "ROE가 요구수익률보다 낮아 자기자본보다 낮게 평가" 안내
- 자기자본 ≤ 0 이면 "계산 불가 (자본잠식)"

### 그레이엄 공식

```
내재가치 = EPS × (8.5 + 2g) × 4.4 ÷ Y
```

- EPS: 지배주주순이익(TTM) ÷ 발행주식총수
- g (예상 성장률, %): 기본값 = 사업보고서 기준 최근 3년 EPS 연평균 성장률
  - g = (최근 연도 EPS ÷ 3년 전 EPS)^(1/3) − 1
  - 상한 15%
  - 두 EPS 중 하나라도 0 이하면 "추정 불가", 사용자가 직접 입력할 때까지 그레이엄은 계산 안 함
  - 사용자 수정 가능
- Y (회사채 금리, %): 기본값 ECOS 회사채 3년 AA-, 사용자 수정 가능
- EPS(TTM) ≤ 0 이면 "계산 불가 (EPS 적자)"
- 8.5 + 2g ≤ 0 또는 Y ≤ 0 이면 "입력값을 확인해주세요"

### 괴리율

```
괴리율 = (적정가 − 현재가) ÷ 현재가
```

양수면 "저평가"(파랑), 음수면 "고평가"(주황). 색만으로 구분하지 않고 글자도 같이 쓴다.

## 데이터 파일

`public/data/stocks.json` 하나에 전 관심종목을 담는다 (종목 수가 적으므로).

```ts
type StocksFile = {
  updatedAt: string            // 수집 시각 (ISO)
  priceDate: string            // 종가 기준일
  rates: { bbbMinus3y: number; aaMinus3y: number; date: string }
  stocks: StockData[]
}

type StockData = {
  code: string                 // "005930"
  name: string
  market: 'KOSPI' | 'KOSDAQ'
  price: number
  report: { year: number; quarter: 1 | 2 | 3 | 4; fsDiv: 'CFS' | 'OFS' }
  shares: number
  inputs: {                    // 원 단위, 없으면 null
    operatingIncomeTTM: number | null
    operatingIncomeParts: { label: string; value: number }[]
    currentAssets: number | null
    currentLiabilities: number | null
    investmentAssets: number | null
    investmentParts: { label: string; value: number }[]
    nonCurrentLiabilities: number | null
    equityParent: number | null
    netIncomeParentTTM: number | null
    epsHistory: { year: number; eps: number }[]   // 사업보고서 기준
  }
  error: string | null         // 이번 수집 실패 사유
  fetchedAt: string            // 마지막으로 성공한 수집 시각
}
```

계산 결과는 저장하지 않고 사이트가 `formulas.ts`로 계산한다. 화면의 "계산 과정 펼쳐보기"에 `*Parts`를 그대로 보여준다.

## 화면

목업 그대로 두 화면.

1. **관심종목 목록**: 종목, 현재가, 공식 3개의 적정가 + 괴리율. 계산 불가면 이유 표시. "종목 추가하는 법"을 누르면 GitHub의 `watchlist.json` 편집 링크와 안내가 펼쳐진다. 상단에 종가 기준일·갱신 시각.
2. **종목 상세** (`#/stock/005930`): 공식별 카드, 내 공식은 항목별 숫자와 출처 펼쳐보기. S-RIM 요구수익률, 그레이엄 g·Y 입력칸은 바꾸면 즉시 재계산.

- 사용자가 바꾼 입력값은 `localStorage`에 종목별로 저장, "기본값으로 되돌리기" 제공
- 라우팅은 해시 방식 (Pages에서 새로고침 404 방지), 라우터 라이브러리 없이 구현
- 폭 좁은 화면에서는 표를 가로 스크롤 박스에 넣는다

## 오류 처리

- 종목 하나가 실패해도 나머지는 계속 수집한다.
- 실패한 종목은 **이전 데이터를 유지**하고 `error`에 사유를 남긴다. 화면에 "최근 갱신 실패 · N일 전 데이터" 표시.
- 금리 조회가 실패하면 이전 금리 유지. 이전 값도 없으면 S-RIM 8.0%, 그레이엄 4.0%를 쓰고 화면에 "금리 조회 실패, 고정값 사용" 표시.
- `watchlist.json`에 잘못된 코드(DART 매핑 없음)가 있으면 그 종목만 `error: "종목코드를 찾을 수 없음"`.
- 워크플로는 수집 결과가 하나라도 있으면 성공 처리, 전부 실패면 실패 처리해서 GitHub 알림이 오게 한다.

## 테스트

Vitest.

- `formulas.ts`: 목업 숫자로 검증 (내 공식 72,300원, S-RIM r=8.5%일 때 65,100원, 그레이엄 EPS 3,037·g 5·Y 4.0일 때 61,803원), 계산 불가 경계값 (EPS 0, 자기자본 0, Y 0, 금융업 null)
- TTM 계산: 1분기·반기·3분기·사업보고서 각각
- EPS 성장률: 정상, 상한 15% 적용, 적자 포함
- 계정 매칭: 저장해 둔 DART 응답 예시 JSON으로 투자자산 합산 검증 (실제 API 호출 안 함)
- 화면은 수동 확인

## 범위 밖

- 마법공식, 전 종목 수집
- 사이트에서 종목 추가 (GitHub에서 `watchlist.json` 편집)
- 장중 실시간 가격
- 증권사 컨센서스 EPS
- 미국 주식
