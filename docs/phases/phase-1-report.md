# Phase 1: 스키마 기반 UI

> **세션간 통신 문서** — 어떤 세션이든 이 파일을 읽고 현재 진행 상태를 파악한 뒤, 작업 후 반드시 업데이트할 것.

## 상태: NOT STARTED

| 항목 | 상태 | 라운드 | 담당 세션 | 완료일 |
|------|------|--------|-----------|--------|
| Task 1: PropertyEditor 컴포넌트 | NOT STARTED | R1 | - | - |
| Task 2: NodeForm 스키마 연동 | NOT STARTED | R2 | - | - |
| Task 3: useDialogs props 전달 | NOT STARTED | R2 | - | - |
| Task 4: NodeInfoPanel props 표시 | NOT STARTED | R2 | - | - |
| Task 5: Sidebar displayName 표시 | NOT STARTED | R2 | - | - |
| Task 6: EdgeInfoPanel displayName 표시 | NOT STARTED | R2 | - | - |
| Task 7: 테스트 | NOT STARTED | R1~R2 | - | - |

---

## 배경

Phase 0에서 kg-core에 TypeRegistry(NodeType, LinkType, PropertyDef) 스키마 레이어를 도입하고, operations/validator/serializer를 확장했다. TripleForm은 이미 Combobox + LinkType 필터링을 적용했고, canvas-types는 schema.visual에서 색상/크기를 동적으로 읽는다.

**그러나 에디터 UI의 핵심 영역이 아직 스키마를 활용하지 않는다:**

| 컴포넌트 | 현재 상태 | 문제 |
|----------|----------|------|
| NodeForm | `{ label, type }` 만 입력. `DEFAULT_TYPES` 하드코딩 | `props` 편집 불가, 스키마의 NodeType 목록 미사용 |
| useDialogs | `{ label: string; type?: string }` 전달 | `props` 미전달, type이 옵셔널 (Phase 0에서 필수로 변경됨) |
| NodeInfoPanel | label + type badge + 관계만 표시 | `props` 미표시, `NodeType.displayName` 미사용 |
| Sidebar | `node.type` 원시 문자열로 필터 뱃지 | `NodeType.displayName` 미사용 |
| EdgeInfoPanel | `triple.predicate` 원시 문자열 표시 | `LinkType.displayName` 미사용 |

---

## 라운드 실행 계획

### Round 1 — 선행 필수 (직렬)

> PropertyEditor 컴포넌트 — 모든 props UI의 기반 빌딩 블록.

| 세션 | 작업 | 상태 |
|------|------|------|
| **세션 A** | Task 1 (PropertyEditor) + Task 7-일부 (PropertyEditor 테스트) | NOT STARTED |

### Round 2 — R1 완료 후 병렬

> PropertyEditor가 준비되면 NodeForm/NodeInfoPanel에 통합 + 독립적인 displayName 작업 병행.

| 세션 | 작업 | 상태 |
|------|------|------|
| **세션 A** | Task 2 (NodeForm) + Task 3 (useDialogs) + Task 7-나머지 | NOT STARTED |
| **세션 B** | Task 4 (NodeInfoPanel) + Task 5 (Sidebar) + Task 6 (EdgeInfoPanel) | NOT STARTED |

#### 파일 충돌 가능성

| 세션 A 파일 | 세션 B 파일 | 겹침 |
|------------|------------|------|
| `forms/node-form.tsx` | `panels/node-info-panel.tsx` | 없음 |
| `hooks/use-dialogs.ts` | `panels/sidebar.tsx` | 없음 |
| `app/page.tsx` (NodeForm props 전달) | `panels/edge-info-panel.tsx` | 없음 |

**충돌 위험 0%** — 세션 A는 폼/훅, 세션 B는 패널/사이드바.

단, `app/page.tsx`는 세션 A가 NodeForm 인터페이스 변경 시 수정하므로, 세션 B는 page.tsx를 건드리지 않아야 한다.

### 시각화

```
시간 →

R1:  [A: PropertyEditor + 테스트 ▓▓▓▓▓▓▓▓] 
                                           │
R2:  ──────────────────────────────────────├─[A: NodeForm + useDialogs + 테스트 ▓▓▓▓▓▓▓▓]
                                           └─[B: InfoPanels + Sidebar ▓▓▓▓▓▓]
                                                                              ↘ 완료
```

---

## Task 1: PropertyEditor 컴포넌트 (신규)

### 목표

`PropertyDef[]` 기반으로 동적 폼 필드를 렌더링하는 재사용 컴포넌트. NodeForm(편집 모드)과 NodeInfoPanel(읽기 모드) 양쪽에서 사용.

### 파일

- **신규:** `apps/editor/src/components/forms/property-editor.tsx`

### 인터페이스

```typescript
interface PropertyEditorProps {
    /** 스키마에서 가져온 속성 정의 목록 */
    properties: PropertyDef[];
    /** 현재 속성 값 */
    values: Record<string, unknown>;
    /** 값 변경 콜백 (편집 모드) */
    onChange: (key: string, value: unknown) => void;
    /** true면 읽기 전용 표시 */
    readOnly?: boolean;
}
```

