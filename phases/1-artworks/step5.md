# Step 5: artwork-detail

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (화면은 UI만, 비즈니스 로직은 hooks/에 분리)
- `/docs/ARCHITECTURE.md` — 디렉토리 구조의 `app/artwork/[id].tsx`, `components/artwork/` 구조
- `/docs/PRD.md` — 3-3. 작품 상세 (기본 동작, 이미지 뷰어 동작, 에러 케이스), 3-7. 좋아요 (낙관적 업데이트), 비회원 접근 규칙
- `/docs/DESIGN.md` — 색상, 타이포그래피, 간격
- `/hooks/useArtworkDetail.ts` — 작품 조회 훅 (Step 1에서 생성)
- `/hooks/useLike.ts` — 좋아요 훅 (Step 1에서 생성)
- `/services/likes.ts` — checkLiked (Step 0에서 생성)
- `/stores/authStore.ts` — useAuthStore
- `/components/artwork/LikeButton.tsx` — 좋아요 버튼 (Step 2에서 생성)
- `/components/artwork/TagChip.tsx` — 태그 칩 (Step 2에서 생성)
- `/components/artwork/ArtworkCard.tsx` — 참고용 (Step 2에서 생성)
- `/components/common/Avatar.tsx` — 아바타 (Step 2에서 생성)
- `/components/common/LoginPromptSheet.tsx` — 로그인 유도 (Step 2에서 생성)
- `/components/common/ErrorState.tsx` — 에러 상태
- `/lib/formatters.ts` — formatRelativeTime, formatCount

## 작���

### 1. `components/artwork/ArtworkImageViewer.tsx`

핀치줌 이미지 뷰어 컴포넌트:

```typescript
interface ArtworkImageViewerProps {
  imageUrls: string[];
  initialIndex?: number;
}
```

PRD 3-3 이미지 뷰어 동작:
- 여러 장: 좌우 스와이프 + 도트 인디케이터 (예: ● ○ ○)
- 탭: UI 오버레이 토글
- 더블 탭: 2x 줌 토글
- 핀치: 줌 인/아웃 (1x~4x)

구현 접근:
- FlatList horizontal + pagingEnabled로 스와이프 구현
- 핀치줌은 react-native-gesture-handler + react-native-reanimated 사용 (이미 Expo에 포함)
- 또는 expo-image의 contentFit="contain"과 ScrollView의 maximumZoomScale 활용
- 복잡한 제스처 라이브러리가 필요하면 기본 줌(더블탭 2x)만 구현하고 주석으로 표시

### 2. `components/artwork/ArtistMiniCard.tsx`

작품 상세 내 작가 미니 카드:

```typescript
interface ArtistMiniCardProps {
  authorId: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  onPress: () => void;           // 작가 포트폴리오로 이동
}
```

- 아바타(40px) + 닉네임 + 우측 화살표
- 탭 시 작가 포트폴리오로 이동 (M3에서 화면 구현)

### 3. `app/artwork/[id].tsx`

작품 상세 화면:

```typescript
export default function ArtworkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // 1. useArtworkDetail(id)로 작품 데이터 로드
  // 2. useLike()로 좋아요 상태 관리
  // 3. checkLiked로 초기 좋아요 상태 조회 (서비스 호출은 훅 내부에서)
  // 4. 비회원 좋아요 시도 → LoginPromptSheet 표시
  // 5. 공유 버튼 → Share.share() (React Native)
  // 6. 더보기 메뉴 (본인 작품: 수정/삭제, 타인 작품: 신고) — M4에서 신고 구현, 지금은 UI만
}
```

화면 구조 (ScrollView):
```
[ArtworkImageViewer]
  - 이미지 뷰어 (핀치줌, 스와이프)

[작품 정보 영역]
  [제목 (text-primary, heading 크기)]
  [설명 (text-secondary, body 크기)]
  [태그 칩 목록 (가로 스크롤)]
  [등록일 (text-tertiary, caption 크기)]

[구분선]

[작가 미니 카드 (ArtistMiniCard)]

[하단 액션 바 (고정)]
  [LikeButton (large)] [공유 버튼] [더보기 (⋯)]
```

PRD 에러 케이스 반영:
- 작품 ID 유효하지 않음 → "작품을 찾을 수 없습니다" ErrorState + 뒤로가기
- 이미지 로딩 실패 → 깨진 이미지 아이콘 + "이미지를 불러올 수 없습니다"
- 삭제된 작품 → "삭제된 작품입니다" 전체 화면 + 2초 후 자동 뒤로가기
- 좋아요 실패 → 하트 롤백 + "잠시 후 다시 시도해주세요" 토스트
- 비회원 좋아요 → LoginPromptSheet

## Acceptance Criteria

```bash
npx tsc --noEmit                    # 타입 에러 없음
npx expo export --platform web 2>&1 | tail -5  # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 화면에 Firebase 호출이 없는가? (훅만 사용)
   - 비즈니스 로직이 hooks에 분리되어 있는가?
   - NativeWind 클래스명으로 스타일링되었는가?
   - DESIGN.md 색상 토큰을 따르는가?
   - 각 파일이 200줄을 넘지 않는가?
   - Expo Router 파일 기반 라우팅 컨벤션을 따르는가?
3. 결과에 따라 `phases/1-artworks/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 화면에서 Firebase SDK를 직접 import하지 마라. 이유: CLAUDE.md CRITICAL 규칙.
- `StyleSheet.create`를 사용하지 마라. NativeWind만 사용.
- 팔로우 기능을 구현하지 마라. 이유: M3 범위. 작가 미니 카드에 팔로우 버튼 자리만 마련.
- 신고 기능의 실제 동작을 구현하지 마라. 이유: M4 범위. 더보기 메뉴 UI만 준비.
- 방명록을 구현하지 마라. 이유: M4 범위.
