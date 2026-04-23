# Step 5: auth-store-hook

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (화면은 UI 렌더링만. 비즈니스 로직은 hooks/에 분리)
- `/docs/ARCHITECTURE.md` — "비즈니스 로직 분리" 섹션 (useLike 훅 코드 예제), "상태 관리" 섹션, "인증 플로우" 섹션 (앱 시작 → 토큰 확인 → 자동 로그인)
- `/docs/PRD.md` — 3-1. 인증 (기본 동작, 에러 케이스), 3-12. 온보딩 상태 관리
- `/types/common.ts` — AsyncState<T>, Result<T>
- `/types/user.ts` — User 타입
- `/services/auth.ts` — signUpWithEmail, signInWithEmail, signOut 등 (Step 4에서 생성)
- `/services/users.ts` — updateNickname, updateProfile 등 (Step 4에서 생성)

## 작업

### 1. `stores/authStore.ts`

Zustand 스토어로 인증 상태를 관리한다:

```typescript
import { create } from 'zustand';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;       // 앱 시작 시 토큰 확인 중
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;        // 로그아웃 시 상태 초기화
}

export const useAuthStore = create<AuthState>((set) => ({
  // 구현
}));
```

핵심 규칙:
- 스토어는 순수 상태 관리만 담당. Firebase 호출 없음.
- `isLoading`은 앱 시작 시 자동 로그인 확인 중일 때 true. 스플래시 화면 표시 결정에 사용.

### 2. `hooks/useAuth.ts`

인증 관련 비즈니스 로직을 담당하는 훅:

```typescript
import { useAuthStore } from '@/stores/authStore';
import * as authService from '@/services/auth';
import * as usersService from '@/services/users';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, clear } = useAuthStore();

  // 이메일 회원가입
  const signUp = async (input: SignUpInput): Promise<Result<void>> => { ... };

  // 이메일 로그인
  const signIn = async (email: string, password: string): Promise<Result<void>> => { ... };

  // 로그아웃
  const logout = async (): Promise<void> => { ... };

  // 비밀번호 재설정
  const resetPassword = async (email: string): Promise<Result<void>> => { ... };

  // 앱 시작 시 자동 로그인 확인
  // Firebase Auth의 onAuthStateChanged를 구독하여
  // 토큰이 유효하면 Firestore에서 사용자 정보 로드 → setUser
  // 토큰이 없거나 만료되면 setUser(null)
  const initializeAuth = async (): Promise<void> => { ... };

  // 회원 탈퇴
  const deleteAccount = async (): Promise<Result<void>> => { ... };

  return {
    user,
    isAuthenticated,
    isLoading,
    signUp,
    signIn,
    logout,
    resetPassword,
    initializeAuth,
    deleteAccount,
  };
}
```

핵심 규칙:
- 훅은 서비스를 호출하고, 결과에 따라 스토어를 업데이트한다
- 서비스 호출 결과가 `success: false`이면 에러를 반환하되, 스토어는 변경하지 않는다
- `initializeAuth`는 앱 루트 레이아웃에서 한 번만 호출된다
- onAuthStateChanged 리스너는 useEffect 안에서 구독하고, cleanup에서 해제한다

### 3. `hooks/useDebounce.ts`

검색 등에서 사용할 디바운싱 유틸 훅:

```typescript
export function useDebounce<T>(value: T, delay: number): T { ... }
```

## Acceptance Criteria

```bash
npx tsc --noEmit                          # 타입 에러 없음
npx jest __tests__/hooks/useAuth.test.ts  # 훅 테스트 통과 (service mock 기반)
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 훅에서 Firebase SDK를 직접 import하지 않았는가? (services만 import)
   - Zustand 스토어에 비즈니스 로직이 없는가? (순수 상태 관리만)
   - useAuth 훅이 Result<T>를 반환하는가?
3. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 훅에서 Firebase SDK(`firebase/auth`, `firebase/firestore` 등)를 직접 import하지 마라. 이유: CLAUDE.md CRITICAL 규칙 — 모든 Firebase 호출은 services/ 래퍼를 통해야 한다.
- Zustand 스토어에 async 함수를 넣지 마라. 이유: 스토어는 동기적 상태 관리만 담당. 비동기 로직은 훅에서 처리한다.
- 화면 컴포넌트를 만들지 마라. 이 step에서는 stores/와 hooks/ 파일만 다룬다.
- `__tests__/hooks/useAuth.test.ts`에서 서비스 레이어를 jest.mock으로 대체하여 테스트하라. ARCHITECTURE.md의 "테스트 예제 — 예제 2: 훅 테스트" 패턴을 따른다.