### valueType별 렌더링

| valueType | 편집 UI | 읽기 UI |
|-----------|---------|---------|
| `string` | `<Input>` | 텍스트 |
| `number` | `<Input type="number">` | 숫자 |
| `boolean` | `<Switch>` | ✓ / ✗ |
| `date` | `<Input type="date">` | 포매팅된 날짜 |
| `url` | `<Input type="url">` | 클릭 가능한 링크 |
| `enum` | `<Select>` (enumValues 기반) | 뱃지 |

### 주의사항

- `required: true`인 속성은 라벨에 `*` 표시
- 값이 없는 optional 속성은 편집 모드에서 빈 필드, 읽기 모드에서 생략
- `description`이 있으면 필드 아래에 도움말 텍스트로 표시
- overflow 처리: 긴 string 값은 truncate + title, url은 truncate + 외부 링크 아이콘

---

## Task 2: NodeForm 스키마 연동

### 대상 파일

- `apps/editor/src/components/forms/node-form.tsx`

### 현재 상태

```typescript
// 하드코딩된 타입 목록
const DEFAULT_TYPES = ["brand", "color", "typography", "concept"];

// submit 데이터에 props 없음
onSubmit: (node: { label: string; type?: string }) => void;
```

### 변경 사항

1. **props 인터페이스 추가:**
   - `NodeFormProps`에 `schema?: TypeRegistry` 추가
   - `onSubmit` 시그니처를 `{ label: string; type: string; props?: Record<string, unknown> }` 으로 변경
   - `type`을 필수로 변경 (Phase 0에서 Node.type이 required로 바뀜)

2. **타입 선택을 스키마 기반으로:**
   - `schema`가 있으면 `schema.nodeTypes`에서 목록 생성 (displayName 표시)
   - `schema`가 없으면 기존 `existingTypes` + `DEFAULT_TYPES` fallback
   - `+ 새 타입` 버튼은 schema가 없을 때만 표시 (schema 모드에서는 정의된 타입만 허용)

3. **PropertyEditor 통합:**
   - 타입 선택 시 해당 `NodeType.properties`를 가져와 PropertyEditor 렌더링
   - 편집 시 기존 `node.props` 값을 initial로 전달
   - `schema`가 없거나 properties가 비어있으면 PropertyEditor 생략

4. **initial 확장:**
   - `initial` prop에 `props?: Record<string, unknown>` 추가

### 주의사항

- 타입 변경 시 props 값 초기화 여부 — 사용자 확인 필요 (다른 타입의 PropertyDef가 다르므로)
- Dialog 높이가 PropertyEditor로 인해 커질 수 있음 — ScrollArea 적용 고려

---

## Task 3: useDialogs props 전달

### 대상 파일

- `apps/editor/src/hooks/use-dialogs.ts`
- `apps/editor/src/app/page.tsx` (NodeForm에 schema prop 전달)

### 변경 사항

1. **useDialogs:**
   - `handleNodeSubmit` 시그니처 변경: `{ label: string; type: string; props?: Record<string, unknown> }`
   - `addNode`/`updateNode` 호출 시 `props` 포함

2. **page.tsx:**
   - NodeForm에 `schema={graph.schema}` prop 추가
   - NodeForm initial에 `props: dialogs.editingNode?.props` 추가

### 영향 범위

- `useGraph.addNode`는 이미 `Omit<Node, "id">`를 받으므로 `props` 전달 가능 — 변경 불필요
- `useGraph.updateNode`도 `Partial<Omit<Node, "id">>`를 받으므로 `props` 전달 가능 — 변경 불필요
- kg-core `operations.ts`의 `updateNode`는 shallow merge (`{ ...n, ...normalized }`) — `props` 자체가 통째로 교체됨. 부분 업데이트가 필요하면 호출 측에서 머지해야 함.

---

## Task 4: NodeInfoPanel props 표시

### 대상 파일

- `apps/editor/src/components/panels/node-info-panel.tsx`

### 현재 상태

- label + type badge + 위반 알림 + 관계 목록만 표시
- `node.props` 미사용, `schema` 미참조

### 변경 사항

1. **schema prop 추가:**
   - `NodeInfoPanelProps`에 `schema?: TypeRegistry` 추가 (상위에서 `graph.schema` 전달)

2. **타입 displayName 표시:**
   - type badge에 `schema.nodeTypes`에서 찾은 `displayName` 표시 (없으면 raw type fallback)

3. **PropertyEditor (읽기 모드) 추가:**
   - label/type 섹션과 관계 목록 사이에 "속성" 섹션 추가
   - `schema`가 있고 해당 NodeType에 properties가 있으면 `<PropertyEditor readOnly />` 렌더링
   - `schema`가 없어도 `node.props`가 있으면 단순 key-value 목록으로 표시 (fallback)
   - props가 비어있으면 섹션 자체를 생략

4. **상위 연결 (page.tsx → DetailPanel → NodeInfoPanel):**
   - DetailPanel에 `schema` prop 추가하여 NodeInfoPanel로 전달

