# 00 · 행동 그리드 — 리걸리 백엔드

백엔드 필수 축을 모두 walk. 모든 셀 결정. ✅ 결정 · 🆕 신규판단 · ⚠️확인 = Gate 1에서 사용자 확인.

## 결정 요약(인제스트/갭)
- (B) 법령·판례 = **하이브리드**: 팀별 큐레이션 ID 세트로 목록, 상세는 국가법령정보 실조회 + 캐시.
- (C) RAG = **키워드 검색**(코퍼스+국가법령정보) → Claude. (임베딩은 deferred)
- (A) 인증 = **이메일+비밀번호**(Supabase Auth). 아이디→`<id>@legaly.app`. 4계정 시드, 임시 비번 `legaly-temp-1234`(⚠️확인).

## A. 인증 / 권한(authn·authz)
| 상황 | 동작 |
|---|---|
| 로그인 | Supabase Auth `signInWithPassword(email,password)`. 프론트 입력 아이디→`<id>@legaly.app` 변환 ✅ |
| 세션 | supabase-js가 JWT 관리(자동 갱신). AppContext가 `onAuthStateChange`로 user 동기화 🆕 |
| 로그아웃 | `signOut()` ✅ |
| 표시명 | user metadata `name`(없으면 아이디). 시드 시 설정 🆕 |
| 시드 계정 | swoo1427/squface/squface5680/lyuna29 @legaly.app, 비번 `legaly-temp-1234`, admin API(service_role) seed ⚠️확인 |
| saved 접근(비인증) | 401 UNAUTHENTICATED(프론트는 로그인 게이트로 선차단) ✅ |
| saved 접근(인증) | RLS로 **본인 행만** select/insert/delete ✅ |
| laws/cases/answer 호출 | **공개**(비로그인 허용) — 열람·상담은 게스트 가능(v1 동일) ✅ |

## B. saved_consultations (DB + RLS)
| 축 | 결정 |
|---|---|
| 스키마 | `id uuid pk default gen_random_uuid()`, `user_id uuid not null references auth.users on delete cascade`, `team text check in('법무','세무')`, `title text`, `summary text`, `date text`, `created_at timestamptz default now()` ✅ |
| RLS | `enable`. policy: `user_id = auth.uid()` for select/insert/delete(using+with check) ✅ |
| getSaved | `select * where user_id=auth.uid() order by created_at desc` → SavedItem[] 매핑 ✅ |
| addSaved | insert(user_id=auth.uid(), team,title,summary,date). id는 DB 생성(클라 id 무시) 🆕 |
| deleteSaved | delete where id=$1 (RLS가 타인 행 차단; 없는 id → 0행, 정상) ✅ |
| 중복 저장 | dedup 없음(v1 동일) ✅ |
| 마이그레이션 | additive·reversible SQL, 사용자가 적용(파괴적 자동 실행 금지) ✅ |

## C. 법령/판례 중계 — Edge Function `legal` (B 하이브리드)
| 축 | 결정 |
|---|---|
| 목록 getLaws/getCases(team) | 팀별 **큐레이션 목록**(v1 샘플의 명칭·사건번호·분야·소관·일자 = 안정 메타) 반환. 빠르고 예측가능 ✅ |
| 상세 getLaw(id) | 큐레이션 매핑에서 국가법령정보 ID/MST 찾아 `lawService.do` 실조회→조문 파싱→LawDetail. 매핑 없으면 스텁(준비중) 🆕 |
| 상세 getCase(id) | `prec` service 실조회→판시/요지/전문 파싱→CaseDetail. 없으면 스텁 🆕 |
| 캐시 | 상세 응답 `legal_cache(key text pk, payload jsonb, fetched_at)` TTL(예 7일). 히트 시 외부 호출 생략 🆕 |
| 외부 타임아웃 | 8s AbortController → 504 UPSTREAM_TIMEOUT, 캐시 있으면 캐시 반환 🆕 |
| 외부 4xx/5xx/파싱실패 | 캐시 폴백 → 없으면 스텁 상세(isStub) + 200(UX 깨짐 방지), 로그 기록 🆕 |
| 응답 형태 | 프론트 LawListItem/LawDetail/CaseListItem/CaseDetail 그대로 ✅ |
| 페이지네이션 | 큐레이션 목록은 소수 → 전체 반환(페이지네이션 없음) ✅ |
| OC 키 | Function Secret `LAW_OC`(클라 노출 금지) ✅ |

