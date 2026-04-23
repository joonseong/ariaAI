# 아키텍처 — Aria

## 디렉토리 구조
```
aria/
├── app/                    # Expo Router 기반 화면 (파일 기반 라우팅)
│   ├── (auth)/             # 인증 그룹 (로그인, 회원가입)
│   │   ├── _layout.tsx     # 인증 레이아웃 (탭바 없음)
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/             # 하단 탭 네비게이션 그룹
│   │   ├── _layout.tsx     # 탭 레이아웃 설정
│   │   ├── index.tsx       # 홈 피드
│   │   ├── search.tsx      # 검색
│   │   ├── upload.tsx      # 작품 등록
│   │   └── profile.tsx     # 내 프로필
│   ├── artwork/
│   │   └── [id].tsx        # 작품 상세 (동적 라우트)
│   ├── artist/
│   │   ├── [id].tsx        # 작가 포트폴리오 (동적 라우트)
│   │   └── [id]/
│   │       ├── guestbook.tsx  # 방명록
│   │       ├── followers.tsx  # 팔로워 목록
│   │       └── following.tsx  # 팔로잉 목록
│   ├── profile/
│   │   ├── edit.tsx        # 프로필 수정
│   │   ├── liked.tsx       # 좋아요한 작품
│   │   ├── followers.tsx   # 내 팔로워
│   │   └── following.tsx   # 내 팔로잉
│   └── _layout.tsx         # 루트 레이아웃 (인증 상태 분기)
├── components/             # 재사용 UI 컴포넌트
│   ├── common/             # 범용
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Avatar.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Toast.tsx
│   │   ├── EmptyState.tsx     # 빈 상태 일러스트 + 메시지
│   │   ├── ErrorState.tsx     # 에러 상태 + 재시도 버튼
│   │   ├── LoadingSpinner.tsx
│   │   ├── SkeletonCard.tsx   # 스켈레톤 로딩
│   │   ├── OfflineBanner.tsx  # 오프라인 상태 배너
│   │   └── LoginPromptSheet.tsx  # 비회원 로그인 유도 바텀시트
│   ├── artwork/            # 작품 관련
│   │   ├── ArtworkCard.tsx    # 피드 카드 (4:3)
│   │   ├── ArtworkGrid.tsx    # 포트폴리오 그리드 (3열, 1:1)
│   │   ├── ArtworkImageViewer.tsx  # 핀치줌 이미지 뷰어
│   │   ├── TagChip.tsx        # 도구 태그 칩
│   │   └── LikeButton.tsx     # 하트 토글 + 바운스 애니메이션
│   ├── artist/             # 작가 관련
│   │   ├── ArtistMiniCard.tsx # 작품 상세 내 작가 미니 카드
│   │   ├── FollowButton.tsx   # 팔로우/팔로잉 토글 버튼
│   │   └── UserListItem.tsx   # 팔로워/팔로잉 목록 아이템
│   ├── feed/               # 피드 관련
│   │   ├── FeedList.tsx       # 무한 스크롤 FlatList 래퍼
│   │   └── FeedSkeleton.tsx   # 피드 스켈레톤 (카드 3개)
│   └── guestbook/          # 방명록 관련
│       ├── GuestbookMessage.tsx
│       └── GuestbookInput.tsx
├── hooks/                  # 커스텀 훅
│   ├── useAuth.ts          # 인증 상태 + 로그인/가입/로그아웃 액션
│   ├── useArtworks.ts      # 작품 CRUD + 페이지네이션
│   ├── useArtworkDetail.ts # 단일 작품 조회
│   ├── useFollow.ts        # 팔로우 토글 + 낙관적 업데이트
│   ├── useLike.ts          # 좋아요 토글 + 낙관적 업데이트
│   ├── useGuestbook.ts     # 방명록 CRUD
│   ├── useSearch.ts        # 검색 + 디바운싱
│   ├── useImagePicker.ts   # 이미지 선택 + 검증 + 리사이징
│   ├── useNetworkStatus.ts # 네트워크 연결 상태 감지
│   ├── useReport.ts        # 신고 처리
│   └── useDebounce.ts      # 디바운싱 유틸 훅
├── services/               # Firebase 연동 래퍼
│   ├── auth.ts             # Firebase Auth 호출
│   ├── artworks.ts         # Firestore artworks CRUD
│   ├── users.ts            # Firestore users CRUD
│   ├── likes.ts            # Firestore likes 토글
│   ├── follows.ts          # Firestore follows 토글
│   ├── guestbooks.ts       # Firestore guestbooks CRUD
│   ├── reports.ts          # Firestore reports 생성
│   ├── storage.ts          # Firebase Storage 업로드/삭제
│   └── analytics.ts        # Firebase Analytics 이벤트 래퍼
├── stores/                 # Zustand 상태 저장소
│   ├── authStore.ts        # 로그인 유저 정보
│   └── feedStore.ts        # 피드 필터/정렬 상태
├── types/                  # TypeScript 타입 정의
│   ├── user.ts             # User, UserProfile
│   ├── artwork.ts          # Artwork, ArtworkFormData
│   ├── guestbook.ts        # GuestbookMessage
│   ├── report.ts           # Report, ReportReason
│   ├── common.ts           # PaginatedResult, AsyncState
│   └── navigation.ts       # 라우트 파라미터 타입
├── lib/                    # 유틸리티 + 상수
│   ├── firebase.ts         # Firebase 초기화 설정
│   ├── constants.ts        # 색상, 사이즈, 제한값 등 상수
│   ├── errors.ts           # 에러 코드 매핑 + 사용자 메시지 변환
│   ├── validators.ts       # 입력 검증 함수 (이메일, 닉네임, 비밀번호 등)
│   ├── formatters.ts       # 날짜, 숫자 포맷 (상대 시간, 1.2K 등)
│   └── image.ts            # 이미지 리사이징, 압축 유틸
├── assets/                 # 정적 리소스 (아이콘, 폰트, 일러스트)
│   ├── icons/
│   └── images/
│       └── empty-states/   # 빈 상태 일러스트
└── __tests__/              # 테스트
    ├── hooks/              # 훅 단위 테스트
    ├── services/           # 서비스 단위 테스트 (Firebase mock)
    ├── components/         # 컴포넌트 스냅샷 테스트
    └── lib/                # 유틸리티 단위 테스트
```

