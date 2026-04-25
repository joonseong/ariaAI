# Step 0: social-services

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (서비스에서 throw 금지, Result<T> 반환)
- `/docs/ARCHITECTURE.md` — "비즈니스 로직 분리" 섹션, "디렉토리 구조" (services/follows.ts, services/bookmarks.ts, services/guestbooks.ts)
- `/docs/PRD.md` — 3-5. 작가 포트폴리오 (방명록 규칙), 3-6. 팔로우 시스템 (낙관적 업데이트, Transaction), 3-7-1. 저장/북마크
- `/types/common.ts` — Result<T>, PaginatedResult<T>
- `/types/user.ts` — User 타입
- `/types/guestbook.ts` — GuestbookMessage 타입
- `/lib/firebase.ts` — db 인스턴스
- `/lib/errors.ts` — mapFirebaseError
- `/services/auth.ts` — 기존 서비스 패턴 참조
- `/services/likes.ts` — toggleLike Transaction 패턴 참조
- `/services/artworks.ts` — 페이지네이션 패턴 참조

## 작업

### 1. `services/follows.ts`

팔로우 시스템 서비스:

```typescript
// 팔로우 토글 — Transaction으로 follows 문서 생성/삭제 + followersCount/followingCount 증감
// follows/{followerId}_{followingId} 문서 구조
export async function toggleFollow(
  followerId: string,
  followingId: string
): Promise<Result<{ following: boolean }>> { ... }

// 팔로우 여부 확인
export async function checkFollowing(
  followerId: string,
  followingId: string
): Promise<Result<boolean>> { ... }

// 팔로워 목록 조회 — 커서 기반 페이지네이션
export async function getFollowers(
  userId: string,
  cursor?: Date,
  limit?: number
): Promise<Result<PaginatedResult<User>>> { ... }

// 팔로잉 목록 조회 — 커서 기반 페이지네이션
export async function getFollowing(
  userId: string,
  cursor?: Date,
  limit?: number
): Promise<Result<PaginatedResult<User>>> { ... }
```

핵심 규칙:
- toggleFollow는 Transaction 사용. followersCount/followingCount를 원자적으로 증감
- 음수 방지: `Math.max(0, current - 1)` 패턴
- 자기 자신 팔로우 방지 (followerId === followingId이면 에러 반환)

### 2. `services/bookmarks.ts`

저장/북마크 서비스:

```typescript
// 북마크 토글 — bookmarks/{userId}_{artworkId} 문서
export async function toggleBookmark(
  userId: string,
  artworkId: string
): Promise<Result<{ bookmarked: boolean }>> { ... }

// 북마크 여부 확인
export async function checkBookmarked(
  userId: string,
  artworkId: string
): Promise<Result<boolean>> { ... }

// 저장한 작품 목록 조회
export async function getBookmarkedArtworks(
  userId: string,
  cursor?: Date,
  limit?: number
): Promise<Result<PaginatedResult<Artwork>>> { ... }
```

### 3. `services/guestbooks.ts`

방명록 서비스:

```typescript
// 방명록 메시지 작성
export async function createGuestbookMessage(
  artistId: string,
  authorId: string,
  authorNickname: string,
  content: string
): Promise<Result<string>> { ... }

// 답글 작성 (작가 본인만)
export async function createReply(
  messageId: string,
  artistId: string,
  content: string
): Promise<Result<void>> { ... }

// 메시지 삭제 (작성자 또는 포트폴리오 주인)
export async function deleteGuestbookMessage(
  messageId: string,
  requesterId: string,
  artistId: string
): Promise<Result<void>> { ... }

// 방명록 목록 조회 — 최신순, 커서 기반 페이지네이션
export async function getGuestbookMessages(
  artistId: string,
  cursor?: Date,
  limit?: number
): Promise<Result<PaginatedResult<GuestbookMessage>>> { ... }
```

핵심 규칙:
- guestbooks/{artistId}/messages/{messageId} 서브컬렉션 구조
- 답글은 메시지 문서의 reply 필드에 저장 (1 depth만)
- 삭제 권한: 메시지 작성자 또는 포트폴리오 주인(artistId)
- 스팸 방지: 서비스에서는 구현하지 않음 (훅에서 클라이언트 쿨다운 처리)

### 4. `services/users.ts` 확장

기존 users.ts에 프로필 조회 함수 추가:

```typescript
// 사용자 공개 프로필 조회 (포트폴리오용)
export async function getUserProfile(userId: string): Promise<Result<User>> { ... }
```

## Acceptance Criteria

```bash
npx tsc --noEmit                                # 타입 에러 없음
npx jest __tests__/services/follows.test.ts     # 팔로우 테스트 통과
npx jest __tests__/services/bookmarks.test.ts   # 북마크 테스트 통과
npx jest __tests__/services/guestbooks.test.ts  # 방명록 테스트 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 모든 서비스 함수가 Result<T>를 반환하는가?
   - Firebase SDK를 lib/firebase.ts에서만 import하는가?
   - toggleFollow에서 Transaction을 사용하는가?
   - 음수 방지 로직이 있는가?
3. 결과에 따라 `phases/2-social/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 서비스 함수에서 throw하지 마라. Result<T>로 반환한다.
- 컴포넌트나 훅 코드를 작성하지 마라.
- 기존 services/auth.ts, services/artworks.ts, services/likes.ts, services/storage.ts를 수정하지 마라.
- services/users.ts는 getUserProfile 함수만 추가. 기존 함수를 수정하지 마라.
