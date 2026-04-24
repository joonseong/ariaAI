# Step 1: artwork-hooks

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (화면은 UI만, 비즈니스 로직은 hooks/에 분리)
- `/docs/ARCHITECTURE.md` — "비즈니스 로직 분리" 섹션 (useLike 훅 코드 예제), "상태 관리" 섹션
- `/docs/PRD.md` — 3-2. 홈 피드 (알고리즘, 페이지네이션), 3-3. 작품 상세, 3-4. 작품 등록 (업로드 플로우, 입력 검증, discard guard), 3-7. 좋아요 (낙관적 업데이트, 디바운싱 300ms)
- `/types/artwork.ts` — Artwork, ArtworkFormData 타입
- `/types/common.ts` — Result<T>, AsyncState<T>, PaginatedResult<T>
- `/services/artworks.ts` — createArtwork, getFeedArtworks, getArtwork 등 (Step 0에서 생성)
- `/services/likes.ts` — toggleLike, checkLiked (Step 0에서 생성)
- `/services/storage.ts` — uploadImages (Step 0에서 생성)
- `/stores/authStore.ts` — useAuthStore (0-foundation에서 생성)
- `/hooks/useAuth.ts` — 기존 훅 패턴 참조
- `/hooks/useDebounce.ts` — 디바운싱 훅 (0-foundation에서 생성)
- `/lib/validators.ts` — 입력 검증 함수
- `/lib/constants.ts` — LIMITS (IMAGES_MAX, TITLE_MAX 등)

## 작업

### 1. `stores/feedStore.ts`

피드 상태를 관리하는 Zustand 스토어:

```typescript
import { create } from 'zustand';
import { Artwork } from '@/types/artwork';

interface FeedState {
  artworks: Artwork[];
  cursor: Date | null;       // 다음 페이지 커서
  hasMore: boolean;          // 추가 데이터 존재 여부
  isLoading: boolean;        // 초기 로딩 중
  isLoadingMore: boolean;    // 추가 로딩 중
  isRefreshing: boolean;     // pull-to-refresh 중
  error: string | null;
  setArtworks: (artworks: Artwork[]) => void;
  appendArtworks: (artworks: Artwork[], cursor: Date | null, hasMore: boolean) => void;
  reset: () => void;
  // 낙관적 업데이트: 특정 작품의 좋아요 상태 변경
  updateArtworkLike: (artworkId: string, liked: boolean, likesCount: number) => void;
  // 작품 삭제 시 피드에서 제거
  removeArtwork: (artworkId: string) => void;
}
```

핵심 규칙:
- 스토어는 순수 상태 관리만. async 함수 없음.
- 중복 작품 방지: appendArtworks에서 artworkId 기반 중복 제거

### 2. `hooks/useArtworks.ts`

홈 피드 데이터 관리 훅:

```typescript
export function useArtworks() {
  const store = useFeedStore();
  const { user } = useAuthStore();

  // 초기 로딩 (마운트 시 호출)
  const loadFeed: () => Promise<void>;

  // 추가 로딩 (무한 스크롤)
  const loadMore: () => Promise<void>;

  // Pull-to-refresh
  const refresh: () => Promise<void>;

  return {
    artworks: store.artworks,
    isLoading: store.isLoading,
    isLoadingMore: store.isLoadingMore,
    isRefreshing: store.isRefreshing,
    hasMore: store.hasMore,
    error: store.error,
    loadFeed,
    loadMore,
    refresh,
  };
}
```

### 3. `hooks/useArtworkDetail.ts`

단일 작품 조회 훅:

```typescript
export function useArtworkDetail(artworkId: string) {
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 마운트 시 작품 데이터 로드
  const load: () => Promise<void>;

  // 새로고침
  const refresh: () => Promise<void>;

  return { artwork, isLoading, error, refresh };
}
```

### 4. `hooks/useLike.ts`

좋아요 토글 훅 — ARCHITECTURE.md의 useLike 코드 예제를 정확히 따른다:

```typescript
export function useLike(artworkId: string, initialLiked: boolean, initialCount: number) {
  // 낙관적 업데이트 + 롤백
  // pendingRef로 중복 요청 방지
  // feedStore.updateArtworkLike()로 피드 상태도 동기화
  // 비회원(user === null)이면 toggle 무시 (UI에서 LoginPromptSheet로 처리)

  return { liked, count, toggle };
}
```

### 5. `hooks/useImagePicker.ts`

이미지 선택 + 검증 + 리사이징 훅:

```typescript
export function useImagePicker(maxImages: number = LIMITS.IMAGES_MAX) {
  const [images, setImages] = useState<SelectedImage[]>([]);

  // 갤러리에서 이미지 선택 (expo-image-picker)
  const pickImages: () => Promise<void>;

  // 특정 이미지 제거
  const removeImage: (index: number) => void;

  // 이미지 순서 변경
  const reorderImages: (fromIndex: number, toIndex: number) => void;

  return { images, pickImages, removeImage, reorderImages, canAddMore: images.length < maxImages };
}

interface SelectedImage {
  uri: string;
  width: number;
  height: number;
}
```

핵심 규칙:
- expo-image-picker의 launchImageLibraryAsync 사용 (allowsMultipleSelection: true)
- 선택 후 검증: 이미지 크기 10MB 이하, 형식 JPEG/PNG/WebP, 최소 해상도 300x300
- 검증 실패 시 showToast로 에러 메시지 표시
- lib/image.ts의 리사이징 유틸 사용 (긴 변 기준 최대 2048px)

### 6. `hooks/useDiscardGuard.ts`

작성 중 이탈 방지 훅:

```typescript
// ARCHITECTURE.md "useDiscardGuard" 섹션 참조
export function useDiscardGuard(isDirty: boolean) {
  // Expo Router의 useNavigation + beforeRemove 이벤트 리스너
  // isDirty가 true일 때 뒤로가기/탭 전환 시 확인 다이얼로그
  // "작성 중인 내용이 있습니다. 나가시겠습니까?" (나가기/계속 작성)
}
```

## Acceptance Criteria

```bash
npx tsc --noEmit                             # 타입 에러 없음
npx jest __tests__/hooks/useLike.test.ts     # 좋아요 훅 테스트 통과
npx jest __tests__/hooks/useArtworks.test.ts # 피드 훅 테스트 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 훅에서 Firebase SDK를 직접 import하지 않았는가? (services만 import)
   - Zustand 스토어에 비즈니스 로직이 없는가? (순수 상태 관리만)
   - useLike에 낙관적 업데이트 + 롤백이 구현되었는가?
   - useImagePicker에서 PRD 3-4의 입력 검증 규칙을 따르는가?
3. 결과에 따라 `phases/1-artworks/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 훅에서 Firebase SDK를 직접 import하지 마라. 이유: CLAUDE.md CRITICAL 규칙.
- Zustand 스토어에 async 함수를 넣지 마라. 이유: 비동기 로직은 훅에서 처리.
- 화면 컴포넌트를 만들지 마라. 이 step에서는 stores/와 hooks/ 파일만 다룬다.
- 기존 stores/authStore.ts, hooks/useAuth.ts를 수정하지 마라.
