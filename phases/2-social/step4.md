# Step 4: follow-lists

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — 네비게이션 구조 (artist/[id]/followers.tsx, artist/[id]/following.tsx, profile/followers.tsx, profile/following.tsx)
- `/docs/PRD.md` — 3-6. 팔로우 시스템 (팔로워/팔로잉 목록, 에러 케이스)
- `/services/follows.ts` — getFollowers, getFollowing (Step 0에서 생성)
- `/hooks/useFollow.ts` — 팔로우 훅 (Step 1에서 생성)
- `/components/artist/UserListItem.tsx` — 유저 리스트 아이템 (Step 2에서 생성)
- `/components/artist/FollowButton.tsx` — 팔로우 버튼 (Step 2에서 생성)
- `/components/common/EmptyState.tsx` — 빈 상태
- `/components/common/ErrorState.tsx` — 에러 상태
- `/stores/authStore.ts` — useAuthStore
- `/app/artist/[id].tsx` — 작가 포트폴리오 화면 (Step 3에서 생성)

## 작업

### 1. `hooks/useFollowList.ts`

팔로워/팔로잉 목록 조회 훅:

```typescript
export function useFollowList(userId: string, type: 'followers' | 'following') {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load: () => Promise<void>;
  const loadMore: () => Promise<void>;

  return { users, isLoading, isLoadingMore, hasMore, error, load, loadMore };
}
```

핵심 규칙:
- type에 따라 getFollowers 또는 getFollowing 서비스 호출
- 커서 기반 페이지네이션
- 로딩 중 중복 요청 방지

### 2. `app/artist/[id]/followers.tsx`

특정 작가의 팔로워 목록 화면:

```typescript
export default function FollowersScreen(): JSX.Element;
```

구현 내용:
- useFollowList(artistId, 'followers') 사용
- FlatList + UserListItem으로 목록 렌더링
- 각 UserListItem에 FollowButton 표시 (본인 제외)
- 무한 스크롤

### 3. `app/artist/[id]/following.tsx`

특정 작가의 팔로잉 목록 화면:

```typescript
export default function FollowingScreen(): JSX.Element;
```

구현 내용:
- useFollowList(artistId, 'following') 사용
- 구조는 followers.tsx와 동일

### 4. `app/profile/followers.tsx`

내 팔로워 목록 화면:

```typescript
export default function MyFollowersScreen(): JSX.Element;
```

구현 내용:
- useAuthStore에서 현재 사용자 ID 가져와서 useFollowList(myId, 'followers') 사용
- 나머지는 artist/[id]/followers.tsx와 동일

### 5. `app/profile/following.tsx`

내 팔로잉 목록 화면:

```typescript
export default function MyFollowingScreen(): JSX.Element;
```

구현 내용:
- useAuthStore에서 현재 사용자 ID 가져와서 useFollowList(myId, 'following') 사용

핵심 규칙 (모든 화면 공통):
- 빈 상태: "아직 팔로워가 없습니다" / "아직 팔로우하는 작가가 없습니다"
- 에러 상태: ErrorState + 재시도 버튼
- 화면 제목: "팔로워" 또는 "팔로잉" (헤더 타이틀)

## Acceptance Criteria

```bash
npx tsc --noEmit                               # 타입 에러 없음
npx expo export                                # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - 화면에서 Firebase SDK 직접 import 없는가?
   - 비즈니스 로직이 훅에 분리되어 있는가?
   - 4개 화면 간 중복 코드가 최소화되었는가?
3. 결과에 따라 `phases/2-social/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 화면에서 Firebase SDK를 직접 import하지 마라.
- 기존 훅, 컴포넌트, 서비스를 수정하지 마라.
- 작가 포트폴리오 화면(artist/[id].tsx)을 수정하지 마라.
