# Step 2: social-components

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — "컴포넌트 구조" 섹션, components/artist/ 및 components/guestbook/ 구조
- `/docs/PRD.md` — 3-5. 작가 포트폴리오 (헤더, 통계, 탭, 그리드), 3-6. 팔로우 시스템, 3-5. 방명록
- `/components/artwork/ArtworkCard.tsx` — 기존 카드 컴포넌트 패턴 참조
- `/components/artwork/LikeButton.tsx` — 토글 버튼 패턴 참조
- `/components/common/Avatar.tsx` — 아바타 컴포넌트 참조
- `/components/common/LoginPromptSheet.tsx` — 바텀시트 패턴 참조
- `/components/common/EmptyState.tsx` — 빈 상태 컴포넌트 참조
- `/hooks/useFollow.ts` — FollowButton에서 사용할 훅 (Step 1에서 생성)
- `/hooks/useBookmark.ts` — BookmarkButton에서 사용할 훅 (Step 1에서 생성)
- `/hooks/useGuestbook.ts` — 방명록 컴포넌트에서 사용할 훅 (Step 1에서 생성)
- `/stores/authStore.ts` — useAuthStore
- `/types/user.ts` — User 타입
- `/types/guestbook.ts` — GuestbookMessage 타입
- `/lib/constants.ts` — COLORS, LIMITS

## 작업

### 1. `components/artist/FollowButton.tsx`

팔로우/팔로잉 토글 버튼:

```typescript
interface FollowButtonProps {
  targetUserId: string;
  initialFollowing: boolean;
  initialFollowersCount: number;
  onFollowChange?: (following: boolean, count: number) => void;
}

export default function FollowButton(props: FollowButtonProps): JSX.Element;
```

핵심 규칙:
- useFollow 훅을 사용하여 토글 처리
- 팔로우 상태에 따라 버튼 스타일 변경 ("팔로우" → accent 배경, "팔로잉" → outline 스타일)
- 비회원이면 LoginPromptSheet 표시
- 본인 프로필에서는 이 컴포넌트를 렌더링하지 않음 (부모에서 처리)

### 2. `components/artist/UserListItem.tsx`

팔로워/팔로잉 목록 아이템:

```typescript
interface UserListItemProps {
  user: User;
  showFollowButton?: boolean;
}

export default function UserListItem(props: UserListItemProps): JSX.Element;
```

핵심 규칙:
- Avatar + 닉네임 + 한 줄 소개 (좌측) + FollowButton (우측, showFollowButton이 true일 때)
- 본인은 FollowButton 숨김
- 탭하면 해당 작가 포트폴리오로 이동 (router.push)

### 3. `components/artwork/ArtworkGrid.tsx`

포트폴리오용 3열 그리드:

```typescript
interface ArtworkGridProps {
  artworks: Artwork[];
  onArtworkPress: (artworkId: string) => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  ListEmptyComponent?: React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
}

export default function ArtworkGrid(props: ArtworkGridProps): JSX.Element;
```

핵심 규칙:
- FlatList with numColumns={3}
- 각 아이템은 1:1 비율 썸네일 (expo-image 사용)
- 작품 탭 시 onArtworkPress 호출
- 빈 상태 시 EmptyState 표시

### 4. `components/artist/BookmarkButton.tsx`

저장/북마크 토글 버튼:

```typescript
interface BookmarkButtonProps {
  artworkId: string;
  initialBookmarked: boolean;
}

export default function BookmarkButton(props: BookmarkButtonProps): JSX.Element;
```

핵심 규칙:
- useBookmark 훅을 사용
- 북마크 아이콘 토글 (outline ↔ filled)
- 비회원이면 LoginPromptSheet 표시

### 5. `components/guestbook/GuestbookMessage.tsx`

방명록 메시지 아이템:

```typescript
interface GuestbookMessageProps {
  message: GuestbookMessage;
  isArtist: boolean;  // 현재 사용자가 포트폴리오 주인인지
  onDelete: (messageId: string) => void;
  onReply: (messageId: string) => void;
}

export default function GuestbookMessage(props: GuestbookMessageProps): JSX.Element;
```

핵심 규칙:
- Avatar + 닉네임 + 작성 시간(상대 표기) + 메시지 내용
- 답글이 있으면 들여쓰기하여 표시 (작가 아이콘 + 답글 내용)
- 삭제 버튼: 메시지 작성자 본인 또는 포트폴리오 주인에게만 표시
- 답글 버튼: 포트폴리오 주인(isArtist)에게만 표시

### 6. `components/guestbook/GuestbookInput.tsx`

방명록 입력 바 (하단 고정):

```typescript
interface GuestbookInputProps {
  onSend: (content: string) => Promise<void>;
  replyTo?: { messageId: string; nickname: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export default function GuestbookInput(props: GuestbookInputProps): JSX.Element;
```

핵심 규칙:
- 하단 고정 입력 바 (KeyboardAvoidingView 안에 배치)
- 답글 모드일 때 "@닉네임에게 답글" 라벨 표시 + 취소 버튼
- 1~200자 입력 검증
- 전송 버튼은 내용이 있을 때만 활성화
- 전송 후 입력 필드 초기화

## Acceptance Criteria

```bash
npx tsc --noEmit                               # 타입 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - 컴포넌트에서 Firebase SDK 직접 import 없는가?
   - 각 컴포넌트가 200줄 이하인가?
   - Props 타입이 명시적으로 선언되었는가?
3. 결과에 따라 `phases/2-social/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 컴포넌트에서 Firebase SDK를 직접 import하지 마라.
- 화면(Screen) 코드를 작성하지 마라. components/ 파일만 다룬다.
- 기존 components (ArtworkCard, LikeButton, Avatar, LoginPromptSheet 등)를 수정하지 마라.
- 훅이나 서비스 코드를 수정하지 마라.
