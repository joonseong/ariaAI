# Step 3: artist-portfolio

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — 네비게이션 구조 (artist/[id].tsx, artist/[id]/guestbook.tsx)
- `/docs/PRD.md` — 3-5. 작가 포트폴리오 (헤더, 통계, 탭 전환, 방명록 규칙, 에러 케이스)
- `/hooks/useArtistProfile.ts` — 작가 프로필 데이터 훅 (Step 1에서 생성)
- `/hooks/useFollow.ts` — 팔로우 훅 (Step 1에서 생성)
- `/hooks/useGuestbook.ts` — 방명록 훅 (Step 1에서 생성)
- `/components/artist/FollowButton.tsx` — 팔로우 버튼 (Step 2에서 생성)
- `/components/artist/UserListItem.tsx` — 유저 리스트 아이템 (Step 2에서 생성)
- `/components/artwork/ArtworkGrid.tsx` — 작품 그리드 (Step 2에서 생성)
- `/components/guestbook/GuestbookMessage.tsx` — 방명록 메시지 (Step 2에서 생성)
- `/components/guestbook/GuestbookInput.tsx` — 방명록 입력 (Step 2에서 생성)
- `/components/common/Avatar.tsx` — 아바타
- `/components/common/EmptyState.tsx` — 빈 상태
- `/components/common/ErrorState.tsx` — 에러 상태
- `/components/common/LoginPromptSheet.tsx` — 로그인 유도
- `/stores/authStore.ts` — useAuthStore
- `/app/artwork/[id].tsx` — 작품 상세 화면 참조 (1-artworks에서 생성)

## 작업

### 1. `app/artist/[id].tsx`

작가 포트폴리오 화면:

```typescript
// Expo Router 동적 라우트
export default function ArtistPortfolioScreen(): JSX.Element;
```

구현 내용:
- useArtistProfile 훅으로 작가 데이터 + 작품 목록 로딩
- **헤더 영역**: Avatar(80px) + 닉네임 + 한 줄 소개
- **통계 행**: 작품 수 | 팔로워 수 | 팔로잉 수 (각각 탭 가능 — 팔로워/팔로잉은 목록 화면으로 이동)
- **팔로우 버튼**: FollowButton 컴포넌트 사용. 본인 프로필이면 "프로필 수정" 버튼으로 대체
- **탭 전환**: "작품" | "방명록" 탭 (간단한 상태 기반 전환, 별도 네비게이터 불필요)
- **작품 탭**: ArtworkGrid로 3열 그리드 표시. 탭하면 artwork/[id]로 이동. 무한 스크롤 지원
- **방명록 탭**: 방명록 메시지 목록 + 하단 입력 바

핵심 규칙:
- 로딩 중: 스켈레톤 UI (헤더 + 그리드)
- 에러 시: ErrorState 전체 화면 ("작가를 찾을 수 없습니다")
- 비회원 방명록 작성 시도: LoginPromptSheet 표시
- 화면은 UI 렌더링만. 비즈니스 로직은 useArtistProfile, useFollow, useGuestbook 훅에서 처리

### 2. `app/artist/[id]/guestbook.tsx`

방명록 전체 화면 (포트폴리오에서 "더보기"로 접근하거나 직접 라우팅):

```typescript
export default function GuestbookScreen(): JSX.Element;
```

구현 내용:
- useGuestbook 훅으로 메시지 CRUD
- FlatList로 메시지 목록 (최신순, 무한 스크롤)
- GuestbookMessage 컴포넌트로 각 메시지 렌더링
- GuestbookInput으로 하단 입력 바
- 답글 모드: 메시지의 "답글" 버튼 탭 시 GuestbookInput이 답글 모드로 전환
- 삭제: 확인 다이얼로그 후 삭제

핵심 규칙:
- 비회원은 목록 열람만 가능, 입력 바에 "로그인 후 작성 가능" 표시
- 빈 상태: "아직 방명록이 없습니다. 첫 번째 메시지를 남겨보세요!"

## Acceptance Criteria

```bash
npx tsc --noEmit                               # 타입 에러 없음
npx expo export                                # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - 화면에서 Firebase SDK 직접 import 없는가?
   - 비즈니스 로직이 훅에 분리되어 있는가? (화면은 UI만)
   - 200줄 초과 시 컴포넌트를 분리했는가?
3. 결과에 따라 `phases/2-social/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 화면에서 Firebase SDK를 직접 import하지 마라.
- 기존 훅이나 컴포넌트를 수정하지 마라.
- 서비스 코드를 수정하지 마라.
- 팔로워/팔로잉 목록 화면은 이 step에서 만들지 마라 (Step 4에서 구현).
