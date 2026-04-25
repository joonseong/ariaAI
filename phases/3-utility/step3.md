# Step 3: profile-settings

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — 네비게이션 구조 (profile/edit.tsx, (tabs)/profile.tsx)
- `/docs/PRD.md` — 3-9. 프로필 설정 (프로필 수정, 로그아웃, 회원 탈퇴), 4-9. Discard Guard
- `/hooks/useProfileEdit.ts` — 프로필 수정 훅 (Step 1에서 생성)
- `/hooks/useAccountDelete.ts` — 회원 탈퇴 훅 (Step 1에서 생성)
- `/hooks/useAuth.ts` — signOut 등
- `/hooks/useDiscardGuard.ts` — 이탈 방지 훅
- `/components/common/Avatar.tsx` — 아바타
- `/components/common/Button.tsx` — 버튼
- `/components/common/Input.tsx` — 입력 필드
- `/stores/authStore.ts` — useAuthStore
- `/app/(tabs)/profile/index.tsx` — 기존 프로필 탭 (있으면 확장)
- `/app/artist/[id].tsx` — 포트폴리오 화면 패턴 참조

## 작업

### 1. `app/(tabs)/profile/index.tsx` 재구현

내 프로필 화면 (프로필 탭 메인):

```typescript
export default function ProfileScreen(): JSX.Element;
```

구현 내용:
- **비회원 상태**: 로그인 유도 화면 ("로그인하고 나만의 포트폴리오를 시작해보세요" + 로그인/가입 버튼)
- **회원 상태**:
  - 헤더: Avatar(80px) + 닉네임 + 한 줄 소개 + "프로필 수정" 버튼
  - 통계: 작품 수 | 팔로워 수 | 팔로잉 수 (탭 가능)
  - 메뉴 리스트:
    - "좋아요한 작품" → profile/liked.tsx
    - "저장한 작품" → profile/saved.tsx
    - "팔로워" → profile/followers.tsx
    - "팔로잉" → profile/following.tsx
    - "로그아웃" → 확인 다이얼로그 → signOut
  - 내 작품 그리드: ArtworkGrid로 3열 표시 (useArtistProfile 활용)

핵심 규칙:
- authStore에서 현재 사용자 정보 사용
- 팔로워/팔로잉 수 탭 시 각각의 목록 화면으로 이동
- 로그아웃 시 확인 다이얼로그 표시

### 2. `app/profile/edit.tsx`

프로필 수정 화면:

```typescript
export default function ProfileEditScreen(): JSX.Element;
```

구현 내용:
- useProfileEdit 훅으로 프로필 데이터 관리
- **프로필 사진**: Avatar 탭 시 갤러리에서 이미지 선택
- **닉네임 입력**: Input + 중복 확인 (저장 시 자동)
- **한 줄 소개 입력**: Input (최대 150자, 카운터 표시)
- **저장 버튼**: 변경된 항목만 저장
- **회원 탈퇴**: 화면 하단 "회원 탈퇴" 링크 → 확인 다이얼로그 → 비밀번호 재입력 → 탈퇴 처리
- **이탈 방지**: useDiscardGuard(isDirty)

핵심 규칙:
- 저장 성공 시 authStore 업데이트 + 이전 화면으로 이동 + "프로필이 수정되었습니다" 토스트
- 닉네임 중복 시 인라인 에러 메시지
- 프로필 사진 업로드 실패 시 기존 사진 유지 + 토스트
- 회원 탈퇴 완료 시 authStore.clear() + 로그인 화면으로 이동

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
   - Discard Guard가 프로필 수정 화면에 적용되었는가?
3. 결과에 따라 `phases/3-utility/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 화면에서 Firebase SDK를 직접 import하지 마라.
- 기존 훅이나 컴포넌트를 수정하지 마라.
- 다른 탭 화면 (home, search, upload)을 수정하지 마라.
