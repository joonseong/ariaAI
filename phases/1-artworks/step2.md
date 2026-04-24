# Step 2: artwork-components

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — 디렉토리 구조의 `components/artwork/`, `components/feed/`, `components/common/` 구조
- `/docs/DESIGN.md` — 색상 팔레트, 타이포그래피, 카드 규격, 버튼 규격, 간격
- `/docs/PRD.md` — 3-2. 홈 피드 (카드 레이아웃), 5-1. 피드 카드 인터랙션 (탭, 좋아요, 저장), 5-3. 햅틱 (좋아요 하트 바운스 impactLight), 비회원 접근 불가 항목
- `/components/common/Button.tsx` — 기존 컴포넌트 패턴 참조 (NativeWind 스타일링)
- `/components/common/Skeleton.tsx` — 스켈레톤 컴포넌트 참조
- `/components/common/EmptyState.tsx` — 빈 상태 컴포넌트 참조
- `/components/common/ErrorState.tsx` — 에러 상태 컴포넌트 참조
- `/types/artwork.ts` — Artwork 타입
- `/lib/constants.ts` — COLORS, LIMITS
- `/lib/formatters.ts` — formatRelativeTime, formatCount
- `/lib/haptics.ts` — haptics 유틸
- `/tailwind.config.js` — 커스텀 색상 클래스

## 작업

`components/artwork/`, `components/feed/`, `components/common/` 폴더에 UI 컴포넌트를 생성한다. 모든 컴포넌트는 NativeWind로 스타일링한다.

### 1. `components/artwork/ArtworkCard.tsx`

피드에서 사용하는 작품 카드:

```typescript
interface ArtworkCardProps {
  artwork: Artwork;
  onPress: () => void;           // 카드 탭 → 작품 상세로 이동
  onLikePress: () => void;       // 좋아요 버튼 탭
  onArtistPress: () => void;     // 작가 영역 탭 → 포트폴리오로 이동
  liked: boolean;
  isAuthenticated: boolean;      // 비회원이면 좋아요 시 로그인 유도
}
```

레이아웃 (PRD 3-2 참조):
- 썸네일 이미지 (4:3 비율, expo-image 사용, blurhash placeholder)
- 하단: 작가 아바타(24px) + 닉네임 | 좋아요 하트 + 수
- 제목 (1줄, 최대 20자 말줄임)
- 등록 시간 (상대 표기: formatRelativeTime 사용)

### 2. `components/artwork/LikeButton.tsx`

좋아요 하트 버튼:

```typescript
interface LikeButtonProps {
  active: boolean;
  count: number;
  onPress: () => void;
  size?: 'small' | 'large';  // small: 피드 카드용, large: 작품 상세용
}
```

- active 시: 빨간 하트 (accent-heart #EF4444) + 바운스 애니메이션
- inactive 시: 투명 하트 (border만)
- 탭 시 haptics.impactLight() 호출
- count는 formatCount로 포맷 (1000 → 1K)

### 3. `components/artwork/TagChip.tsx`

도구 태그 칩:

```typescript
interface TagChipProps {
  label: string;
  onPress?: () => void;       // 탭 가능 여부 (선택적)
  selected?: boolean;          // 선택 상태 (업로드 화면용)
  removable?: boolean;         // X 버튼 표시 (업로드 화면용)
  onRemove?: () => void;
}
```

- bg-elevated 배경, 라운드 16px, 패딩 horizontal 12px vertical 6px
- selected 시: bg-accent-primary 배경

### 4. `components/feed/FeedList.tsx`

무한 스크롤 FlatList 래퍼:

```typescript
interface FeedListProps {
  artworks: Artwork[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onRefresh: () => void;
  onRetry: () => void;
  onArtworkPress: (artwork: Artwork) => void;
  onArtistPress: (userId: string) => void;
  onLikePress: (artworkId: string) => void;
  likedArtworkIds: Set<string>;
  isAuthenticated: boolean;
}
```

- FlatList 기반, onEndReached로 무한 스크롤
- RefreshControl로 pull-to-refresh
- 초기 로딩: FeedSkeleton 표시
- 추가 로딩: 하단 ActivityIndicator
- 에러: ErrorState 컴포넌트 표시
- 빈 피드: EmptyState 표시
- artworkId 기반 keyExtractor

### 5. `components/feed/FeedSkeleton.tsx`

피드 로딩 시 스켈레톤:

```typescript
// 카드 3개 분량의 스켈레톤 표시
// 기존 Skeleton 컴포넌트를 조합하여 카드 레이아웃 구성
export function FeedSkeleton(): JSX.Element { ... }
```

### 6. `components/common/Avatar.tsx`

사용자 아바타:

```typescript
interface AvatarProps {
  uri: string | null;
  size?: number;              // 기본 40px
  fallbackText?: string;      // 이미지 없을 때 이니셜 표시
}
```

- 원형, expo-image 사용
- uri가 null이면 bg-elevated 배경에 이니셜 텍스트

### 7. `components/common/LoginPromptSheet.tsx`

비회원 로그인 유도 바텀시트:

```typescript
interface LoginPromptSheetProps {
  visible: boolean;
  onClose: () => void;
  message?: string;           // "좋아요를 누르려면 로그인이 필요합니다" 등
}
```

- 하단에서 올라오는 모달 (React Native Modal 또는 커스텀)
- "가입하면 좋아하는 작가의 새 작품을 가장 먼저 만나보세요" 문구
- 로그인 버튼 + 가입 버튼 (router.push로 이동)
- 닫기 (X 또는 배경 탭)

## Acceptance Criteria

```bash
npx tsc --noEmit   # 타입 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 모든 컴포넌트가 NativeWind 클래스명을 사용하는가? (StyleSheet.create 사용 금지)
   - 색상이 DESIGN.md 토큰과 일치하는가? (하드코딩 색상값 없이 Tailwind 클래스 사용)
   - 각 컴포넌트가 200줄을 넘지 않는가?
   - 컴포넌트에 비즈니스 로직이 없는가? (Firebase 호출 없음)
   - LikeButton에 haptics 호출이 있는가?
3. 결과에 따라 `phases/1-artworks/index.json`의 해당 step을 업데이트한다.

## 금지사항

- `StyleSheet.create`를 사용하지 마라. 이유: NativeWind만 사용.
- 컴포넌트에 Firebase 호출이나 서비스 import를 넣지 마라. 이유: CLAUDE.md CRITICAL 규칙.
- 색상값을 하드코딩하지 마라. 이유: tailwind.config.js 커스텀 색상 클래스를 사용.
- 화면(Screen) 컴포넌트를 만들지 마라. 이 step에서는 components/ 폴더의 재사용 UI만 다룬다.
