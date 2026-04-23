# Step 2: lib-core

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (에러는 lib/errors.ts의 mapFirebaseError()로 변환)
- `/docs/ARCHITECTURE.md` — "상수 정의 (lib/constants.ts)" 섹션, "에러 처리 전략" 섹션 (mapFirebaseError 코드), "UX 인프라 패턴" 섹션 (햅틱 피드백)
- `/docs/DESIGN.md` — 색상 팔레트, 타이포그래피 값
- `/docs/PRD.md` — 입력 검증 규칙 테이블 (3-1, 3-4, 3-5 등), 상대 시간 포맷 규칙 (4-6), 숫자 축약 규칙 (4-7)
- `/types/common.ts` — AppError 타입 (Step 1에서 생성)

## 작업

`lib/` 폴더에 유틸리티 모듈을 생성한다.

### 1. `lib/constants.ts`

ARCHITECTURE.md의 "상수 정의" 섹션을 그대로 구현한다:

```typescript
export const COLORS = {
  bg: { primary: '#0D0D0D', surface: '#1A1A1A', elevated: '#262626' },
  text: { primary: '#F5F5F5', secondary: '#A3A3A3', tertiary: '#808080' },
  accent: { primary: '#8B5CF6', primaryHover: '#7C3AED', heart: '#EF4444' },
  semantic: { error: '#EF4444', success: '#22C55E', warning: '#F59E0B', border: '#2A2A2A' },
} as const;

export const LIMITS = {
  NICKNAME_MIN: 2,
  NICKNAME_MAX: 20,
  BIO_MAX: 150,
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 2000,
  TAGS_MAX: 10,
  IMAGES_MAX: 5,
  IMAGE_SIZE_MB: 10,
  FEED_PAGE_SIZE: 20,
  GUESTBOOK_PAGE_SIZE: 20,
} as const;
```

### 2. `lib/errors.ts`

ARCHITECTURE.md의 에러 처리 전략 섹션을 구현한다:

```typescript
import { AppError } from '@/types/common';

// Firebase 에러 코드 → 한국어 사용자 메시지 매핑
// ARCHITECTURE.md의 ERROR_MESSAGES 맵을 그대로 구현
export function mapFirebaseError(error: unknown): AppError { ... }
```

핵심 규칙:
- Firebase 에러 코드(auth/email-already-in-use, auth/wrong-password 등)를 한국어 메시지로 변환
- 매핑되지 않는 에러는 "알 수 없는 오류가 발생했습니다" 기본 메시지 반환
- 이 함수는 절대 throw하지 않는다

### 3. `lib/validators.ts`

PRD의 입력 검증 규칙 테이블들을 함수로 구현한다:

```typescript
export function isValidEmail(email: string): boolean { ... }
export function isValidPassword(password: string): boolean { ... }  // 8자 이상, 영문+숫자 포함
export function isValidNickname(nickname: string): boolean { ... }  // 2~20자, 특수문자 제외
export function isValidBio(bio: string): boolean { ... }           // 최대 150자
export function isValidTitle(title: string): boolean { ... }       // 1~100자
export function isValidDescription(desc: string): boolean { ... }  // 최대 2000자
export function isValidTag(tag: string): boolean { ... }           // 1~30자
export function isValidTags(tags: string[]): boolean { ... }       // 최대 10개
export function isValidGuestbookContent(content: string): boolean { ... }  // 1~200자
export function isValidReportDescription(desc: string): boolean { ... }    // 최대 500자
```

검증 규칙은 PRD 각 기능의 "입력 검증 규칙" 테이블과 정확히 일치해야 한다.

### 4. `lib/formatters.ts`

PRD의 상대 시간 포맷 규칙(4-6)과 숫자 축약 규칙(4-7)을 구현한다:

```typescript
// 상대 시간: "방금 전", "5분 전", "3시간 전", "2일 전", "2025.03.15"
export function formatRelativeTime(date: Date): string { ... }

// 숫자 축약: 999 → "999", 1000 → "1K", 12500 → "1.2만"
export function formatCount(count: number): string { ... }
```

### 5. `lib/haptics.ts`

ARCHITECTURE.md의 햅틱 피드백 섹션을 구현한다:

```typescript
import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  selection: () => Haptics.selectionAsync(),
};
```

### 6. `lib/image.ts`

이미지 리사이징/압축 유틸리티:

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

// 이미지 리사이징 (최대 너비 2048px)
export async function resizeImage(uri: string, maxWidth?: number): Promise<string> { ... }

// 이미지 압축 (quality 0~1)
export async function compressImage(uri: string, quality?: number): Promise<string> { ... }

// 이미지 파일 크기 검증 (LIMITS.IMAGE_SIZE_MB 이하)
export async function validateImageSize(uri: string): Promise<boolean> { ... }
```

## Acceptance Criteria

```bash
npx tsc --noEmit                    # 타입 에러 없음
npx jest __tests__/lib/             # lib 테스트 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - constants.ts의 색상값이 DESIGN.md와 정확히 일치하는가?
   - constants.ts의 LIMITS가 ARCHITECTURE.md Security Rules의 값과 일치하는가?
   - validators.ts의 규칙이 PRD 입력 검증 테이블과 일치하는가?
   - mapFirebaseError가 절대 throw하지 않고 AppError를 반환하는가?
3. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다.

## 금지사항

- Firebase SDK를 import하지 마라. `lib/errors.ts`의 mapFirebaseError는 Firebase 에러 객체를 `unknown`으로 받아 코드 문자열로 판별한다. Firebase 타입에 직접 의존하지 않는다.
- 컴포넌트나 화면 파일을 만들지 마라. `lib/` 폴더의 유틸리티만 다룬다.
- 각 유틸리티 함수에 대응하는 단위 테스트를 `__tests__/lib/` 폴더에 반드시 작성하라. TDD 원칙에 따라 테스트를 먼저 작성하고 구현한다.