> **초보자 참고 — 왜 이렇게 나누나?**
> 폴더를 역할별로 나누면 "이 코드는 어디에 있지?"를 바로 알 수 있습니다.
> - 화면을 찾으려면 → `app/` 폴더
> - 버튼·카드 같은 부품을 찾으려면 → `components/` 폴더
> - Firebase와 통신하는 코드를 찾으려면 → `services/` 폴더
> - 에러 메시지를 바꾸려면 → `lib/errors.ts`
> - 입력 검증 규칙을 바꾸려면 → `lib/validators.ts`

---

## 패턴

### 컴포넌트 구조
- **화면(Screen)은 `app/` 폴더에**, UI 조각(컴포넌트)은 `components/`에 분리
- 한 컴포넌트 = 한 파일. 200줄을 넘기면 분리 검토
- 컴포넌트는 Props 타입을 명시적으로 선언
- 컴포넌트 파일명은 PascalCase (`ArtworkCard.tsx`), 훅/서비스는 camelCase (`useAuth.ts`)

### 비즈니스 로직 분리 (핵심 패턴)
```
화면(Screen) → 훅(Hook) → 서비스(Service) → Firebase
```
- **Screen**: UI 렌더링만 담당. 비즈니스 로직 직접 작성 금지
- **Hook**: 화면에서 쓸 데이터와 액션을 제공 (예: `useArtworks()`)
- **Service**: Firebase SDK 호출을 래핑. 훅에서만 호출. 에러를 throw하지 않고 Result 타입으로 반환

