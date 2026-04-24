# Step 3: home-feed

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (화면은 UI 렌더링만. 비즈니스 로직은 hooks/에 분리)
- `/docs/ARCHITECTURE.md` — 디렉토리 구조의 `app/(tabs)/` 구조
- `/docs/PRD.md` — 3-2. 홈 피드 (기본 동작, 알고리즘, 페이지네이션, 에러 케이스, 엣지 케이스), 비회원 접근 규칙, 3-12. 빈 상태별 UX (홈 피드 팔로우 0명)
- `/docs/DESIGN.md` — 색상, 타이포그래피, 간격
- `/hooks/useArtworks.ts` — useArtworks 훅 (Step 1에서 생성)
- `/hooks/useLike.ts` — useLike 훅 (Step 1에서 생성)
- `/stores/authStore.ts` — useAuthStore (인증 상태)
- `/stores/feedStore.ts` — useFeedStore (Step 1에서 생성)
- `/components/feed/FeedList.tsx` — FeedList 컴포넌트 (Step 2에서 생성)
- `/components/common/LoginPromptSheet.tsx` — 비회원 로그인 유도 (Step 2에서 생성)
- `/app/(tabs)/_layout.tsx` — 탭 레이아웃 (0-foundation에서 생성)
- `/app/(tabs)/home/index.tsx` — 현재 placeholder (교체 대상)

## 작업

### 1. `app/(tabs)/home/index.tsx` (placeholder 교체)

홈 피드 화면을 구현한다:

```typescript
export default function HomeScreen() {
  // 1. useArtworks()로 피드 데이터 관리
  // 2. useAuthStore()로 인증 상태 확인
  // 3. useLike() 훅은 FeedList 내부에서 각 카드별로 사용하거나,
  //    좋아요 상태를 Map으로 관리하여 FeedList에 전달
  // 4. 비회원 좋아요 시도 → LoginPromptSheet 표시
  // 5. 카드 탭 → router.push(`/artwork/${artwork.id}`)
  // 6. 작가 탭 → router.push(`/artist/${artwork.authorId}`) (M3에서 구현, 지금은 라우트만)
  // 7. useEffect에서 loadFeed() 호출
}
```

화면 구조:
```
[StatusBar]
[헤더: "Aria" 로고/텍스트]

[FeedList 컴포넌트]
  - 무한 스크롤 피드
  - Pull-to-refresh
  - 빈 상태 / 에러 상태 처리

[LoginPromptSheet (조건부)]
```

PRD 에러 케이스 반영:
- 초기 로딩 실패 → ErrorState ("피드를 불러올 수 없습니다" + 다시 시도 버튼)
- 빈 피드 → EmptyState ("아직 작품이 없습니다. 작가를 팔로우해보세요!")
- 삭제된 작품 카드 탭 → "삭제된 작품입니다" 토스트

## Acceptance Criteria

```bash
npx tsc --noEmit                    # 타입 에러 없음
npx expo export --platform web 2>&1 | tail -5  # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 화면 컴포넌트에 Firebase 호출이 없는가? (useArtworks, useLike 훅만 사용)
   - 화면 컴포넌트에 비즈니스 로직이 없는가?
   - NativeWind 클래스명으로 스타일링되었는가?
   - 200줄을 넘지 않는가?
3. 결과에 따라 `phases/1-artworks/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 화면에서 Firebase SDK를 직접 import하지 마라. 이유: CLAUDE.md CRITICAL 규칙.
- 화면에서 비즈니스 로직을 직접 구현하지 마라. 이유: hooks를 사용해야 한다.
- `StyleSheet.create`를 사용하지 마라. NativeWind만 사용한다.
- 다른 탭 화면(search, upload, profile)을 수정하지 마라. 이 step에서는 home만 다룬다.