## D. AI 답변 — Edge Function `answer` (C 키워드 RAG)
| 축 | 결정 |
|---|---|
| 입력 | `POST {team:'법무'|'세무', question:string}` ✅ |
| 검증 | team 유효+question 1~1000자 아니면 400 VALIDATION 🆕 |
| 검색 | 질문 형태소/키워드 추출 → 팀 코퍼스(법령 조문+판례 요지 텍스트) 점수 매칭 상위 N(법령≤3·판례≤2) 🆕 |
| 매칭 0건 | 일반 안내 컨텍스트로 진행(빈 sources 허용) 🆕 |
| 생성 | Anthropic `messages`(model=Claude, 팀 페르소나 system + 검색 컨텍스트). 출처=검색 결과 → AnswerPayload ✅ |
| Anthropic 실패/타임아웃 | 502 UPSTREAM_ERROR / 504(20s) → 프론트 에러 버블(기존 처리) 🆕 |
| rate limit | IP·사용자 기준 분당 N회 초과 429 RATE_LIMITED(간단 카운터/테이블) 🆕 |
| 키 | Function Secret `ANTHROPIC_API_KEY` ✅ |
| 모델 | claude 최신(예: claude-sonnet) 설정값, 토큰 상한 지정 🆕 |

## E. 공통 / 횡단
| 축 | 결정 |
|---|---|
| 에러 모델 | `{ error: { code, message } }` + HTTP status. 코드: UNAUTHENTICATED401·VALIDATION400·NOT_FOUND404·RATE_LIMITED429·UPSTREAM_TIMEOUT504·UPSTREAM_ERROR502·INTERNAL500 ✅ |
| CORS | Edge Function이 허용 Origin 헤더(프론트 도메인/localhost) + OPTIONS preflight ✅ |
| 입력 검증 | 모든 함수 진입에서 파라미터 검증(타입·범위) 🆕 |
| 멱등성 | GET 안전. addSaved는 비멱등(중복 허용, v1 동일) ✅ |
| 트랜잭션 | 단일 행 insert/delete라 명시적 tx 불필요. 시드는 멱등(upsert by email) 🆕 |
| 로깅/감사 | 외부 호출 실패·rate limit는 console 로그(운영 시 확장) 🆕 |
| 비밀 | ANTHROPIC_API_KEY·LAW_OC = Function Secrets; service_role은 서버 시드 전용(클라 금지) ✅ |
| 프론트 교체 | supabase-js 도입; `storage`(saved)·`AppContext`(auth)·`dataClient`(laws/cases/answer)를 실호출로. **시그니처 불변**(컴포넌트 무수정) ✅ |
| 테스트 경계 | 순수 로직(키워드 추출·점수·매핑·파서·아이디→이메일·에러 매핑)=Vitest 단위; fetch는 stub. 실 Supabase/외부=배포 후 수동 QA 🆕 |

## ⚠️ Gate 1 확인 항목
- (C) 키워드 RAG로 시작(임베딩 deferred) — 동의?
- 계정 4개 임시 비번 `legaly-temp-1234` — 동의/변경?
- laws/cases/answer 게스트 공개(비로그인 허용) — 동의?

## 회귀/범위
프론트 시그니처 불변이 핵심 — UI/테스트는 그대로, 데이터 출처만 교체. 가이드는 정적 유지(범위 밖).
