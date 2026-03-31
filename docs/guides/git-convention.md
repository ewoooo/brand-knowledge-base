# Git Convention

## 1. 브랜치 전략 (GitHub Flow)

### 원칙

- `main`은 항상 배포 가능한 상태를 유지
- 모든 작업은 `main`에서 분기한 feature 브랜치에서 진행
- 작업 완료 후 PR을 생성하여 `main`에 병합

### 워크플로우

```
1. main에서 브랜치 생성    → git checkout -b feat/기능명
2. 작업 + 커밋             → git commit -m "feat: 설명"
3. 원격에 푸시             → git push -u origin feat/기능명
4. PR 생성 및 리뷰        → GitHub에서 PR 생성
5. main에 병합             → Squash Merge 권장
6. 브랜치 삭제             → 병합 후 원격/로컬 브랜치 정리
```

### 규칙

- `main`에 직접 커밋 금지 (긴급 hotfix 제외)
- PR 없이 `main`에 병합하지 않음
- 병합 전 `build`, `lint` 통과 확인
- 병합 후 feature 브랜치는 삭제

## 2. 브랜치 네이밍

### 형식

```
타입/설명
```

### 브랜치 타입

| 타입     | 용도        | 예시                  |
| -------- | ----------- | --------------------- |
| feat     | 새로운 기능 | `feat/login`          |
| fix      | 버그 수정   | `fix/sidebar-crash`   |
| refactor | 코드 개선   | `refactor/auth-logic` |
| docs     | 문서 작업   | `docs/api-guide`      |
| chore    | 설정/빌드   | `chore/eslint-config` |

### 규칙

- 영문 소문자 + 하이픈(`-`)으로 구분
- 간결하되 작업 내용을 알 수 있게 작성

## 3. Commit 메시지

### 형식

```
타입: 변경 내용 설명
```

### Commit 타입

| 타입     | 설명                              |
| -------- | --------------------------------- |
| feat     | 새로운 기능 추가                  |
| fix      | 버그 수정                         |
| docs     | 문서 수정                         |
| style    | 코드 스타일 수정 (기능 변경 없음) |
| refactor | 코드 구조 개선                    |
| test     | 테스트 코드 추가                  |
| chore    | 기타 작업 (빌드 설정 등)          |

### 작성 원칙

- 변경 내용이 명확할 것
- 한 Commit에 하나의 논리적 작업만 포함
- 간결하고 이해하기 쉬운 설명
- 한국어로 작성

### 좋은 예시

```
feat: 로그인 기능 추가
fix: 사이드바 클릭 시 크래시 수정
docs: API 문서 업데이트
refactor: 회원 인증 로직 개선
```

### 나쁜 예시

```
update code
fix bug
수정
여러 기능 추가 및 버그 수정  ← 하나의 커밋에 여러 작업
```

## 4. 커밋 단위

- 하나의 커밋 = 하나의 논리적 변경
- 섞지 말 것: 기능 추가 + 버그 수정 = 별도 커밋
- 섞지 말 것: 리팩토링 + 새 기능 = 별도 커밋
- 커밋 전 `lint`, `type-check`, `format:check` 오류가 없는지 확인
