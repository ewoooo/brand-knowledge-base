# Design System — KnowledgeView

## Product Context
- **What this is:** 지식 그래프 편집기 + RAG 채팅 + 브랜드 린터 (Living Brand Guidelines)
- **Who it's for:** 브랜드 디자이너/전략가 (관리), 내부 이해관계자 (마일스톤/의사결정)
- **Space/industry:** 브랜드 거버넌스, 디자인 시스템 도구
- **Project type:** 데스크톱 웹 앱 (D3 캔버스 중심, 3패널 레이아웃)
- **Reference:** Linear (도구 미학), Porto Rocha (절제된 크롬)

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian, Linear-inspired
- **Decoration level:** Minimal — 타이포그래피와 공간이 모든 걸 함. 캔버스 노드 색상이 유일한 장식
- **Mood:** 정밀한 도구. 차분하지만 날카롭고, 데이터가 주인공. UI 크롬은 투명하게 존재
- **Reference sites:** linear.app, portorocha.com

## Typography
- **Display/Heading:** Geist Sans, weight 500, letter-spacing -0.04em
- **Body:** Geist Sans, weight 400, 13px
- **UI/Labels:** Geist Sans, weight 500, 12px
- **Data/Tables:** Geist Mono, weight 400, tabular-nums
- **Code:** Geist Mono, weight 400
- **Loading:** Geist npm 패키지 (이미 설치됨)
- **Scale:**

| Token | Size | Weight | Tracking | Usage |
|-------|------|--------|----------|-------|
| heading | 24px | 500 | -0.04em | 페이지 제목 |
| title | 18px | 500 | -0.02em | 섹션 제목 |
| subtitle | 14px | 500 | -0.01em | 카드 헤더, 노드명 |
| body | 13px | 400 | normal | 기본 텍스트 |
| body-sm | 12px | 400 | normal | 보조 텍스트 |
| caption | 11px | 400 | normal | 메타 정보, 타임스탬프 |
| mono | 12px | 400 | normal | 코드, 경로, 수치 |

## Color
- **Approach:** Restrained — UI는 무채색, 캔버스 노드만 색이 살아있음

### UI Colors

| Token | Value | Usage |
|-------|-------|-------|
| --background | #0a0a0a | 앱 배경 |
| --surface | #141414 | 카드, 패널, 팝오버 |
| --surface-elevated | #1a1a1a | 호버, 활성 표면 |
| --border | rgba(255,255,255,0.05) | 기본 구분선 |
| --border-hover | rgba(255,255,255,0.10) | 인풋, 호버 보더 |
| --border-active | rgba(255,255,255,0.18) | 포커스, 활성 보더 |
| --text | #ededec | 기본 텍스트 |
| --text-secondary | #a0a0a0 | 보조 텍스트 |
| --text-muted | #5e5e5e | 힌트, 비활성 |
| --accent | #5e6ad2 | Primary 액션, 포커스 링 |
| --accent-hover | #6e7ce0 | 액센트 호버 |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| --destructive | #d94f4f | 에러, 위반, 삭제 |
| --success | #4da375 | 준수, 성공 |
| --warning | #d4a04a | 경고, 부분 준수 |

### Canvas Node Colors

| Token | Value | Node Type |
|-------|-------|-----------|
| --node-brand | #6496ff | brand |
| --node-typography | #64ff96 | typography |
| --node-concept | #777777 | concept |
| --node-color | #ff5733 | color |
| --node-application | #995733 | application |

- **Dark mode:** 기본이자 유일한 모드 (라이트 모드 없음)
- **Semantic 사용 원칙:** 색상은 의미를 전달할 때만 사용. 장식적 색상 사용 금지. 상태 표시에는 항상 색상+아이콘+텍스트 병행 (색맹 대응)

## Spacing
- **Base unit:** 4px
- **Density:** Compact — 데이터 밀도가 높은 도구
- **Scale:**

| Token | Value | Usage |
|-------|-------|-------|
| 2xs | 2px | 인라인 간격 |
| xs | 4px | 뱃지 패딩, 아이콘 간격 |
| sm | 8px | 카드 내부 간격 |
| md | 12px | 섹션 간격 |
| lg | 16px | 패널 패딩 |
| xl | 24px | 섹션 사이 |
| 2xl | 32px | 큰 섹션 분리 |
| 3xl | 48px | 페이지 여백 |

## Layout
- **Approach:** Grid-disciplined — 3패널 고정 그리드, 예측 가능한 도구 UI
- **Grid:** 사이드바(220px) + 캔버스(flex-1) + 디테일패널(260-350px)
- **Max content width:** 제한 없음 (3패널이 뷰포트를 채움)
- **Min viewport:** 1024px (데스크톱 전용)
- **Border radius:**

| Token | Value | Usage |
|-------|-------|-------|
| sm | 4px | 인풋, 작은 뱃지 |
| md | 6px | 버튼, 카드, 드롭다운 |
| lg | 8px | 모달, 시트 |
| full | 9999px | 원형 뱃지, 노드 |

## Motion

Based on Emil Kowalski's animations.dev course.

### Easing

