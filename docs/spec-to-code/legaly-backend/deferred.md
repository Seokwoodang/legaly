# 잔여/다음 (legaly-backend)

## 완료 (v1.1 · 2026-06-30)
- ~~국가법령정보 실 상세(슬러그→MST 매핑 또는 검색-우선) → 실 조문/판례 전문~~ → **D1 완료**
  (검색-우선: 법령명→MST, 사건번호(nb)→판례일련번호. 라이브 검증).
- ~~임베딩 벡터 검색(pgvector)으로 RAG 고도화~~ → **D2 완료**
  (pgvector + Edge 내장 gte-small + `match_legal` RPC, 키워드와 하이브리드 병합).

## 남은 것
- **임베딩 모델 업그레이드**(신규): gte-small(384d 경량 다국어)은 한국어 법률 패러프레이즈 순위가 약함.
  운영급 의미검색은 더 강한 모델 필요 — OpenAI `text-embedding-3-large`(3072d) 또는 Voyage/`bge-m3`(다국어).
  **외부 임베딩 API 키 필요**. 적용 시: `legal_embeddings.embedding` 차원 변경 + 재시드 + `match_legal` 차원 갱신.
- **국가법령정보 커버리지**: 일부 사건은 OPEN DB 미수록(검색 0건)→스텁 폴백. 법령 조문 `relatedCaseIds`·판례 `refs`
  연결, 시행령/시행규칙 연계는 미구현.
- **시크릿 로테이트**(채팅 평문 노출분): Anthropic 키·service_role·access token. `EMBED_SEED_TOKEN`은 신규 생성됨.
- 비번 정책/실서비스용 비번(현재 데모 `123456`), 가이드 콘텐츠 서버화.