```typescript
// ===== 타입 정의 =====
// types/common.ts
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

interface AppError {
  code: string;       // 예: "auth/email-already-in-use"
  message: string;    // 사용자에게 표시할 한국어 메시지
}

// ===== 서비스 레이어 =====
// services/likes.ts — Firebase 직접 호출
export async function toggleLike(
  userId: string,
  artworkId: string
): Promise<Result<{ liked: boolean }>> {
  try {
    const likeRef = doc(db, 'likes', `${userId}_${artworkId}`);
    const likeSnap = await getDoc(likeRef);

    if (likeSnap.exists()) {
      await runTransaction(db, async (tx) => {
        tx.delete(likeRef);
        tx.update(doc(db, 'artworks', artworkId), {
          likesCount: increment(-1),
        });
      });
      return { success: true, data: { liked: false } };
    } else {
      await runTransaction(db, async (tx) => {
        tx.set(likeRef, { userId, artworkId, createdAt: serverTimestamp() });
        tx.update(doc(db, 'artworks', artworkId), {
          likesCount: increment(1),
        });
      });
      return { success: true, data: { liked: true } };
    }
  } catch (err) {
    return { success: false, error: mapFirebaseError(err) };
  }
}

// ===== 훅 레이어 =====
// hooks/useLike.ts — 낙관적 업데이트 + 롤백
export function useLike(artworkId: string, initialLiked: boolean, initialCount: number) {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const pendingRef = useRef(false);

  const toggle = useCallback(async () => {
    if (!user) return; // 비회원은 호출되지 않아야 함 (UI에서 차단)
    if (pendingRef.current) return; // 중복 방지
    pendingRef.current = true;

    // 낙관적 업데이트
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    const result = await toggleLike(user.id, artworkId);
    if (!result.success) {
      // 롤백
      setLiked(prevLiked);
      setCount(prevCount);
      showToast(result.error.message);
    }
    pendingRef.current = false;
  }, [user, artworkId, liked, count]);

  return { liked, count, toggle };
}

// ===== 화면 레이어 =====
// app/artwork/[id].tsx — UI만 담당
function ArtworkDetail() {
  const { liked, count, toggle } = useLike(artworkId, initialLiked, initialCount);
  return <LikeButton active={liked} count={count} onPress={toggle} />;
}
```

> **초보자 참고 — 왜 이렇게 나누나?**
> 만약 나중에 Firebase를 Supabase로 바꾸더라도, `services/` 폴더만 수정하면 됩니다.
> 화면 코드는 건드릴 필요가 없습니다. 이것이 "관심사 분리"의 핵심입니다.

---

## 데이터 흐름

### 읽기 (작품 피드 로딩)
```
앱 시작
  → app/(tabs)/index.tsx 마운트
    → useArtworks() 훅 호출
      → 상태: { loading: true, data: [], error: null }
      → 화면: 스켈레톤 카드 3개 렌더링
      → services/artworks.ts의 fetchFeed() 호출
        → Firestore 쿼리 (isHidden == false, orderBy createdAt desc, limit 20)
          → 성공:
            → 상태: { loading: false, data: Artwork[], error: null }
            → 화면: FeedCard 리스트 렌더링
          → 실패:
            → 상태: { loading: false, data: [], error: AppError }
            → 화면: ErrorState 렌더링 ("피드를 불러올 수 없습니다" + 재시도 버튼)
```

### 읽기 (무한 스크롤 — 추가 페이지)
```
사용자가 리스트 하단 도달 (onEndReached)
  → useArtworks().loadMore() 호출
    → 이미 로딩 중이면 무시 (isLoadingMore 체크)
    → 더 이상 데이터 없으면 무시 (hasMore 체크)
    → services/artworks.ts의 fetchFeed(lastCursor) 호출
      → 성공:
        → 기존 data에 append (중복 artworkId 필터링)
        → 반환 개수 < 20이면 hasMore = false
      → 실패:
        → 리스트 하단에 "불러오기 실패. 탭하여 재시도" 표시
        → 기존 데이터 유지
```

### 쓰기 (작품 등록)
```
사용자가 이미지 선택 + 제목 입력 + "등록" 버튼 탭
  → app/(tabs)/upload.tsx
    → useArtworks().create() 호출
      → 버튼 비활성화 + 프로그레스 바 표시
      → 이미지 검증 (크기, 형식, 해상도) — lib/validators.ts
        → 실패: 에러 메시지 표시, 등록 중단
      → 이미지 리사이징 (긴 변 2048px) — lib/image.ts
      → 이미지 1장씩 순차 업로드 → services/storage.ts
        → 각 이미지 완료 시 진행률 업데이트 (1/5, 2/5...)
        → 업로드 실패 시:
          → 이미 업로드된 이미지 URL은 유지
          → 실패한 이미지만 재시도 안내
      → 모든 URL 확보 → services/artworks.ts의 createArtwork() 호출
        → Firestore 트랜잭션: 작품 문서 생성 + users.artworksCount +1
        → 성공: 작품 상세 화면으로 이동 + 토스트
        → 실패: 입력 데이터 보존 + 에러 토스트 + 재시도 가능
```

