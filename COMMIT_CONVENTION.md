# Commit 메시지 규칙

## 기본 형식

```
타입: 변경 내용 설명
```

## Commit 타입

| 타입 | 설명 |
|------|------|
| feat | 새로운 기능 추가 |
| fix | 버그 수정 |
| docs | 문서 수정 |
| style | 코드 스타일 수정 (기능 변경 없음) |
| refactor | 코드 구조 개선 |
| test | 테스트 코드 추가 |
| chore | 기타 작업 (빌드 설정 등) |

## 작성 원칙

- 변경 내용이 명확할 것
- 한 Commit에 하나의 작업
- 간결하고 이해하기 쉬운 설명
- 한국어로 작성

## 예시

```
feat: 로그인 기능 추가
fix: 로그인 오류 수정
docs: API 문서 업데이트
refactor: 회원 인증 로직 개선
style: 들여쓰기 통일
test: 로그인 단위 테스트 추가
chore: ESLint 설정 변경
```

## 나쁜 예시

```
update code
fix bug
수정
```
