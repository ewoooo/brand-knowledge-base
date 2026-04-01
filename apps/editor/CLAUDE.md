# Editor App

지식 그래프 편집기 — D3 기반 시각화 + 실시간 규칙 검증 + AI 채팅

상세 구조: `docs/specs/architecture.md` 참조 (컴포넌트 트리, 훅 구조, Canvas 모듈, CSS 구조)

## 명령어

```bash
pnpm dev --filter editor        # 개발 서버 (포트 3000)
pnpm build --filter editor
pnpm test --filter editor
```

## 규칙

- 그래프 상태를 직접 mutate 하지 말 것 — 반드시 `useGraph`의 메서드 사용
- UI 컴포넌트(`components/`)는 `graph.*`를 직접 조회/파생하지 말 것 — `find`, `filter`, `map` 등 데이터 로직은 훅(`hooks/`)에서 처리하고, 컴포넌트는 결과만 prop으로 받아 표시
- CRUD + 다이얼로그 분리 — 데이터 조작은 도메인 훅(`use-node`, `use-triple`, `use-rule`), 모달 열기/닫기는 `useDialog`
- 선택은 항상 단일 (노드 하나 OR 엣지 하나)
- 폼은 모달 Dialog 기반 — 인라인 편집 없음
- UI 텍스트는 한국어
- Canvas 수정 시 D3 모듈 구조(`rendering/`, `core/`, `styles/`) 유지
- CSS는 `app/styles/` 하위 파일에 관심사별 분리 — globals.css에 직접 추가하지 말 것
