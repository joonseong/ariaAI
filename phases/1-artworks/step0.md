# Step 0: artwork-services

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (서비스에서 throw 금지, Result<T> 반환)
- `/docs/ARCHITECTURE.md` — "비즈니스 로직 분리" 섹션 (toggleLike 코드 예제), "작품 등록 — Storage 롤백 패턴" 섹션 (createArtwork 코드)
- `/docs/PRD.md` — 3-2. 홈 피드 (페이지네이션), 3-3. 작품 상세, 3-4. 작품 등록 (업로드 플로우, 입력 검증), 3-7. 좋아요 (낙관적 업데이트, 디바운싱)
- `/types/common.ts` — Result<T>, AppError 타입
- `/types/artwork.ts` — Artwork, ArtworkFormData 타입
- `/lib/firebase.ts` — auth, db, storage 인스턴스
- `/lib/errors.ts` — mapFirebaseError 함수
- `/lib/image.ts` — 이미지 유틸 (리사이징, 검증)
- `/services/auth.ts` — 기존 서비스 패턴 참조 (Result<T> 반환 방식)

## 작업

### 1. `services/storage.ts`

Firebase Storage 래퍼 서비스를 구현한다:

```typescript
import { Result } from '@/types/common';

// 이미지 업로드 — Storage에 파일 업로드 후 다운로드 URL 반환
// path 예: "artworks/{userId}/{timestamp}_{index}.jpg"
export async function uploadImage(
  path: string,
  uri: string,
  onProgress?: (progress: number) => void
): Promise<Result<string>> { ... }

// 이미지 삭제 — URL로부터 Storage 경로를 추출하여 삭제
export async function deleteImage(url: string): Promise<Result<void>> { ... }

// 여러 이미지 순차 업로드 — 전체 진행률 콜백 제공
// 실패 시 이미 업로드된 이미지 롤백 삭제
export async function uploadImages(
  basePath: string,
  uris: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Result<string[]>> { ... }
```

핵심 규칙:
- uri를 fetch → blob 변환하여 uploadBytesResumable 사용
- onProgress 콜백으로 업로드 진행률 전달
- uploadImages에서 중간 실패 시 이미 업로드된 파일들 롤백 삭제

### 2. `services/artworks.ts`

Firestore artworks CRUD 서비스를 구현한다:

```typescript
import { Result, PaginatedResult } from '@/types/common';
import { Artwork, ArtworkFormData } from '@/types/artwork';

// 작품 생성 — 이미지 업로드 + Firestore 문서 생성
// ARCHITECTURE.md "Storage 롤백 패턴" 참조
export async function createArtwork(
  userId: string,
  formData: ArtworkFormData,
  onProgress?: (completed: number, total: number) => void
): Promise<Result<string>> { ... }

// 작품 단일 조회
export async function getArtwork(artworkId: string): Promise<Result<Artwork>> { ... }

// 작품 삭제 — Firestore 문서 삭제 + Storage 이미지 삭제
export async function deleteArtwork(artworkId: string, imageUrls: string[]): Promise<Result<void>> { ... }

// 작품 수정 — 제목, 설명, 태그만 수정 가능 (이미지 변경 불가)
export async function updateArtwork(
  artworkId: string,
  data: { title?: string; description?: string; tags?: string[]; tool?: string }
): Promise<Result<void>> { ... }

// 홈 피드 조회 — 커서 기반 페이지네이션
// isHidden === false인 작품만 조회, createdAt DESC 정렬
// cursor는 마지막 문서의 createdAt
export async function getFeedArtworks(
  cursor?: Date,
  limit?: number
): Promise<Result<PaginatedResult<Artwork>>> { ... }

// 특정 사용자의 작품 조회 — 포트폴리오용 (M3에서 화면 구현, 서비스는 미리 준비)
export async function getUserArtworks(
  userId: string,
  cursor?: Date,
  limit?: number
): Promise<Result<PaginatedResult<Artwork>>> { ... }
```

핵심 규칙:
- createArtwork는 storage.ts의 uploadImages를 호출하여 이미지 업로드 후 Firestore 문서 생성
- Firestore 문서 생성 실패 시 업로드된 이미지 롤백 삭제
- Firestore Timestamp ↔ Date 변환은 이 서비스 내에서 처리
- getFeedArtworks는 Firestore startAfter() 커서 기반, 페이지당 20개 (LIMITS.FEED_PAGE_SIZE)
- users 문서의 artworksCount를 createArtwork/deleteArtwork 시 increment/decrement

### 3. `services/likes.ts`

좋아요 토글 서비스를 구현한다:

```typescript
import { Result } from '@/types/common';

// 좋아요 토글 — ARCHITECTURE.md toggleLike 코드 예제 참조
// likes/{userId}_{artworkId} 문서 존재 여부로 토글
// Transaction으로 likes 문서 생성/삭제 + artworks.likesCount increment/decrement
export async function toggleLike(
  userId: string,
  artworkId: string
): Promise<Result<{ liked: boolean }>> { ... }

// 좋아요 여부 확인 — 작품 상세 진입 시 초기값 조회
export async function checkLiked(
  userId: string,
  artworkId: string
): Promise<Result<boolean>> { ... }

// 사용자의 좋아요한 작품 목록 조회 — 커서 기반 페이지네이션
export async function getLikedArtworks(
  userId: string,
  cursor?: Date,
  limit?: number
): Promise<Result<PaginatedResult<Artwork>>> { ... }
```

## Acceptance Criteria

```bash
npx tsc --noEmit                              # 타입 에러 없음
npx jest __tests__/services/artworks.test.ts  # 서비스 테스트 통과
npx jest __tests__/services/likes.test.ts     # 좋아요 테스트 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 모든 서비스 함수가 Result<T>를 반환하는가? throw가 없는가?
   - Firebase SDK를 `lib/firebase.ts`에서만 import하는가?
   - mapFirebaseError를 사용하여 에러를 한국어 메시지로 변환하는가?
   - createArtwork에서 Storage 롤백 패턴이 구현되었는가?
   - toggleLike에서 Transaction을 사용하는가?
3. 결과에 따라 `phases/1-artworks/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 서비스 함수에서 throw하지 마라. 이유: CLAUDE.md CRITICAL 규칙 위반. 반드시 Result<T>로 반환한다.
- 컴포넌트나 훅 코드를 작성하지 마라. 이유: 이 step은 services/ 레이어만 다룬다.
- 기존 services/auth.ts, services/users.ts를 수정하지 마라. 이유: 0-foundation에서 완성된 코드.
- 테스트에서 실제 Firebase에 연결하지 마라. Firebase SDK를 jest.mock으로 대체하라.
