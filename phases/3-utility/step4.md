# Step 4: report-edit-delete

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — 컴포넌트 구조
- `/docs/PRD.md` — 3-10. 신고 시스템 (플로우, 사유 선택, 자동 숨김), 3-11. 작품 수정/삭제 (수정 가능 필드, 삭제 플로우, Discard Guard)
- `/hooks/useReport.ts` — 신고 훅 (Step 1에서 생성)
- `/hooks/useArtworkEdit.ts` — 작품 수정 훅 (Step 1에서 생성)
- `/hooks/useArtworkDelete.ts` — 작품 삭제 훅 (Step 1에서 생성)
- `/hooks/useDiscardGuard.ts` — 이탈 방지 훅
- `/components/common/Button.tsx` — 버튼
- `/components/common/Input.tsx` — 입력 필드
- `/components/artwork/TagChip.tsx` — 태그 칩
- `/app/artwork/[id].tsx` — 작품 상세 화면 (더보기 메뉴에 신고/수정/삭제 연동)
- `/types/report.ts` — Report 타입 (Step 0에서 생성)
- `/stores/authStore.ts` — useAuthStore

## 작업

### 1. `components/common/ReportSheet.tsx`

신고 바텀시트 컴포넌트:

```typescript
interface ReportSheetProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
  onReported: () => void;
}

export default function ReportSheet(props: ReportSheetProps): JSX.Element;
```

구현 내용:
- 바텀시트 (Modal 또는 기존 BottomSheet 패턴 활용)
- 신고 사유 선택: 스팸/광고, 불쾌한 콘텐츠, 저작권 침해, 기타
- "기타" 선택 시 TextInput 표시 (최대 500자)
- "신고" 버튼 → useReport.submitReport 호출
- 성공 시 onReported 콜백 + "신고가 접수되었습니다" 토스트 + 시트 닫기
- 이미 신고한 콘텐츠면 시트 열릴 때 "이미 신고한 콘텐츠입니다" 표시

### 2. `app/artwork/edit.tsx`

작품 수정 화면:

```typescript
export default function ArtworkEditScreen(): JSX.Element;
```

구현 내용:
- useArtworkEdit 훅으로 데이터 관리
- 제목 Input (필수, 1~100자)
- 설명 Input (선택, 0~2000자)
- 태그 선택 (프리셋 + 커스텀, 최대 10개)
- "저장" 버튼 → save() 호출 → 성공 시 이전 화면 + "수정되었습니다" 토스트
- useDiscardGuard(isDirty) 이탈 방지
- 이미지는 표시만 (수정 불가 — MVP)

### 3. `app/artwork/[id].tsx` 수정

기존 작품 상세 화면에 더보기 메뉴 기능 연동:

- 더보기(⋯) 메뉴에 ActionSheet 또는 바텀시트 사용:
  - **본인 작품**: "수정" → artwork/edit로 이동, "삭제" → 확인 다이얼로그 → 삭제 처리
  - **타인 작품**: "신고" → ReportSheet 표시
- BookmarkButton 추가 (저장 아이콘)
- 삭제 완료 시 이전 화면으로 이동 + "작품이 삭제되었습니다" 토스트

핵심 규칙:
- 삭제 전 확인 다이얼로그: "이 작품을 삭제하시겠습니까? 삭제된 작품은 복구할 수 없습니다."
- 삭제 중 로딩 인디케이터 표시
- 수정/삭제는 본인 작품에서만 메뉴 노출 (authStore.user.id === artwork.authorId)

## Acceptance Criteria

```bash
npx tsc --noEmit                               # 타입 에러 없음
npx expo export                                # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - 화면/컴포넌트에서 Firebase SDK 직접 import 없는가?
   - 비즈니스 로직이 훅에 분리되어 있는가?
   - ReportSheet가 재사용 가능한 컴포넌트인가? (artwork, guestbook, user 모두 사용 가능)
   - Discard Guard가 작품 수정 화면에 적용되었는가?
3. 결과에 따라 `phases/3-utility/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 화면/컴포넌트에서 Firebase SDK를 직접 import하지 마라.
- 기존 훅이나 서비스를 수정하지 마라.
- artwork/[id].tsx 수정 시 기존 기능(좋아요, 이미지 뷰어, 작가 미니카드)을 깨뜨리지 마라.
- 다른 화면을 수정하지 마라.
