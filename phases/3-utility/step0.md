# Step 0: utility-services

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (서비스에서 throw 금지, Result<T> 반환)
- `/docs/ARCHITECTURE.md` — "비즈니스 로직 분리" 섹션, services/ 디렉토리 구조
- `/docs/PRD.md` — 3-8. 검색 (prefix 매칭, 디바운싱), 3-9. 프로필 설정 (닉네임 수정, 프로필 사진, 회원 탈퇴), 3-10. 신고 시스템, 3-11. 작품 수정/삭제
- `/types/common.ts` — Result<T>, PaginatedResult<T>
- `/types/user.ts` — User 타입
- `/types/artwork.ts` — Artwork 타입
- `/types/report.ts` — Report, ReportReason 타입 (없으면 생성)
- `/lib/firebase.ts` — db, storage 인스턴스
- `/lib/errors.ts` — mapFirebaseError
- `/lib/validators.ts` — 기존 검증 함수
- `/services/auth.ts` — 기존 패턴 참조
- `/services/artworks.ts` — 기존 CRUD 패턴 참조
- `/services/users.ts` — 기존 getUserProfile, updateNickname 패턴 참조
- `/services/storage.ts` — uploadImage, deleteImage 패턴 참조

## 작업

### 1. `types/report.ts` (신규 생성)

```typescript
export type ReportReason = 'spam' | 'offensive' | 'copyright' | 'other';
export type ReportTargetType = 'artwork' | 'guestbook' | 'user';

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  detail?: string;  // 기타 사유 시 직접 입력 (최대 500자)
  createdAt: Date;
}
```

### 2. `services/search.ts` (신규 생성)

검색 서비스 — v2에서 Algolia로 교체 용이하도록 격리:

```typescript
// 작품 검색 — prefix 매칭
export async function searchArtworks(
  query: string,
  cursor?: Date,
  limit?: number
): Promise<Result<PaginatedResult<Artwork>>> { ... }

// 작가 검색 — 닉네임 prefix 매칭
export async function searchUsers(
  query: string,
  cursor?: Date,
  limit?: number
): Promise<Result<PaginatedResult<User>>> { ... }

// 태그로 작품 검색 — array-contains
export async function searchByTag(
  tag: string,
  cursor?: Date,
  limit?: number
): Promise<Result<PaginatedResult<Artwork>>> { ... }

// 인기 태그 조회 (MVP: Firestore에서 가장 많이 사용된 태그 상위 10개)
export async function getPopularTags(): Promise<Result<string[]>> { ... }
```

핵심 규칙:
- 작품 검색: `where('title', '>=', query).where('title', '<=', query + '\uf8ff')` prefix 매칭
- 작가 검색: `where('normalizedNickname', '>=', normalized).where('normalizedNickname', '<=', normalized + '\uf8ff')`
- 빈 쿼리는 빈 결과 반환 (검색 실행하지 않음)
- 검색어 최대 50자

### 3. `services/reports.ts` (신규 생성)

신고 서비스:

```typescript
// 신고 생성
export async function createReport(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: ReportReason,
  detail?: string
): Promise<Result<string>> { ... }

// 이미 신고했는지 확인
export async function checkReported(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string
): Promise<Result<boolean>> { ... }
```

핵심 규칙:
- reports/{reporterId}_{targetType}_{targetId} 문서 ID로 중복 신고 방지
- 신고 생성 시 대상 콘텐츠의 reportCount 증가 (Transaction)
- reportCount >= 5이면 대상 콘텐츠의 isHidden = true로 자동 숨김

### 4. `services/users.ts` 확장

기존 users.ts에 프로필 수정 및 탈퇴 관련 함수 추가:

```typescript
// 프로필 사진 업로드 + 사용자 문서 업데이트
export async function updateProfileImage(
  userId: string,
  imageUri: string
): Promise<Result<string>> { ... }  // 반환: 새 이미지 URL

// 한 줄 소개 수정
export async function updateBio(
  userId: string,
  bio: string
): Promise<Result<void>> { ... }

// 회원 탈퇴 — 데이터 삭제 (PRD 3-9 탈퇴 플로우 참조)
export async function deleteAccount(userId: string): Promise<Result<void>> { ... }
```

핵심 규칙:
- updateProfileImage: Storage에 업로드 → users 문서 profileImageUrl 업데이트. 기존 이미지는 삭제
- updateBio: 최대 150자 검증
- deleteAccount: artworks, likes, follows, bookmarks, guestbook messages 순차 삭제 후 users 문서 삭제. Firebase Auth 계정 삭제는 클라이언트(훅)에서 처리

### 5. `services/artworks.ts` 확장

기존 artworks.ts에 수정/삭제 함수 추가:

```typescript
// 작품 수정 (제목, 설명, 태그만 — 이미지 변경 불가)
export async function updateArtwork(
  artworkId: string,
  authorId: string,
  updates: { title?: string; description?: string; tags?: string[] }
): Promise<Result<void>> { ... }

// 작품 삭제 — 관련 데이터 정리
export async function deleteArtwork(
  artworkId: string,
  authorId: string
): Promise<Result<void>> { ... }
```

핵심 규칙:
- updateArtwork: authorId 일치 확인 후 업데이트. 타입 검증 (title 1~100자, description 0~2000자, tags 0~10개)
- deleteArtwork: artworks 문서 삭제 → 해당 작품의 likes 전체 삭제 → Storage 이미지 삭제 → users.artworksCount -1

## Acceptance Criteria

```bash
npx tsc --noEmit                                # 타입 에러 없음
npx jest __tests__/services/search.test.ts     # 검색 테스트 통과
npx jest __tests__/services/reports.test.ts    # 신고 테스트 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - 모든 서비스 함수가 Result<T>를 반환하는가?
   - Firebase SDK를 lib/firebase.ts에서만 import하는가?
   - 신고 중복 방지가 구현되었는가?
   - deleteArtwork에서 관련 데이터(likes, storage)도 정리하는가?
3. 결과에 따라 `phases/3-utility/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 서비스 함수에서 throw하지 마라. Result<T>로 반환한다.
- 컴포넌트나 훅 코드를 작성하지 마라.
- 기존 services/auth.ts, services/likes.ts, services/follows.ts, services/bookmarks.ts, services/guestbooks.ts, services/storage.ts를 수정하지 마라.
- services/artworks.ts는 updateArtwork, deleteArtwork만 추가. 기존 함수를 수정하지 마라.
- services/users.ts는 updateProfileImage, updateBio, deleteAccount만 추가. 기존 함수를 수정하지 마라.