### 실시간 업데이트
```
작품 상세 화면 마운트
  → useArtworkDetail(artworkId) 훅 호출
    → services/artworks.ts의 subscribeToArtwork(artworkId) 호출
      → Firestore onSnapshot 리스너 등록
        → 데이터 변경 시 (다른 사용자가 좋아요 누름 등)
          → 콜백 실행 → 상태 업데이트 → 화면 자동 리렌더링
  → 화면 언마운트
    → onSnapshot unsubscribe 호출 (리소스 정리)
```

> **초보자 참고 — onSnapshot과 리소스 정리**
> `onSnapshot`은 "데이터가 바뀌면 자동으로 알려주는" 실시간 연결입니다.
> 하지만 화면을 벗어나도 연결이 유지되면 불필요한 읽기 비용이 발생합니다.
> 그래서 화면이 사라질 때(언마운트) 반드시 `unsubscribe()`를 호출해 연결을 끊어야 합니다.
> React의 `useEffect` cleanup 함수에서 처리합니다.

---

## 상태 관리

| 종류 | 도구 | 예시 | 수명 |
|------|------|------|------|
| **서버 상태** | 커스텀 훅 + Firestore | 작품 목록, 유저 프로필, 팔로우 관계 | 화면 마운트 동안 |
| **글로벌 클라이언트 상태** | Zustand 스토어 | 로그인 유저 정보 (`authStore`), 피드 필터 설정 | 앱 세션 동안 |
| **로컬 UI 상태** | React `useState` | 모달 열림/닫힘, 입력 필드 값, 로딩 표시 | 컴포넌트 마운트 동안 |
| **영속 캐시** | AsyncStorage | 최근 검색어, 온보딩 완료 여부 | 앱 삭제까지 |

### 비동기 상태 패턴 (AsyncState)

모든 서버 데이터를 다루는 훅은 일관된 상태 패턴을 따른다:

```typescript
// types/common.ts
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
}

// 사용 예시 — 모든 훅이 이 패턴을 따름
const { data, loading, error, refresh } = useArtworkDetail(artworkId);

// 화면에서의 렌더링 분기
if (loading) return <SkeletonCard />;
if (error) return <ErrorState message={error.message} onRetry={refresh} />;
if (!data) return <EmptyState message="작품을 찾을 수 없습니다" />;
return <ArtworkDetailView artwork={data} />;
```

### Zustand 사용 규칙
- 스토어는 `stores/` 폴더에 기능별로 분리
- 스토어 하나당 하나의 관심사 (auth, feed 등)
- 액션(함수)도 스토어 안에 정의
- 서버 데이터를 Zustand에 캐싱하지 않는다 (Firestore 리스너가 담당)

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isInitialized: boolean;  // 앱 시작 시 인증 상태 확인 완료 여부
  setUser: (user: User | null) => void;
  setInitialized: () => void;
  isLoggedIn: () => boolean;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setInitialized: () => set({ isInitialized: true }),
  isLoggedIn: () => get().user !== null,
  clear: () => set({ user: null, isInitialized: false }),
}));
```

---

## 인증 플로우

### 앱 시작 시 인증 상태 확인
```
앱 시작
  → _layout.tsx 마운트
    → authStore.isInitialized === false
      → 스플래시 화면 유지
      → Firebase Auth onAuthStateChanged 리스너 등록
        → user 존재:
          → Firestore users/{uid} 문서 조회
            → 존재: authStore.setUser(userData), setInitialized()
            → 존재하지 않음 (DB 불일치): Firebase Auth signOut() → 로그인 화면
            → isDeleted === true: Firebase Auth signOut() → 로그인 화면
          → 네트워크 오류: 캐시된 인증 정보로 임시 로그인, 배너 표시
        → user null:
          → authStore.setUser(null), setInitialized()
          → 로그인 화면으로 이동
```

### 토큰 갱신 실패
```
Firebase SDK가 자동으로 ID 토큰 갱신 시도
  → 성공: 투명하게 처리 (사용자 인지 불필요)
  → 실패 (네트워크 등):
    → Firestore 요청 실패 시 "세션이 만료되었습니다" 토스트
    → 로그인 화면으로 이동
    → 작성 중이던 데이터는 유실 주의 (MVP 한계)
```

---

## 에러 핸들링 전략

### 에러 계층 구조
```
Firebase Error (원본)
  → mapFirebaseError() (lib/errors.ts)
    → AppError { code, message }  (사용자 친화적 한국어 메시지)
      → 훅에서 Result<T> 반환
        → 화면에서 적절한 UI로 표시
