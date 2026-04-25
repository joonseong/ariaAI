# Step 2: empty-error-states

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/PRD.md` — 3-12. 빈 상태별 첫 사용 가이드 테이블, 각 기능의 에러 케이스 테이블
- `/components/common/EmptyState.tsx` — 기존 빈 상태 컴포넌트
- `/components/common/ErrorState.tsx` — 기존 에러 상태 컴포넌트
- `/app/(tabs)/home/index.tsx` — 홈 피드
- `/app/(tabs)/profile/index.tsx` — 프로필 탭
- `/app/artist/[id].tsx` — 작가 포트폴리오
- `/app/artist/[id]/guestbook.tsx` — 방명록
- `/app/artist/[id]/followers.tsx` — 팔로워 목록
- `/app/artist/[id]/following.tsx` — 팔로잉 목록
- `/app/profile/liked.tsx` — 좋아요한 작품
- `/app/profile/saved.tsx` — 저장한 작품
- `/app/(tabs)/search/index.tsx` — 검색
- `/lib/constants.ts` — COLORS

## 작업

PRD에 정의된 빈 상태 메시지와 에러 상태를 기존 화면에 적용:

### 1. 빈 상태 메시지 보강

각 화면의 빈 상태를 PRD 3-12 테이블에 맞게 업데이트:

| 화면 | 빈 상태 메시지 | 액션 버튼 |
|------|---------------|-----------|
| 홈 피드 (팔로우 0명) | "작가를 팔로우하면 여기에 작품이 표시됩니다" | "작가 찾아보기" → 검색 탭 |
| 내 포트폴리오 (작품 0개) | "첫 작품을 등록해보세요" | "+" → 업로드 탭 |
| 좋아요한 작품 (0개) | "마음에 드는 작품에 하트를 눌러보세요" | "홈 피드 둘러보기" → 홈 |
| 저장한 작품 (0개) | "마음에 드는 작품을 저장해보세요" | "홈 피드 둘러보기" → 홈 |
| 방명록 (0개) | "아직 방명록이 없습니다. 첫 메시지를 남겨보세요!" | 없음 |
| 팔로워 (0명) | "아직 팔로워가 없습니다" | 없음 |
| 팔로잉 (0명) | "아직 팔로우하는 작가가 없습니다" | "작가 찾아보기" → 검색 탭 |

### 2. 에러 상태 보강

주요 화면의 에러 상태에 재시도 버튼과 적절한 메시지 확인:
- 초기 로딩 실패: 전체 화면 ErrorState + 재시도 버튼
- 추가 로딩 실패 (무한 스크롤): 리스트 하단 "불러오기 실패. 탭하여 재시도"
- 삭제된 콘텐츠 접근: "삭제된 작품입니다" / "작가를 찾을 수 없습니다"

### 3. 피드 카드에 북마크 버튼 추가

기존 ArtworkCard에 BookmarkButton 추가:
- 좋아요 하트 옆에 북마크 아이콘 배치
- PRD 4-1 피드 카드 인터랙션 참조

## Acceptance Criteria

```bash
npx tsc --noEmit                               # 타입 에러 없음
npx expo export                                # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - PRD 빈 상태 테이블의 모든 항목이 반영되었는가?
   - 에러 상태에 재시도 기능이 있는가?
   - ArtworkCard에 북마크 버튼이 추가되었는가?
3. 결과에 따라 `phases/4-polish/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 서비스나 훅의 비즈니스 로직을 변경하지 마라.
- 기존 기능을 깨뜨리지 마라 (빈 상태 메시지만 추가/수정).
