# Step 1: core-types

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (Result<T> 패턴 필수)
- `/docs/ARCHITECTURE.md` — "비즈니스 로직 분리" 섹션의 Result<T> 타입 정의, AsyncState<T> 패턴
- `/docs/PRD.md` — 데이터 모델 섹션 (## 8. 데이터 모델): users, artworks, likes, follows, guestbooks, reports, bookmarks, notifications, analytics 컬렉션 구조
- `/types/` — Step 0에서 생성된 빈 디렉토리 확인

## 작업

`types/` 폴더에 아래 파일들을 생성한다. 모든 타입은 PRD 데이터 모델과 ARCHITECTURE.md의 패턴을 정확히 반영해야 한다.

### 1. `types/common.ts`

프로젝트 전역에서 사용하는 유틸리티 타입을 정의한다:

```typescript
// Result<T> — 서비스 레이어의 반환 타입. 절대 throw하지 않고 이 타입으로 성공/실패를 반환한다.
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

export interface AppError {
  code: string;
  message: string;  // 사용자에게 표시할 한국어 메시지
}

// AsyncState<T> — 훅에서 데이터 로딩 상태를 표현하는 타입
export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: AppError | null;
}

// PaginatedResult<T> — 무한 스크롤용 페이지네이션 결과
export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  lastCursor: unknown | null;  // Firestore DocumentSnapshot
}
```

### 2. `types/user.ts`

PRD의 users 컬렉션 구조를 TypeScript 인터페이스로 변환한다:

```typescript
export interface User {
  id: string;
  email: string;
  nickname: string;
  normalizedNickname: string;
  bio: string;
  profileImageUrl: string | null;
  followersCount: number;
  followingCount: number;
  artworksCount: number;
  bookmarksCount: number;
  loginProvider: 'email' | 'google' | 'apple';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 프로필 수정 시 사용하는 부분 타입
export interface UserProfileUpdate { ... }

// 회원가입 시 사용하는 입력 타입
export interface SignUpInput { ... }
```

필드명과 타입은 PRD 데이터 모델을 정확히 따른다.

### 3. `types/artwork.ts`

PRD의 artworks 컬렉션 구조 기반:

```typescript
export interface Artwork {
  id: string;
  authorId: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  title: string;
  description: string;
  imageUrls: string[];
  thumbnailUrl: string;
  tags: string[];
  tool: string;
  likesCount: number;
  reportCount: number;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 작품 등록 시 사용하는 폼 데이터 타입
export interface ArtworkFormData { ... }

// 작품 수정 시 사용하는 부분 타입 (이미지 변경 불가)
export interface ArtworkUpdateData { ... }
```

### 4. `types/guestbook.ts`

```typescript
export interface GuestbookMessage {
  id: string;
  authorId: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  content: string;
  replyContent: string | null;
  replyCreatedAt: Date | null;
  createdAt: Date;
}
```

### 5. `types/report.ts`

```typescript
export type ReportTargetType = 'artwork' | 'guestbook' | 'user';
export type ReportReason = 'spam' | 'offensive' | 'copyright' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report { ... }
export interface ReportInput { ... }
```

### 6. `types/notification.ts`

```typescript
export type NotificationType = 'content_hidden' | 'content_restored';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  targetType: 'artwork' | null;
  targetId: string | null;
  isRead: boolean;
  createdAt: Date;
}
```

### 7. `types/navigation.ts`

Expo Router의 라우트 파라미터 타입을 정의한다:

```typescript
export type RootStackParamList = {
  '(auth)/login': undefined;
  '(auth)/signup': undefined;
  '(auth)/forgot-password': undefined;
  '(tabs)/home': undefined;
  'artwork/[id]': { id: string };
  'artwork/[id]/edit': { id: string };
  'artist/[id]': { id: string };
  // ... PRD 화면 목록 기반으로 모든 라우트 정의
};
```

## Acceptance Criteria

```bash
npx tsc --noEmit   # 타입 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 모든 타입이 PRD 데이터 모델과 1:1 매핑되는가?
   - Result<T> 타입이 ARCHITECTURE.md 정의와 일치하는가?
   - `types/` 폴더에만 파일을 생성했는가?
3. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 타입 파일에 로직(함수, 클래스)을 넣지 마라. 순수 타입/인터페이스 정의만 포함한다.
- Firestore 관련 타입(Timestamp 등)을 import하지 마라. Date로 통일한다. Firestore ↔ Date 변환은 서비스 레이어에서 처리한다.
- PRD 데이터 모델에 없는 필드를 임의로 추가하지 마라.