```

### Firebase 에러 → 사용자 메시지 매핑

```typescript
// lib/errors.ts
const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  'auth/email-already-in-use': '이미 가입된 이메일입니다.',
  'auth/invalid-email': '올바른 이메일 주소를 입력해주세요.',
  'auth/user-not-found': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/wrong-password': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/too-many-requests': '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
  'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
  'auth/user-disabled': '비활성화된 계정입니다.',
  'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.',

  // Firestore
  'permission-denied': '접근 권한이 없습니다.',
  'not-found': '요청한 데이터를 찾을 수 없습니다.',
  'unavailable': '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
  'deadline-exceeded': '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  'resource-exhausted': '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',

  // Storage
  'storage/unauthorized': '파일 업로드 권한이 없습니다.',
  'storage/canceled': '업로드가 취소되었습니다.',
  'storage/retry-limit-exceeded': '업로드에 실패했습니다. 네트워크를 확인해주세요.',
  'storage/invalid-checksum': '파일이 손상되었습니다. 다시 시도해주세요.',
  'storage/quota-exceeded': '저장 공간이 부족합니다.',
};

const DEFAULT_MESSAGE = '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

export function mapFirebaseError(error: unknown): AppError {
  if (error instanceof FirebaseError) {
    return {
      code: error.code,
      message: ERROR_MESSAGES[error.code] ?? DEFAULT_MESSAGE,
    };
  }
  return { code: 'unknown', message: DEFAULT_MESSAGE };
}
```

### 에러 표시 방식
| 심각도 | UI | 예시 |
|--------|------|------|
| **페이지 레벨** | ErrorState 전체 화면 (재시도 버튼) | 피드 초기 로딩 실패, 존재하지 않는 작품/작가 |
| **인라인** | 입력 필드 아래 빨간 텍스트 | 이메일 형식 오류, 닉네임 중복 |
| **토스트** | 하단 슬라이드업 (3초 자동 소멸) | 좋아요 실패, 팔로우 실패, 업로드 실패 |
| **배너** | 화면 상단 고정 배너 | 오프라인 상태, 세션 만료 경고 |
| **다이얼로그** | 중앙 모달 | 회원 탈퇴 확인, 작품 삭제 확인 |

### 재시도 전략
| 작업 유형 | 재시도 방식 |
|-----------|-------------|
| 피드 로딩 | 사용자 수동 재시도 (재시도 버튼 또는 pull-to-refresh) |
| 이미지 업로드 | 자동 재시도 2회 (exponential backoff: 1s, 3s) → 실패 시 수동 재시도 안내 |
| 좋아요/팔로우 | 자동 재시도 없음. 낙관적 업데이트 롤백 + 토스트 |
| Firestore 트랜잭션 | Firebase SDK 내부 재시도 (최대 5회) |
| 검색 | 사용자 수동 재시도 (재검색) |

---

## 네비게이션 구조

```
RootLayout (_layout.tsx)
│
├── isInitialized === false → SplashScreen (로딩)
│
├── user === null → (auth) 그룹
│     ├── /login
│     ├── /signup
│     └── /forgot-password
│
└── user !== null → (tabs) 그룹
      ├── 홈 탭       →  /          (피드)
      │                    └── /artwork/[id]  (상세)
      │                          └── /artist/[id]  (포트폴리오)
      │                                ├── /artist/[id]/guestbook
      │                                ├── /artist/[id]/followers
      │                                └── /artist/[id]/following
      ├── 검색 탭     →  /search
      │                    ├── /artwork/[id]
      │                    └── /artist/[id]
      ├── 업로드 탭   →  /upload
      └── 프로필 탭   →  /profile
                            ├── /profile/edit
                            ├── /profile/liked
                            ├── /profile/followers
                            └── /profile/following
```

### 딥링크 처리
```
aria://artwork/{id}  → 작품 상세 화면
aria://artist/{id}   → 작가 포트폴리오 화면

미로그인 상태에서 딥링크 진입:
  → 로그인 화면 표시 → 로그인 완료 → 원래 딥링크 목적지로 이동
