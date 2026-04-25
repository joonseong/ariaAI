# Step 3: integration-fix

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — 전체 네비게이션 구조
- `/docs/PRD.md` — 4-2. 탭 바 인터랙션 (재탭 → 스크롤 최상단), 4-10. 스크롤 위치 복원, 비회원 접근 규칙
- `/app/(tabs)/_layout.tsx` — 탭 레이아웃
- `/app/(tabs)/home/index.tsx` — 홈 피드
- `/app/(tabs)/search/index.tsx` — 검색 탭
- `/app/(tabs)/upload/index.tsx` — 업로드 탭
- `/app/(tabs)/profile/index.tsx` — 프로필 탭
- `/app/_layout.tsx` — 루트 레이아웃
- `/components/artwork/ArtworkCard.tsx` — 피드 카드 (작가 아바타 탭 → 포트폴리오 이동 확인)
- `/stores/authStore.ts` — useAuthStore
- `/hooks/useAuth.ts` — 인증 상태

## 작업

### 1. 비회원 접근 제어 통합

PRD 기준으로 비회원 접근 규칙 최종 확인 및 보완:
- **비회원 접근 가능**: 홈 피드, 작품 상세, 작가 포트폴리오, 검색
- **비회원 접근 불가 (로그인 유도)**: 좋아요, 팔로우, 방명록 작성, 작품 등록, 저장
- 업로드 탭: 비회원이면 LoginPromptSheet 표시
- 프로필 탭: 비회원이면 로그인 유도 화면 표시

### 2. 탭 바 인터랙션

탭 레이아웃에 재탭 시 스크롤 최상단 기능 추가:
- 홈 탭 재탭 → 피드 scrollToTop
- 검색 탭 재탭 → 검색 결과 scrollToTop
- 각 탭의 FlatList에 useScrollToTop 훅 적용

### 3. 네비게이션 연결 확인

모든 화면 간 네비게이션이 올바르게 연결되었는지 확인:
- 피드 카드 → 작품 상세 → 작가 포트폴리오 → 방명록/팔로워/팔로잉
- 프로필 → 좋아요한 작품/저장한 작품/팔로워/팔로잉/프로필 수정
- 검색 → 작품 상세 / 작가 포트폴리오
- 작품 상세 → 수정 / 삭제 / 신고
- 포트폴리오 통계 행 (작품 수/팔로워/팔로잉) 탭 시 올바른 화면으로 이동

### 4. 최종 타입 및 빌드 검증

전체 프로젝트의 타입 체크 및 빌드 통과 확인. 발견되는 문제 수정.

## Acceptance Criteria

```bash
npx tsc --noEmit                               # 타입 에러 없음
npx jest                                       # 전체 테스트 통과
npx expo export                                # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 모두 실행한다.
2. 아키텍처 체크리스트:
   - 비회원 접근 제어가 PRD와 일치하는가?
   - 탭 재탭 → 스크롤 최상단이 동작하는가?
   - 모든 네비게이션 경로가 연결되었는가?
3. 결과에 따라 `phases/4-polish/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 서비스 레이어를 수정하지 마라.
- 새로운 기능을 추가하지 마라. 기존 기능의 통합과 보완만 수행한다.
- 테스트를 삭제하거나 skip하지 마라.
