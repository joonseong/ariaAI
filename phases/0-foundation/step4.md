# Step 4: auth-service

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (서비스 레이어에서 예외를 throw하지 말 것. Result<T> 타입으로 반환)
- `/docs/ARCHITECTURE.md` — "비즈니스 로직 분리" 섹션 (toggleLike 코드 예제), "닉네임 유일성 보장 (Transaction 패턴)" 섹션, "에러 처리 전략" 섹션
- `/docs/PRD.md` — 3-1. 인증 기능 전체 (기본 동작, 입력 검증, 에러 케이스, 엣지 케이스)
- `/types/common.ts` — Result<T>, AppError 타입
- `/types/user.ts` — User, SignUpInput 타입
- `/lib/firebase.ts` — auth, db 인스턴스 (Step 3에서 생성)
- `/lib/errors.ts` — mapFirebaseError 함수 (Step 2에서 생성)
- `/lib/validators.ts` — isValidEmail, isValidPassword, isValidNickname (Step 2에서 생성)

## 작업

### 1. `services/auth.ts`

Firebase Auth 래퍼 서비스를 구현한다. 모든 함수는 Result<T>를 반환하며, 절대 throw하지 않는다.

```typescript
import { Result } from '@/types/common';
import { User, SignUpInput } from '@/types/user';

// 이메일+비밀번호 회원가입
// 1. Firebase Auth에 사용자 생성
// 2. Firestore users/{uid} 문서 생성
// 3. Firestore nicknames/{normalizedNickname} 문서 생성 (Transaction으로 유일성 보장)
export async function signUpWithEmail(input: SignUpInput): Promise<Result<User>> { ... }

// 이메일+비밀번호 로그인
export async function signInWithEmail(email: string, password: string): Promise<Result<User>> { ... }

// Google 소셜 로그인
export async function signInWithGoogle(): Promise<Result<User>> { ... }

// Apple 소셜 로그인
export async function signInWithApple(): Promise<Result<User>> { ... }

// 로그아웃
export async function signOut(): Promise<Result<void>> { ... }

// 비밀번호 재설정 이메일 발송
export async function sendPasswordReset(email: string): Promise<Result<void>> { ... }

// 현재 로그인된 사용자 정보 조회 (Firestore에서)
export async function getCurrentUser(uid: string): Promise<Result<User>> { ... }

// 회원 탈퇴 (소프트 삭제)
export async function deleteAccount(uid: string): Promise<Result<void>> { ... }
```

핵심 규칙:
- 모든 함수는 try-catch로 감싸고, catch에서 `mapFirebaseError(error)`로 변환하여 `{ success: false, error }` 반환
- `signUpWithEmail`에서 닉네임 유일성은 Firestore Transaction으로 보장한다 (ARCHITECTURE.md "닉네임 유일성 보장" 패턴 참조)
- Firestore Timestamp ↔ Date 변환은 이 서비스 내에서 처리한다
- Firebase Auth와 Firestore 모두 `lib/firebase.ts`에서 import한 인스턴스를 사용한다

### 2. `services/users.ts`

사용자 프로필 관련 Firestore 래퍼:

```typescript
// 닉네임 변경 (Transaction으로 유일성 보장)
export async function updateNickname(userId: string, oldNickname: string, newNickname: string): Promise<Result<void>> { ... }

// 프로필 업데이트 (닉네임 제외 — 닉네임은 updateNickname으로)
export async function updateProfile(userId: string, data: UserProfileUpdate): Promise<Result<void>> { ... }

// 닉네임 중복 체크 (실시간 입력 중 사용)
export async function checkNicknameAvailable(nickname: string): Promise<Result<boolean>> { ... }
```

## Acceptance Criteria

```bash
npx tsc --noEmit                       # 타입 에러 없음
npx jest __tests__/services/auth.test.ts   # 서비스 테스트 통과 (mock 기반)
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 모든 서비스 함수가 Result<T>를 반환하는가? throw가 없는가?
   - Firebase SDK를 `lib/firebase.ts`에서만 import하는가?
   - mapFirebaseError를 사용하여 에러를 한국어 메시지로 변환하는가?
   - 닉네임 유일성이 Firestore Transaction으로 보장되는가?
3. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 서비스 함수에서 throw하지 마라. 이유: CLAUDE.md CRITICAL 규칙 위반. 반드시 Result<T>로 반환한다.
- 컴포넌트나 훅에서 이 서비스를 직접 호출하는 코드를 작성하지 마라. 이유: Screen → Hook → Service 계층 구조. 훅은 Step 5에서 만든다.
- Google/Apple 소셜 로그인의 네이티브 SDK 설정(google-services.json 등)은 이 step에서 하지 마라. 이유: .env 파일이 없는 상태에서는 설정 불가. 함수 시그니처와 로직만 구현하고, 실제 네이티브 설정은 Firebase 프로젝트 생성 후 별도 처리.
- `__tests__/services/auth.test.ts`에서 Firebase SDK를 mock하여 테스트를 작성하라. 실제 Firebase에 연결하지 마라.
