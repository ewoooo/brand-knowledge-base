# Editor App

지식 그래프 편집기 — D3 기반 시각화 + 실시간 규칙 검증 + AI 채팅

## 명령어

```bash
pnpm dev --filter editor        # 개발 서버 (포트 3000)
pnpm build --filter editor
pnpm test --filter editor
```

## 아키텍처

단일 페이지 앱(`page.tsx`)이 모든 상태를 소유하고 자식에게 props로 전달:

```
page.tsx (모든 dialog/form 상태 + 3개 커스텀 훅)
├── Sidebar        ← 그래프 목록, 통계, 타입 필터, 규칙 결과
├── Canvas         ← D3 force simulation (SVG)
├── DetailPanel    ← 속성 탭 + AI 채팅 탭
└── *Form dialogs  ← NodeForm, TripleForm, RuleForm
```

## 핵심 훅

- **`useGraph(null)`** — CRUD + 저장/로드 + `isDirty` 추적. 내부적으로 `kg-core`의 불변 operations 호출
- **`useSelection()`** — 단일 선택만 허용 (`node | edge | null`)
- **`useRules(graph)`** — 그래프 변경마다 자동 검증, `violatedNodeIds/TripleIds` 파생

## D3 Canvas 주의사항

- **두 개의 useEffect 패턴**: 구조 변경용(시뮬레이션 재구성) + 스타일 변경용(선택/위반 표시만 갱신)
- 이벤트 핸들러는 **ref에 저장**해야 stale closure 방지됨
- 노드 색상은 type 기반 (`brand=#6496ff`, `color=#ff5733`, `typography=#64ff96`, `concept=#888`)
- 더블클릭 = focus mode (비이웃 노드 dimmed)

## API 라우트

| 경로 | 메서드 | 역할 |
|------|--------|------|
| `/api/graphs` | GET | 그래프 목록 (`data/*.kg.json` 스캔) |
| `/api/graphs` | POST | 새 그래프 생성 |
| `/api/graphs/[filename]` | GET/PUT/DELETE | 개별 그래프 CRUD |
| `/api/chat` | POST | AI 채팅 (graph-rag 파이프라인으로 서브그래프 추출 → Anthropic 스트리밍) |

## 데이터 영속화

- `data/` 디렉토리에 `{slug}.kg.json` 파일로 저장 (모노레포 루트 기준)
- 그래프 로드는 비동기 — `load(filename)` 호출 필요

## 규칙

- 그래프 상태를 직접 mutate 하지 말 것 — 반드시 `useGraph`의 메서드 사용
- 선택은 항상 단일 (노드 하나 OR 엣지 하나)
- 폼은 모달 Dialog 기반 — 인라인 편집 없음
- UI 텍스트는 한국어
