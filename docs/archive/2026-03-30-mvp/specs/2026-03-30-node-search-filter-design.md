# 노드 검색 필터 기능 설계

## 목표

에디터 캔버스에서 노드를 텍스트로 검색하여 매칭 노드를 하이라이트하고 비매칭 노드를 흐리게 표시하는 기능을 추가한다.

## 요구사항

- **검색 대상:** 노드 라벨(`node.label`) + 노드 타입(`node.type`), 대소문자 무시
- **결과 표현:** 매칭 노드는 밝게, 비매칭 노드/엣지는 opacity 0.15로 흐리게 (기존 focusMode 패턴)
- **UI:** 캔버스 오버레이 방식. 평소 숨겨져 있다가 `Cmd+K`(Mac) / `Ctrl+K`(Windows) 단축키로 열림
- **매칭 동작:** 실시간 — 타이핑할 때마다 즉시 캔버스에 반영
- **닫기:** `Esc` 키로 닫으며 검색어 초기화

## 아키텍처

### 접근법: 기존 focusMode 패턴 재활용

Canvas에 이미 `focusedNodeId` → 이웃만 보이고 나머지 흐리게 하는 스타일 useEffect가 있다. 이 패턴을 확장하여 `highlightedNodeIds: Set<string> | null` prop을 추가한다.

## 상태 흐름

```
page.tsx (상태 소유)
├── searchOpen: boolean
├── searchQuery: string
├── matchedNodeIds: Set<string> | null (useMemo 파생)
│
├── Canvas ← highlightedNodeIds={matchedNodeIds}
│   └── 스타일 useEffect에서 dim 처리
│
└── SearchOverlay ← open, query, matchedCount, onQueryChange, onClose
```

### 매칭 로직 (page.tsx, useMemo)

- `searchOpen`이 false이거나 `searchQuery`가 빈 문자열이면 `null` 반환 (검색 비활성)
- `graph.nodes`를 순회하며 `node.label.toLowerCase().includes(q)` 또는 `node.type?.toLowerCase().includes(q)` 확인
- 매칭된 노드 ID들을 `Set<string>`으로 반환
- 매칭 결과가 0개여도 빈 Set 반환 (전체가 흐려짐 → "결과 없음" 시각적 피드백)

### 우선순위

1. `highlightedNodeIds`가 non-null → 검색 하이라이트 모드
2. `highlightedNodeIds`가 null이고 `focusedNodeId`가 있음 → 기존 포커스 모드
3. 둘 다 없음 → 전체 opacity 1

검색을 열면 `focusedNodeId`를 null로 초기화한다.

## 컴포넌트 설계

### SearchOverlay

**파일:** `apps/editor/src/components/graph/search-overlay.tsx`

```typescript
interface SearchOverlayProps {
  open: boolean;
  query: string;
  matchedCount: number;
  onQueryChange: (query: string) => void;
  onClose: () => void;
}
```

**동작:**
- `open`이 true일 때만 렌더링
- 열리면 input에 자동 포커스 (`autoFocus` 또는 `useEffect` + `ref.focus()`)
- 타이핑 시 `onQueryChange` 호출
- `Esc` 키 → `onClose` 호출
- 닫을 때 부모(page.tsx)에서 `searchQuery`를 빈 문자열로 초기화

**레이아웃:**
- 캔버스 상단 중앙에 absolute 배치
- 반투명 다크 배경 카드 (`bg-background/90 border rounded-lg shadow-2xl`)
- 내용: input + 매칭 카운트 + 단축키 힌트

### Canvas 변경

**추가 prop:**
```typescript
interface CanvasProps {
  // ... 기존 props
  highlightedNodeIds: Set<string> | null;
}
```

**스타일 useEffect 수정:**

기존 focusMode 블록 앞에 highlightedNodeIds 처리 추가:

- `highlightedNodeIds`가 non-null:
  - 매칭 노드: opacity 1
  - 비매칭 노드: opacity 0.15
  - 엣지: source와 target 모두 매칭이면 opacity 1, 아니면 opacity 0.05
  - 엣지 라벨: 엣지와 동일 로직
- `highlightedNodeIds`가 null: 기존 focusMode 로직 그대로

**useEffect deps 추가:** `highlightedNodeIds`

### page.tsx 변경

**추가 상태:**
```typescript
const [searchOpen, setSearchOpen] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
```

**파생 상태:**
```typescript
const matchedNodeIds = useMemo(() => {
  if (!searchOpen || !searchQuery.trim() || !graph) return null;
  const q = searchQuery.toLowerCase();
  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (
      node.label.toLowerCase().includes(q) ||
      (node.type && node.type.toLowerCase().includes(q))
    ) {
      ids.add(node.id);
    }
  }
  return ids.size > 0 ? ids : new Set<string>();
}, [searchOpen, searchQuery, graph]);
```

**글로벌 키보드 리스너 (useEffect):**
- `Cmd+K` / `Ctrl+K` → `setSearchOpen(true)`, `setFocusedNodeId(null)`
- `e.preventDefault()`로 브라우저 기본 동작 방지

**검색 닫기 핸들러:**
```typescript
const handleSearchClose = useCallback(() => {
  setSearchOpen(false);
  setSearchQuery("");
}, []);
```

**JSX:** Canvas 영역(`<div className="relative flex-1">`) 안에 `<SearchOverlay>` 배치

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|-----------|
| `apps/editor/src/components/graph/search-overlay.tsx` | 신규 생성 |
| `apps/editor/src/components/graph/canvas.tsx` | 수정 — `highlightedNodeIds` prop 추가, 스타일 useEffect 확장 |
| `apps/editor/src/app/page.tsx` | 수정 — 검색 상태, useMemo, 키보드 리스너, SearchOverlay 렌더링 |

## 범위 밖 (향후 고려)

- 관계(predicate) 검색
- 검색 결과 목록 드롭다운
- 검색 결과 간 이전/다음 네비게이션 (화살표 키)
- 검색 결과로 카메라 이동
