# 변경 이력 — legaly-backend

## v1 — 2026-06-30 (신규 백엔드)
- **Phase 1(인제스트·탐지)** 완료. 슬러그 `legaly-backend`, doc home 생성, state 재지정(프론트 v2 완료).
  - 탐지: Supabase Edge Functions=Deno, 로컬 supabase CLI/deno 미설치(배포는 사용자 권한). 테스트는
    기존 Vitest로 순수 로직 단위 + 외부 fetch stub. 실 통합은 키 제공/배포 시점.
  - 충족 계약: 프론트 dataClient 시그니처(laws/cases/answer/saved). 가이드는 정적 유지.
  - `01-working-spec.md` 작성. 다음: 갭 분석(백엔드 축) → Gate 1.
- **Phase 2~4** 갭 그리드(백엔드 축)·resolved-spec·Gate 1 승인. 결정: 하이브리드 법령데이터·키워드 RAG·이메일+비번 인증.
- **Phase 5~6** 설계·RED 테스트(단위 logic + 계약 handlers)·테스트 게이트 승인.
- **Phase 7~9** 구현(_shared 로직·Edge `legal`/`answer`·마이그레이션·시드·프론트 이중모드 연동) →
  GREEN(162). **라이브 배포·검증**: 함수 2개·시크릿·테이블+RLS·계정 4개. legal 목록·Claude RAG·RLS 격리 확인.
- **Phase 10** 독립 리뷰 r1(7건) 전부 수정 + 사용자 요청(AI 로그인 필수: 프론트 게이트 + 서버 JWT 검증;
  비번 123456). 라이브 재검증(게스트 401/로그인 200). reviewApproved.
- **Phase 11~12** 종합 검증(07)·완료(08)·추적성. Gate 2 대기.

## v1.1 — 2026-06-30 (deferred 1·2 구현)
- **D1 · 국가법령정보 실 전문(검색-우선)**: 하드코딩 MST 없이 실시간 해석.
  - 법령: `lawSearch.do?query=법령명`(정확 매칭, 시행령 제외) → 법령일련번호(MST) → `lawService.do?MST=` →
    조문 파싱(가지번호 `제N조의M`·`항` 본문 결합, 시행일자 `YYYY. MM. DD.` 포맷).
  - 판례: `lawSearch.do?target=prec&nb=사건번호` → 판례일련번호 → `lawService.do?ID=` → 판시사항/판결요지
    (HTML 제거, `[n]` 단위 분리).
  - `legalHandler` 2단계(검색→상세)로 전환, OPEN DB 미수록 사건은 큐레이션 스텁 200 폴백. 타임아웃 504 유지.
  - 라이브 검증: 주임법 42조문(가지번호+항)·통상임금 판례(2017다56226) 실 판시사항, 미수록 사건 스텁 폴백.
- **D2 · 임베딩 RAG(pgvector + gte-small)**: 키워드 단독 → **하이브리드**.
  - `0002_embeddings.sql`: `vector` 확장 + `legal_embeddings`(384d, HNSW cosine, RLS 잠금) + `match_legal`
    RPC(SECURITY DEFINER, 팀별 근접 상위 N).
  - Edge `embed`(시드, 토큰 보호, 청크 6건/호출로 컴퓨트 한도 회피)로 코퍼스 39행 임베딩 업서트.
  - `answer`: 질문을 gte-small로 임베딩→`match_legal`→**키워드(정밀)와 병합**(`mergeSources`). 임베딩/RPC 불가
    시 키워드만(절대 키워드 단독보다 나빠지지 않음).
  - 라이브 검증: "유튜버 수입 신고"→소득세법 1위(순수 벡터는 누락했던 것), "나오지 말라 통보"→근로기준법
    재현(키워드 단독은 누락). **발견**: gte-small는 경량 다국어 모델이라 한국어 법률 패러프레이즈 순위가
    약함 → 운영급은 더 강한 임베딩 모델(외부 키) 필요(deferred로 이관).
- 테스트 162→**173**(D1 파서/검색 6 + D2 임베딩/병합 5). tsc·build 클린.