```

---

## 로딩 상태 패턴

| 상황 | 로딩 UI |
|------|---------|
| 홈 피드 초기 로딩 | 스켈레톤 카드 3개 (FeedSkeleton) |
| 무한 스크롤 추가 로딩 | 리스트 하단 SpinnerFooter |
| 작품 상세 로딩 | 이미지 영역 블러 placeholder + 메타 스켈레톤 |
| 작가 포트폴리오 로딩 | 헤더 스켈레톤 + 그리드 스켈레톤 |
| 이미지 로딩 | 블러 hash → 고해상도 progressive |
| 좋아요/팔로우 | 즉시 반응 (낙관적 업데이트, 로딩 없음) |
| 작품 등록 | 프로그레스 바 (1/5, 2/5...) + 등록 버튼 비활성 |
| Pull-to-refresh | 시스템 기본 스피너 |
| 검색 | 결과 영역 스켈레톤 (debounce 500ms 후 표시) |

---

## 오프라인 대응

### 네트워크 상태 감지
```typescript
// hooks/useNetworkStatus.ts
// @react-native-community/netinfo 사용
// 네트워크 상태 변경 시 전역 이벤트로 전파
// OfflineBanner 컴포넌트가 이 훅을 구독하여 표시/숨김
```

### 오프라인 동작 규칙
| 동작 | 온라인 | 오프라인 |
|------|--------|----------|
| 피드 열람 | 서버 데이터 | Firestore 로컬 캐시 (자동) |
| 작품 상세 열람 | 서버 데이터 | 이전에 열어본 작품은 캐시에서 표시 |
| 좋아요/팔로우 | 즉시 반영 | 토스트 "인터넷 연결이 필요합니다" |
| 작품 등록 | 업로드 진행 | 등록 버튼 비활성 + 안내 메시지 |
| 검색 | 서버 쿼리 | "검색하려면 인터넷 연결이 필요합니다" |
| 로그인/가입 | 정상 처리 | "인터넷 연결이 필요합니다" |

> Firestore SDK는 기본적으로 로컬 캐시를 유지합니다. 이전에 로딩한 데이터는 오프라인에서도 읽을 수 있습니다.
> 단, 쓰기 작업(좋아요, 팔로우, 등록)은 오프라인 큐를 사용하지 않습니다 (MVP 결정: 복잡도 대비 가치 낮음).

---

## 성능 최적화

### FlatList 최적화 (피드)
```typescript
<FlatList
  data={artworks}
  renderItem={renderArtworkCard}
  keyExtractor={(item) => item.id}
  getItemLayout={(_, index) => ({     // 고정 높이로 레이아웃 계산 스킵
    length: CARD_HEIGHT,
    offset: CARD_HEIGHT * index,
    index,
  })}
  windowSize={5}                       // 화면 기준 위아래 5개 윈도우만 렌더
  maxToRenderPerBatch={10}             // 한 번에 최대 10개 렌더
  removeClippedSubviews={true}         // 화면 밖 뷰 제거
  initialNumToRender={5}               // 최초 5개만 렌더
  onEndReachedThreshold={0.5}          // 50% 지점에서 추가 로딩 시작
