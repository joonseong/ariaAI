# Step 5: liked-saved

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — 네비게이션 구조 (profile/liked.tsx)
- `/docs/PRD.md` — 3-7. 좋아요 ("좋아요한 작품" 모아보기, 에러 케이스), 3-7-1. 저장/북마크 ("저장한 작품" 목록, 에러 케이스)
- `/services/likes.ts` — getLikedArtworks (1-artworks에서 생성)
- `/services/bookmarks.ts` — getBookmarkedArtworks (Step 0에서 생성)
- `/components/artwork/ArtworkGrid.tsx` — 작품 그리드 (Step 2에서 생성)
- `/components/common/EmptyState.tsx` — 빈 상태
- `/components/common/ErrorState.tsx` — 에러 상태
- `/stores/authStore.ts` — useAuthStore
- `/app/artist/[id].tsx` — 작가 포트폴리오 화면 패턴 참조 (Step 3에서 생성)

## 작업

### 1. `hooks/useLikedArtworks.ts`

좋아요한 작품 목록 훅:

```typescript
export function useLikedArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const load: () => Promise<void>;
  const loadMore: () => Promise<void>;

  return { artworks, isLoading, isLoadingMore, hasMore, load, loadMore };
}
```

핵심 규칙:
- useAuthStore에서 현재 사용자 ID 사용
- getLikedArtworks 서비스 호출
- 커서 기반 페이지네이션

### 2. `hooks/useSavedArtworks.ts`

저장한 작품 목록 훅:

```typescript
export function useSavedArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const load: () => Promise<void>;
  const loadMore: () => Promise<void>;

  return { artworks, isLoading, isLoadingMore, hasMore, load, loadMore };
}
```

핵심 규칙:
- useAuthStore에서 현재 사용자 ID 사용
- getBookmarkedArtworks 서비스 호출
- 커서 기반 페이지네이션

### 3. `app/profile/liked.tsx`

좋아요한 작품 목록 화면:

```typescript
export default function LikedArtworksScreen(): JSX.Element;
```

구현 내용:
- useLikedArtworks 훅으로 데이터 로딩
- ArtworkGrid로 3열 그리드 표시
- 작품 탭 시 artwork/[id]로 이동
- 무한 스크롤

핵심 규칙:
- 빈 상태: "아직 좋아요한 작품이 없습니다" + "홈 피드 둘러보기" 버튼
- 에러 상태: ErrorState + 재시도 버튼

### 4. `app/profile/saved.tsx`

저장한 작품 목록 화면:

```typescript
export default function SavedArtworksScreen(): JSX.Element;
```

구현 내용:
- useSavedArtworks 훅으로 데이터 로딩
- ArtworkGrid로 3열 그리드 표시
- 구조는 liked.tsx와 동일

핵심 규칙:
- 빈 상태: "아직 저장한 작품이 없습니다" + "홈 피드 둘러보기" 버튼

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
   - 두 화면 간 중복 코드가 최소화되었는가?
3. 결과에 따라 `phases/2-social/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 화면에서 Firebase SDK를 직접 import하지 마라.
- 기존 훅, 컴포넌트, 서비스를 수정하지 마라.
- 프로필 메인 화면(profile.tsx)을 수정하지 마라 — 이 화면에서 liked/saved로 이동하는 링크는 향후 phase에서 추가.
