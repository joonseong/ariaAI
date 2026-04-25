# Step 1: utility-hooks

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — "비즈니스 로직 분리" 섹션
- `/docs/PRD.md` — 3-8. 검색 (디바운싱 500ms, 최근 검색어, 인기 태그), 3-9. 프로필 설정 (프로필 수정, 탈퇴), 3-10. 신고, 3-11. 작품 수정/삭제
- `/services/search.ts` — searchArtworks, searchUsers, searchByTag, getPopularTags (Step 0에서 생성)
- `/services/reports.ts` — createReport, checkReported (Step 0에서 생성)
- `/services/users.ts` — updateProfileImage, updateBio, updateNickname, deleteAccount (Step 0에서 확장)
- `/services/artworks.ts` — updateArtwork, deleteArtwork (Step 0에서 확장)
- `/services/auth.ts` — signOut, deleteCurrentUser (참조)
- `/hooks/useDebounce.ts` — 디바운싱 훅
- `/hooks/useImagePicker.ts` — 이미지 선택 훅 참조
- `/hooks/useDiscardGuard.ts` — 이탈 방지 훅
- `/hooks/useLike.ts` — 낙관적 업데이트 패턴 참조
- `/stores/authStore.ts` — useAuthStore

## 작업

### 1. `hooks/useSearch.ts`

검색 훅:

```typescript
export function useSearch() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'artworks' | 'users'>('artworks');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search: (query: string) => void;  // 디바운싱 500ms 적용
  const searchByTag: (tag: string) => void;
  const loadMore: () => Promise<void>;
  const loadPopularTags: () => Promise<void>;
  const loadRecentSearches: () => void;  // AsyncStorage에서 로드
  const addRecentSearch: (query: string) => void;  // 최대 20개, FIFO
  const removeRecentSearch: (query: string) => void;
  const clearRecentSearches: () => void;

  return { query, setQuery, tab, setTab, artworks, users, popularTags, recentSearches, isSearching, hasMore, isLoadingMore, search, searchByTag, loadMore, loadPopularTags, loadRecentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches };
}
```

핵심 규칙:
- useDebounce로 500ms 디바운싱
- 최근 검색어는 AsyncStorage 저장 (최대 20개, FIFO)
- 빈 쿼리면 검색 실행하지 않음
- 검색어 최대 50자

### 2. `hooks/useReport.ts`

신고 훅:

```typescript
export function useReport() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReport: (
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    detail?: string
  ) => Promise<Result<void>>;

  const checkAlreadyReported: (
    targetType: ReportTargetType,
    targetId: string
  ) => Promise<boolean>;

  return { isSubmitting, submitReport, checkAlreadyReported };
}
```

핵심 규칙:
- 비회원이면 에러 반환
- 이미 신고한 콘텐츠면 "이미 신고한 콘텐츠입니다" 에러 반환

### 3. `hooks/useProfileEdit.ts`

프로필 수정 훅:

```typescript
export function useProfileEdit() {
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const loadProfile: () => void;  // authStore에서 현재 프로필 로드
  const pickImage: () => Promise<void>;  // 이미지 선택
  const saveNickname: () => Promise<Result<void>>;
  const saveBio: () => Promise<Result<void>>;
  const saveProfileImage: () => Promise<Result<void>>;
  const saveAll: () => Promise<Result<void>>;  // 변경된 항목만 저장

  return { nickname, setNickname, bio, setBio, profileImage, isSubmitting, isDirty, loadProfile, pickImage, saveNickname, saveBio, saveProfileImage, saveAll };
}
```

핵심 규칙:
- 변경 추적: isDirty 플래그로 이탈 방지 연동
- 닉네임 저장 시 중복 검사 (updateNickname Transaction)
- 프로필 사진 변경 시 리사이징 + 업로드
- authStore 업데이트하여 앱 전체 반영

### 4. `hooks/useAccountDelete.ts`

회원 탈퇴 훅:

```typescript
export function useAccountDelete() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount: () => Promise<Result<void>>;

  return { isDeleting, deleteAccount };
}
```

핵심 규칙:
- deleteAccount 서비스 호출 후 Firebase Auth 계정 삭제 (auth.currentUser.delete())
- 완료 후 authStore.clear()
- 실패 시 에러 반환 (부분 삭제 상태는 MVP 한계로 수동 정리)

### 5. `hooks/useArtworkEdit.ts`

작품 수정 훅:

```typescript
export function useArtworkEdit(artworkId: string) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const loadArtwork: () => Promise<void>;  // 기존 데이터 로드
  const save: () => Promise<Result<void>>;

  return { title, setTitle, description, setDescription, tags, setTags, isSubmitting, isDirty, loadArtwork, save };
}
```

핵심 규칙:
- 수정은 낙관적 업데이트 미적용 (서버 확인 후 반영)
- isDirty로 이탈 방지 연동
- 입력 검증: title 1~100자, description 0~2000자, tags 0~10개

### 6. `hooks/useArtworkDelete.ts`

작품 삭제 훅:

```typescript
export function useArtworkDelete() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteArtwork: (artworkId: string) => Promise<Result<void>>;

  return { isDeleting, deleteArtwork };
}
```

## Acceptance Criteria

```bash
npx tsc --noEmit                               # 타입 에러 없음
npx jest __tests__/hooks/useSearch.test.ts     # 검색 훅 테스트
npx jest __tests__/hooks/useReport.test.ts     # 신고 훅 테스트
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - 훅에서 Firebase SDK 직접 import 없는가?
   - Zustand 스토어에 async 함수 없는가?
   - 디바운싱이 적용되었는가?
3. 결과에 따라 `phases/3-utility/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 훅에서 Firebase SDK를 직접 import하지 마라.
- 화면 컴포넌트를 만들지 마라. hooks/ 파일만 다룬다.
- 기존 hooks를 수정하지 마라.