### 주의사항

- DetailPanel 파일도 수정 필요 — 세션 B가 `detail-panel.tsx` + `node-info-panel.tsx` 함께 작업

---

## Task 5: Sidebar displayName 표시

### 대상 파일

- `apps/editor/src/components/panels/sidebar.tsx`

### 현재 상태

```typescript
// node.type 원시 문자열로 뱃지 표시
<span className="truncate">{type}</span>
```

### 변경 사항

1. **SidebarProps에 `schema?: TypeRegistry` 추가**
2. **타입 뱃지에 displayName 표시:**
   - `schema.nodeTypes`에서 type에 매칭되는 `displayName`을 찾아 표시
   - 없으면 기존 raw type 문자열 fallback
   - title 속성에 `displayName (type) — N개` 형태로 표시

3. **page.tsx에서 schema 전달:**
   - `<Sidebar schema={graph?.schema} ... />` 추가

### 주의사항

- Sidebar의 schema prop은 세션 A가 아닌 세션 B가 page.tsx를 건드려야 함
- 단, 세션 A가 page.tsx의 NodeForm 부분만 수정하고, 세션 B가 Sidebar 부분만 수정하면 충돌 없음
- 혹은 R2를 직렬로 처리하여 충돌 회피 가능

---

## Task 6: EdgeInfoPanel displayName 표시

### 대상 파일

- `apps/editor/src/components/panels/edge-info-panel.tsx`

### 변경 사항

1. **schema prop 추가** (DetailPanel 경유)
2. **predicate 표시에 `LinkType.displayName` 사용:**
   - `schema.linkTypes`에서 predicate에 매칭되는 `displayName` 표시
   - 없으면 기존 raw predicate 문자열 fallback
3. **카디널리티 표시 (선택적):**
   - LinkType의 cardinality를 뱃지로 표시 (1:1, 1:N 등)
   - sourceTypes/targetTypes 제약 정보 표시

---

## Task 7: 테스트

### TDD 순서

1. **PropertyEditor 테스트 (R1):**
   - 각 valueType별 렌더링 확인
   - required 표시 확인
   - onChange 콜백 호출 확인
   - readOnly 모드 확인
   - 빈 properties일 때 빈 상태 확인

2. **NodeForm 통합 테스트 (R2):**
   - schema 있을 때 NodeType 목록에서 타입 선택
   - 타입 선택 후 PropertyEditor 렌더링 확인
   - submit 시 props 포함 확인
   - schema 없을 때 기존 동작 유지 확인

3. **useDialogs 테스트 (R2):**
   - handleNodeSubmit에 props 포함 확인

---

## 설계 소스

- Phase 0 리포트: `docs/phases/phase-0-report.md`
- 온톨로지 설계: `docs/specs/ontology-design.md` (마이그레이션 전략 2단계: 스키마 기반 UI)
- 아키텍처: `docs/specs/architecture.md`

---

## 구현 순서 (의존성 기반)

```
Task 1 (PropertyEditor)
  ├→ Task 2 (NodeForm)        ← PropertyEditor 컴포넌트 필요
  │     └→ Task 3 (useDialogs)  ← NodeForm 인터페이스 변경에 의존
  └→ Task 4 (NodeInfoPanel)   ← PropertyEditor readOnly 모드 필요

Task 5 (Sidebar displayName)  ← 독립적, schema prop만 추가
Task 6 (EdgeInfoPanel)        ← 독립적, schema prop만 추가

Task 7 (테스트)               ← Task 1과 병행 (TDD), Task 2~6과 병행
```

---

## 결정 사항 로그

> Phase 1 진행 중 내린 설계 결정을 기록.

| 번호 | 결정 | 이유 | 대안 |
|------|------|------|------|
| D1 | PropertyEditor를 편집/읽기 겸용 컴포넌트로 | NodeForm + NodeInfoPanel 양쪽에서 일관된 속성 렌더링. `readOnly` prop으로 모드 전환 | 별도 PropsDisplay 컴포넌트 (채택 안 함 — valueType별 포매팅 로직 중복) |
| D2 | schema 모드에서 `+ 새 타입` 버튼 숨김 | TypeRegistry가 존재하면 정의된 타입만 허용. 임의 타입 추가는 스키마 무결성 저해 | 항상 표시 (채택 안 함 — 스키마 검증 우회) |
| D3 | props 업데이트는 통째 교체 (shallow replace) | kg-core updateNode가 `{ ...n, ...updates }` 패턴. props 내부 필드 단위 머지는 호출 측 책임 | deep merge 도입 (채택 안 함 — 불변 operation 원칙과 충돌, 복잡도 증가) |

---

## 블로커 / 이슈

> 진행 중 발견된 문제를 기록.

| 번호 | 이슈 | 심각도 | 상태 | 해결 |
|------|------|--------|------|------|
| - | - | - | - | - |

---

## 세션 로그

> 작업한 세션은 아래에 기록을 남길 것.

| 시간 | 세션 | 작업 내용 | 변경 파일 | 상태 |
|------|------|-----------|-----------|------|
| - | - | - | - | - |