| Token | Value | Usage |
|-------|-------|-------|
| --ease-out | cubic-bezier(0.23, 1, 0.32, 1) | 진입/퇴장 (기본값) |
| --ease-in-out | cubic-bezier(0.645, 0.045, 0.355, 1) | 화면 내 이동 |
| --ease | ease | 호버, 색상 전환 |

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| --duration-micro | 100ms | 호버, 토글, 색상 전환 |
| --duration-fast | 150ms | 툴팁, 드롭다운, 뱃지 |
| --duration-normal | 200ms | 모달, 탭 전환, 패널 |
| --duration-slow | 300ms | 캔버스 줌, 포커스 이동 |

### 원칙

1. **ease-out이 기본.** 모든 진입/퇴장 애니메이션에 사용. 즉각적이고 반응적인 느낌
2. **300ms를 넘지 않음.** UI 애니메이션은 300ms 이내. 도구는 빠르게 반응해야 함
3. **퇴장은 진입보다 20% 빠르게.** 모달 진입 200ms, 퇴장 160ms
4. **짝을 이루는 요소는 같은 타이밍.** 모달+오버레이, 툴팁+화살표는 동일한 easing과 duration
5. **100+번 보는 건 애니메이션하지 않음.** 자주 쓰는 인터랙션은 즉각 반응
6. **transform과 opacity만 애니메이션.** layout/paint 트리거 속성(height, width, padding) 금지

### CSS Custom Properties

```css
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);
  --duration-micro: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
}
```

### 패턴

**버튼 active 피드백:**
```css
button:active {
  transform: scale(0.97);
  transition: transform var(--duration-micro) var(--ease-out);
}
```

**모달/다이얼로그 진입:**
```css
.dialog-enter {
  transform: scale(0.95);
  opacity: 0;
}
.dialog-enter-active {
  transform: scale(1);
  opacity: 1;
  transition: all var(--duration-normal) var(--ease-out);
}
```

**오버레이 (모달과 쌍):**
```css
.overlay {
  transition: opacity var(--duration-normal) var(--ease-out);
}
```

**툴팁/드롭다운:**
```css
.tooltip {
  transform-origin: var(--radix-tooltip-content-transform-origin);
  animation: tooltip-enter var(--duration-fast) var(--ease-out);
}
@keyframes tooltip-enter {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

**캔버스 줌/포커스:**
```css
.canvas-zoom {
  transition: transform var(--duration-slow) var(--ease-in-out);
}
```

**호버 색상 전환:**
```css
.interactive:hover {
  transition: background-color var(--duration-micro) ease;
}
```

### 접근성

모든 애니메이션에 reduced motion 지원 필수:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 캔버스 (D3) 전용

- D3 transition은 JS 기반이므로 CSS easing 값을 d3.easeCubicOut 등으로 매핑
- 노드 포커스 이동: 300ms, d3.easeCubicInOut
- 노드 진입/퇴장: 200ms, d3.easeCubicOut
- 엣지 하이라이트: 150ms opacity 전환

## Component Patterns

### Buttons
- **Primary:** accent 배경(#5e6ad2) + 흰색 텍스트. 유일한 솔리드 버튼
- **Secondary:** 투명 배경 + border-hover 보더 + text 색상
- **Ghost:** 투명, 호버 시 surface 배경
- **Danger:** 투명 + destructive 텍스트 + 미세 destructive 보더
- **키보드 힌트:** 버튼 내부에 kbd 뱃지로 단축키 표시 (예: 저장 ⌘↩)

### Badges
- **타입 뱃지:** 7px 컬러 도트 + 플레인 텍스트 (컬러 배경 없음)
- **상태 뱃지:** pill 형태, 보더만 (배경 없음). 예: 준수(success 보더), 위반(destructive 보더)
- **카운트:** 숫자만 (mono 폰트)

### Alerts
- 컬러 배경 금지. 6px 도트 + 텍스트. border-bottom으로 구분
- 시맨틱 색상은 도트에만 적용

### Inputs
- 배경: --bg, 보더: --border-hover
- 포커스: accent 보더 + 미세 accent 글로우 (box-shadow: 0 0 0 2px rgba(94,106,210,0.15))
- Combobox: Command (cmdk) 기반 + Popover

### Cards
- 배경: --surface, 보더: --border
- 호버 시 보더 강화 (--border-hover)
- border-radius: md (6px)

## Anti-patterns
- colored left-border 카드 금지
- tinted background 알림 금지 (v1에서 거부됨)
- 도넛 차트/원형 차트 지양, 숫자+뱃지로
- 3-column feature grid 금지
- 장식적 그라디언트/블롭 금지
- 모든 요소 center 정렬 금지
- 동일 border-radius 일괄 적용 금지

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-31 | v3 Linear 스타일 채택 | 도구 제품에 가장 적합. Porto Rocha(v2)는 에이전시 미학, Linear(v3)는 앱 도구 미학 |
| 2026-03-31 | Geist 폰트 유지 | 이미 설치됨, Linear의 시스템 폰트보다 독특한 아이덴티티 |
| 2026-03-31 | 무채색 UI + 캔버스 색상만 | 데이터(그래프)에 주목하게 하는 의도적 선택 |
| 2026-03-31 | Compact 밀도 (4px base) | 작업 도구로서 정보 밀도 우선 |
| 2026-03-31 | 모션: ease-out 기본, 300ms 상한 | Emil Kowalski animations.dev 기반. 도구는 빠르게 반응 |
| 2026-03-31 | es-hangul 초성 검색 | Combobox 한글 UX 개선 |