/>
```

### 이미지 최적화
- expo-image의 `cachePolicy: 'memory-disk'` 사용
- 피드 썸네일: 리사이징된 URL 사용 (가능 시)
- 블러 hash를 Firestore에 저장하여 placeholder로 사용
- 화면 밖 이미지는 `priority: 'low'`로 로딩

### 메모이제이션
- `useCallback`으로 이벤트 핸들러 래핑 (FlatList renderItem 등)
- `React.memo`로 순수 컴포넌트 래핑 (ArtworkCard, UserListItem 등)
- Zustand selector로 필요한 상태만 구독 (`useAuthStore(state => state.user)`)

---

## 테스트 전략

### 테스트 도구
| 도구 | 용도 |
|------|------|
| **Jest** | 테스트 러너 + 단위 테스트 |
| **React Native Testing Library** | 컴포넌트 테스트 |
| **Firebase Emulator** | 서비스 통합 테스트 (로컬 Firebase) |

### 테스트 범위
| 레이어 | 테스트 방식 | 예시 |
|--------|-------------|------|
| `lib/validators.ts` | 단위 테스트 | 이메일 검증, 닉네임 검증, 비밀번호 강도 |
| `lib/formatters.ts` | 단위 테스트 | 상대 시간 포맷, 숫자 축약 |
| `lib/errors.ts` | 단위 테스트 | Firebase 에러 → 한국어 메시지 매핑 |
| `services/*.ts` | 통합 테스트 (Firebase Emulator) | Firestore CRUD, Auth 흐름 |
| `hooks/*.ts` | 단위 테스트 (service mock) | 낙관적 업데이트 + 롤백, 페이지네이션 |
| `components/*.tsx` | 스냅샷 + 인터랙션 테스트 | 버튼 터치, 빈 상태, 에러 상태 |

### TDD 워크플로우
```
1. 실패하는 테스트 작성 (Red)
2. 테스트를 통과하는 최소 구현 (Green)
3. 리팩토링 (Refactor)
```

---

## Firebase 설정 구조

### 환경 분리
```
.env.development     # 개발용 Firebase 프로젝트
.env.production      # 운영용 Firebase 프로젝트
```

| 변수명 | 설명 |
|--------|------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase API 키 |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | 인증 도메인 |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | 프로젝트 ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage 버킷 |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM 발신자 ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | 앱 ID |

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Auth — React Native에서는 AsyncStorage persistence 필요
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore — 오프라인 캐시 활성화
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export const storage = getStorage(app);
```

> **초보자 참고 — 환경 변수란?**
> `process.env.EXPO_PUBLIC_...` 는 비밀 설정값(API 키 등)을 코드에 직접 쓰지 않고
> `.env` 파일에 따로 보관하는 방식입니다. `.env` 파일은 Git에 올리지 않아 보안을 유지합니다.
> 개발용과 운영용 Firebase 프로젝트를 분리하면 실수로 운영 데이터를 건드리는 것을 방지합니다.

---

## 보안 규칙

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // === 헬퍼 함수 ===
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    function isValidString(field, minLen, maxLen) {
      return field is string && field.size() >= minLen && field.size() <= maxLen;
    }

    // === Users ===
    match /users/{userId} {
      allow read: if true;
      allow create: if isOwner(userId)
        && isValidString(request.resource.data.nickname, 2, 20)
        && isValidString(request.resource.data.bio, 0, 150);
      allow update: if isOwner(userId)
        && isValidString(request.resource.data.nickname, 2, 20)
        && isValidString(request.resource.data.bio, 0, 150);
      allow delete: if isOwner(userId);
    }

    // === Artworks ===
    match /artworks/{artworkId} {
      allow read: if true;
      allow create: if isAuthenticated()
        && request.resource.data.authorId == request.auth.uid
        && isValidString(request.resource.data.title, 1, 100)
        && request.resource.data.imageUrls.size() >= 1
        && request.resource.data.imageUrls.size() <= 5
        && request.resource.data.tags.size() <= 10;
      allow update: if request.auth.uid == resource.data.authorId
        && isValidString(request.resource.data.title, 1, 100);
      allow delete: if request.auth.uid == resource.data.authorId;
    }

    // === Likes ===
    match /likes/{likeId} {
      allow read: if true;
      allow create: if isAuthenticated()
        && request.resource.data.userId == request.auth.uid
        && likeId == request.auth.uid + '_' + request.resource.data.artworkId;
      allow delete: if isAuthenticated()
        && resource.data.userId == request.auth.uid;
    }

    // === Follows ===
    match /follows/{followId} {
      allow read: if true;
      allow create: if isAuthenticated()
        && request.resource.data.followerId == request.auth.uid
        && request.resource.data.followerId != request.resource.data.followingId
        && followId == request.auth.uid + '_' + request.resource.data.followingId;
      allow delete: if isAuthenticated()
        && resource.data.followerId == request.auth.uid;
    }

    // === Guestbooks ===
    match /guestbooks/{ownerId}/messages/{messageId} {
      allow read: if true;
      allow create: if isAuthenticated()
        && request.resource.data.authorId == request.auth.uid
        && isValidString(request.resource.data.content, 1, 200);
      // 작성자 본인 또는 포트폴리오 주인이 삭제 가능
      allow delete: if isAuthenticated()
        && (resource.data.authorId == request.auth.uid || request.auth.uid == ownerId);
      // 답글은 포트폴리오 주인만 작성 가능
      allow update: if isOwner(ownerId)
        && isValidString(request.resource.data.replyContent, 1, 200);
    }

    // === Reports ===
    match /reports/{reportId} {
      allow read: if false;  // 클라이언트에서 읽기 불가
      allow create: if isAuthenticated()
        && request.resource.data.reporterId == request.auth.uid;
    }

    // === Nicknames (유니크 보장) ===
    match /nicknames/{nickname} {
      allow read: if true;
      allow create: if isAuthenticated()
        && request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated()
        && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 프로필 이미지
    match /profiles/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024  // 5MB
        && request.resource.contentType.matches('image/(jpeg|png|webp)');
    }

    // 작품 이미지
    match /artworks/{userId}/{artworkId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024  // 10MB
        && request.resource.contentType.matches('image/(jpeg|png|webp)');
      allow delete: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

---

## UX 인프라 패턴

### 토스트 시스템
```typescript
// 전역 토스트 — Zustand 스토어 또는 React Context로 관리
// 루트 레이아웃(_layout.tsx)에 <ToastContainer /> 배치
// 어디서든 showToast() 호출로 표시

// stores/toastStore.ts (또는 lib/toast.ts에서 export)
interface Toast {
  id: string;
  message: string;
  type: 'default' | 'error' | 'success';
  action?: { label: string; onPress: () => void };  // 선택적 액션 버튼
}

// 큐잉 규칙:
// - 동시에 1개만 표시
// - 새 토스트 발생 시 기존 토스트 즉시 교체
// - 3초 후 자동 소멸
// - 아래로 스와이프 시 즉시 소멸
```

### 햅틱 피드백
```typescript
// lib/haptics.ts
import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  selection: () => Haptics.selectionAsync(),
};

// 사용: 훅 또는 컴포넌트에서 import하여 호출
// 예: useLike의 toggle() 내에서 haptics.light() 호출
```

### 키보드 처리
```typescript
// components/common/KeyboardAwareView.tsx
// KeyboardAvoidingView + ScrollView 조합의 래퍼 컴포넌트
// - iOS: behavior="padding", keyboardVerticalOffset 계산
// - Android: behavior="height"
// - 활성 입력 필드로 자동 스크롤
// - 키보드 밖 영역 탭 시 Keyboard.dismiss()

// 방명록 입력은 별도 패턴:
// - 하단 고정 입력 바 (KeyboardAvoidingView 안에)
// - 키보드 올라올 때 메시지 목록이 위로 밀림
// - FlatList inverted={false} + contentContainerStyle에 paddingBottom
```

### 작성 중 데이터 보호 (Discard Guard)
```typescript
// hooks/useDiscardGuard.ts
// - 특정 상태(isDirty)가 true일 때 뒤로가기를 가로챔
// - Expo Router의 useNavigation().addListener('beforeRemove')
// - 확인 다이얼로그 표시: "작성 중인 내용이 있습니다. 나가시겠습니까?"
// - "나가기" → navigation dispatch / "계속 작성" → preventDefault
// - 적용 화면: 작품 등록, 프로필 수정
```

### 스크롤 위치 복원
```
React Navigation의 기본 동작으로 대부분 처리:
- Stack 네비게이션에서 뒤로가기 시 이전 화면의 스크롤 위치 자동 유지 (화면이 언마운트되지 않으므로)
- 탭 전환 시에도 각 탭의 화면이 유지됨 (unmountOnBlur: false 기본값)

별도 처리 필요한 케이스:
- Pull-to-refresh 후 → FlatList scrollToOffset({ offset: 0 }) 호출
- 탭 아이콘 재탭 → scrollToTop (useScrollToTop 훅 사용)
```

### 탭 아이콘 재탭 → 스크롤 최상단
```typescript
// 각 탭의 루트 화면에서:
import { useScrollToTop } from '@react-navigation/native';

function HomeScreen() {
  const scrollRef = useRef<FlatList>(null);
  useScrollToTop(scrollRef);  // 탭 재탭 시 자동으로 scrollToTop 호출

  return <FlatList ref={scrollRef} ... />;
}
```

---

## 로깅 & 크래시 리포트

### Firebase Crashlytics
- 앱 크래시 자동 수집
- 비치명적 에러는 `crashlytics().recordError(error)` 로 수동 기록
- 사용자 ID 연결: `crashlytics().setUserId(uid)`

### Firebase Analytics
- `services/analytics.ts`에서 이벤트 래핑
- 화면 전환 자동 추적 (Expo Router 연동)
- 커스텀 이벤트는 PRD 11절 "분석 이벤트" 참조

### 로깅 규칙
- 프로덕션에서 `console.log` 사용 금지 — `__DEV__` 가드 필수
- 민감 정보(비밀번호, 토큰, 이메일) 절대 로깅하지 않음
- 에러 로그에는 에러 코드와 컨텍스트(어떤 화면, 어떤 동작)를 포함
