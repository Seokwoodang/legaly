# 리걸리 (Legaly) — 나만의 법무팀 & 세무팀

한국 법률·세무 AI 상담 웹앱. 법령·판례를 둘러보고, **법무팀/세무팀**에게 질문하면 관련 법령·판례를
근거로 **Claude**가 답변합니다.

- **법무팀** — 계약·부동산·노동·가족 등
- **세무팀** — 종합소득세·부가세·양도·상속 등
- 자료실(법령) · 판례 · 절차 가이드 열람, AI 상담, 보관함

## 빠른 시작

```bash
npm install
npm run dev            # http://localhost:5173
```

클론하면 `.env`(공개 안전 값)로 **실제 Supabase 백엔드에 바로 연결**됩니다.

### 로그인 계정 (데모)
`swoo1427` · `squface` · `squface5680` · `lyuna29` — 비밀번호 **`123456`**

> 비로그인 상태에서도 자료실·판례·가이드 열람은 가능하지만, **AI 상담과 보관함은 로그인 필요**.

## 기술 스택
- **프론트**: React 18 + Vite + TypeScript + Tailwind + React Router
- **백엔드**: Supabase — Auth · Postgres(RLS) · Edge Functions(Deno)
- **AI**: Claude (answer 생성) + 하이브리드 RAG(키워드 + pgvector 임베딩 검색)
- **법령 데이터**: 국가법령정보 OPEN API 중계(실 조문·판례 전문)

## 구조
```
src/                      프론트(페이지·컴포넌트·dataClient 이중모드)
supabase/
  functions/
    legal/                국가법령정보 중계(목록 + 실 전문, 캐시)
    answer/               하이브리드 RAG → Claude 답변(로그인 필수)
    embed/                코퍼스 임베딩 시드(관리자용)
    _shared/              순수 로직(검색·파서·프롬프트 등) — Vitest로 단위 테스트
  migrations/             0001_init(보관함+RLS) · 0002_embeddings(pgvector)
docs/spec-to-code/        설계·테스트·검증 문서(한글)
```

## 테스트 / 빌드
```bash
npm test       # 173 tests (Vitest)
npm run build  # tsc -b && vite build
```

## 환경변수
- `.env` (커밋됨) — `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. 브라우저 노출 전제의
  공개 anon 키(RLS로 보호). 프론트는 이 값이 있으면 실서버, 없거나 테스트 모드면 샘플 데이터로 폴백.
- **서버 시크릿**은 `supabase/.env.local`(git 제외)에만: `ANTHROPIC_API_KEY`, `LAW_OC`,
  `SUPABASE_SECRET_KEY`, `SUPABASE_ACCESS_TOKEN`, `EMBED_SEED_TOKEN`.

## 배포(관리자)
```bash
# Edge Functions
supabase functions deploy legal answer embed --project-ref <ref> --no-verify-jwt
# 마이그레이션: 0001_init.sql, 0002_embeddings.sql (SQL Editor 또는 Management API)
# 계정 시드: node --env-file=supabase/.env.local supabase/seed/seed-users.mjs
# 임베딩 시드: embed 함수에 POST {offset,limit} + 헤더 x-seed-token (코퍼스 39행)
```

## 참고
- AI 답변은 일반 정보 제공이며 **법률·세무 자문이 아닙니다.**
- 검색 코퍼스는 핵심 생활법령 중심으로 큐레이션됨(법령 23 + 판례 16). 확장 가능.
