# Step 1: social-hooks

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — "비즈니스 로직 분리" 섹션, useLike 훅 패턴 참조
- `/docs/PRD.md` — 3-5. 작가 포트폴리오, 3-6. 팔로우 (낙관적 업데이트+롤백, 디바운싱 300ms), 3-7-1. 저장/북마크 (낙관적 업데이트), 3-5. 방명록 (스팸 방지 쿨다운)
- `/services/follows.ts` — toggleFollow, checkFollowing, getFollowers, getFollowing (Step 0에서 생성)
- `/services/bookmarks.ts` — toggleBookmark, checkBookmarked, getBookmarkedArtworks (Step 0에서 생성)
- `/services/guestbooks.ts` — CRUD (Step 0에서 생성)
- `/services/users.ts` — getUserProfile (Step 0에서 확장)
- `/hooks/useLike.ts` — 낙관적 업데이트 패턴 참조 (1-artworks에서 생성)
- `/hooks/useDebounce.ts` — 디바운싱 훅
- `/stores/authStore.ts` — useAuthStore

## 작업

### 1. `hooks/useFollow.ts`

팔로우 토글 훅 — useLike 패턴과 동일한 낙관적 업데이트:

```typescript
export function useFollow(targetUserId: string, initialFollowing: boolean, initialFollowersCount: number) {
  // 낙관적 업데이트 + 롤백
  // pendingRef로 중복 요청 방지
  // 비회원이면 toggle 무시
  return { following, followersCount, toggle };
}
```

### 2. `hooks/useBookmark.ts`

저장/북마크 토글 훅:

```typescript
export function useBookmark(artworkId: string, initialBookmarked: boolean) {
  // 낙관적 업데이트 + 롤백
  return { bookmarked, toggle };
}
```

### 3. `hooks/useGuestbook.ts`

방명록 CRUD 훅:

```typescript
export function useGuestbook(artistId: string) {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMessages: () => Promise<void>;
  const loadMore: () => Promise<void>;
  const sendMessage: (content: string) => Promise<Result<void>>;
  const sendReply: (messageId: string, content: string) => Promise<Result<void>>;
  const deleteMessage: (messageId: string) => Promise<Result<void>>;

  return { messages, isLoading, isLoadingMore, hasMore, loadMessages, loadMore, sendMessage, sendReply, deleteMessage };
}
```

핵심 규칙:
- 스팸 방지: lastSentRef로 마지막 전송 시간 추적. 동일 작가에게 1분 내 3회 이상 작성 시 에러 반환
- 삭제 후 로컬 상태에서 즉시 제거 (낙관적 삭제)

### 4. `hooks/useArtistProfile.ts`

작가 포트폴리오 데이터 훅:

```typescript
export function useArtistProfile(artistId: string) {
  const [artist, setArtist] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load: () => Promise<void>;
  const loadMoreArtworks: () => Promise<void>;
  const refresh: () => Promise<void>;

  return { artist, artworks, isLoading, error, hasMoreArtworks, isLoadingMoreArtworks, load, loadMoreArtworks, refresh };
}
```

## Acceptance Criteria

```bash
npx tsc --noEmit                               # 타입 에러 없음
npx jest __tests__/hooks/useFollow.test.ts     # 팔로우 훅 테스트
npx jest __tests__/hooks/useGuestbook.test.ts  # 방명록 훅 테스트
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - 훅에서 Firebase SDK 직접 import 없는가?
   - Zustand 스토어에 async 함수 없는가?
   - 낙관적 업데이트 + 롤백이 구현되었는가?
3. 결과에 따라 `phases/2-social/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 훅에서 Firebase SDK를 직접 import하지 마라.
- 화면 컴포넌트를 만들지 마라. hooks/ 파일만 다룬다.
- 기존 hooks (useAuth, useLike, useArtworks 등)를 수정하지 마라.
