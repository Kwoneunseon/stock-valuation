# 적정주가 계산기

관심종목의 적정주가를 내 공식, S-RIM, 그레이엄 공식으로 계산한다. 설계: `docs/superpowers/specs/2026-10-25-fair-value-calculator-design.md`

## 처음 설정

1. API 키 3개 발급 (모두 무료)
   - DART 오픈API: https://opendart.fss.or.kr
   - 공공데이터포털 "금융위원회_주식시세정보" 활용신청: https://www.data.go.kr
   - 한국은행 ECOS: https://ecos.bok.or.kr/api
2. GitHub 저장소 Settings › Secrets and variables › Actions 에 `DART_API_KEY`, `DATA_GO_KR_KEY`, `ECOS_API_KEY` 등록
3. Settings › Pages › Source 를 **GitHub Actions** 로 설정
4. Actions 탭에서 "수집 및 배포" 수동 실행

## 종목 추가

`watchlist.json`에 종목코드 6자리를 넣고 커밋하면 1~2분 뒤 반영된다.

## 로컬

```
npm install
npm run dev      # public/data/stocks.json 으로 화면 확인
npm test
DART_API_KEY=... DATA_GO_KR_KEY=... ECOS_API_KEY=... npm run collect
```
