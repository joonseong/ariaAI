# Step 7: auth-screens

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (화면은 UI 렌더링만. 비즈니스 로직은 hooks/에 분리)
- `/docs/ARCHITECTURE.md` — 디렉토리 구조의 `app/` 폴더 구조, "인증 플로우" 섹션, "화면 전환 규칙" 섹션
- `/docs/PRD.md` — 3-1. 인증 (기본 동작, 에러 케이스, 엣지 케이스), 9. 화면 목록 (Screen Map), 화면 전환 규칙
- `/docs/DESIGN.md` — 색상, 타이포그래피, 버튼 규격, 간격
- `/hooks/useAuth.ts` — useAuth 훅 (Step 5에서 생성)
- `/components/common/Button.tsx` — Button 컴포넌트 (Step 6에서 생성)
- `/components/common/Input.tsx` — Input 컴포넌트 (Step 6에서 생성)
- `/components/common/Toast.tsx` — Toast 시스템 (Step 6에서 생성)
- `/stores/toastStore.ts` — showToast 함수 (Step 6에서 생성)
- `/lib/validators.ts` — isValidEmail, isValidPassword, isValidNickname (Step 2에서 생성)

## 작업

### 1. `app/_layout.tsx` (루트 레이아웃)

앱의 최상위 레이아웃을 구현한다:

```typescript
// 1. global.css import (NativeWind)
// 2. useAuth().initializeAuth()를 useEffect에서 호출
// 3. isLoading이면 스플래시/로딩 화면 표시
// 4. isAuthenticated에 따라 (auth) 또는 (tabs) 그룹으로 라우팅
// 5. <ToastContainer /> 배치 (전역 토스트)
// 6. StatusBar light-content 고정 (다크 모드)
```

Expo Router의 Stack 또는 Slot 기반으로 구현한다:

```typescript
export default function RootLayout() {
  // ARCHITECTURE.md "인증 플로우 — 앱 시작" 참조
  // 1. 앱 시작 → isLoading: true
  // 2. Firebase onAuthStateChanged 확인
  // 3. 토큰 유효 → Firestore에서 유저 정보 로드 → isAuthenticated: true
  // 4. 토큰 없음 → isAuthenticated: false
  // 5. isLoading: false → 적절한 화면으로 이동
}
```

### 2. `app/(auth)/_layout.tsx`

인증 그룹 레이아웃:
- Stack 네비게이션
- 헤더 숨김 또는 최소 스타일
- 배경: bg-primary (#0D0D0D)

### 3. `app/(auth)/login.tsx`

로그인 화면:

```
[Aria 로고/텍스트]

[이메일 Input]
[비밀번호 Input]

[로그인 Button (Primary)]

[비밀번호를 잊으셨나요? (텍스트 링크)]

[구분선: ── 또는 ──]

[Google로 계속하기 Button (Secondary)]
[Apple로 계속하기 Button (Secondary)]

[계정이 없으신가요? 가입하기 (텍스트 링크)]
```

동작:
- useAuth().signIn() 호출
- 성공 → 자동으로 (tabs)로 라우팅 (루트 레이아웃의 isAuthenticated 변경으로)
- 실패 → Input 컴포넌트의 error 프롭으로 에러 메시지 표시
- 로딩 중 → Button의 loading 프롭 활성화

PRD 에러 케이스 반영:
- 미가입 이메일 → "가입되지 않은 이메일입니다"
- 비밀번호 틀림 → "비밀번호가 올바르지 않습니다"
- 5회 실패 → "잠시 후 다시 시도해주세요"
- 네트워크 오류 → "인터넷 연결을 확인해주세요"

### 4. `app/(auth)/signup.tsx`

회원가입 화면:

```
[← 뒤로가기]

[회원가입 제목]

[이메일 Input]
[비밀번호 Input (8자 이상, 영문+숫자)]
[비밀번호 확인 Input]
[닉네임 Input (2~20자, 실시간 중복 체크)]

[가입하기 Button (Primary)]

[이미 계정이 있으신가요? 로그인 (텍스트 링크)]
```

동작:
- 닉네임 입력 중 디바운싱(500ms) 후 실시간 중복 체크 (services/users.ts의 checkNicknameAvailable)
- 중복 시 Input 에러: "이미 사용 중인 닉네임입니다"
- 사용 가능 시 Input 하단: "사용 가능한 닉네임입니다" (success 색상)
- 비밀번호 확인 불일치: "비밀번호가 일치하지 않습니다"
- 클라이언트 검증 통과 후 useAuth().signUp() 호출

### 5. `app/(auth)/forgot-password.tsx`

비밀번호 재설정 화면:

```
[← 뒤로가기]

[비밀번호 재설정 제목]
[설명: 가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다]

[이메일 Input]

[재설정 링크 보내기 Button (Primary)]
```

동작:
- useAuth().resetPassword() 호출
- 성공 → "비밀번호 재설정 링크가 전송되었습니다" 토스트 + 로그인 화면으로 이동
- 실패 → 에러 메시지 표시

### 6. `app/(tabs)/_layout.tsx`

탭 네비게이션 레이아웃:

```typescript
// Expo Router의 Tabs 컴포넌트 사용
// 4개 탭: 홈, 검색, 업로드, 프로필
// DESIGN.md 하단 탭 바 스타일:
//   - 배경: bg-elevated (#262626)
//   - 활성 아이콘: accent-primary (#8B5CF6)
//   - 비활성 아이콘: text-tertiary (#808080)
```

### 7. `app/(tabs)/home/index.tsx` (Placeholder)

홈 피드 화면의 placeholder:

```typescript
// 임시 화면 — "홈 피드 (구현 예정)" 텍스트만 표시
// 실제 구현은 다음 phase에서 진행
```

### 8. 나머지 탭 Placeholder

검색, 업로드, 프로필 탭의 placeholder 화면도 동일하게 생성한다:
- `app/(tabs)/search/index.tsx`
- `app/(tabs)/upload/index.tsx`
- `app/(tabs)/profile/index.tsx`

## Acceptance Criteria

```bash
npx tsc --noEmit                    # 타입 에러 없음
npx expo export --platform web 2>&1 | tail -5  # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 화면 컴포넌트에 Firebase 호출이 없는가? (useAuth 훅만 사용)
   - 화면 컴포넌트에 비즈니스 로직이 없는가? (검증은 validators 사용, 상태는 훅 사용)
   - NativeWind 클래스명으로 스타일링되었는가?
   - DESIGN.md의 색상 토큰과 타이포그래피를 따르는가?
   - Expo Router의 파일 기반 라우팅 컨벤션을 따르는가?
   - 각 화면이 200줄을 넘지 않는가?
3. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 화면 컴포넌트에서 Firebase SDK를 직접 import하지 마라. 이유: CLAUDE.md CRITICAL 규칙 — Screen → Hook → Service → Firebase 계층 위반.
- 화면에서 비즈니스 로직(검증, 에러 변환 등)을 직접 구현하지 마라. 이유: validators와 hooks를 사용해야 한다.
- 홈/검색/업로드/프로필 탭의 실제 기능을 구현하지 마라. 이유: 다음 phase(1-artworks 등)에서 구현한다. 이 step에서는 placeholder만 만든다.
- `StyleSheet.create`를 사용하지 마라. NativeWind 클래스명만 사용한다.
