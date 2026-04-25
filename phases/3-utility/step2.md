# Step 2: search-screen

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — 네비게이션 구조 ((tabs)/search.tsx)
- `/docs/PRD.md` — 3-8. 검색 (기본 동작, 에러/엣지 케이스, prefix 매칭 안내)
- `/hooks/useSearch.ts` — 검색 훅 (Step 1에서 생성)
- `/components/artwork/ArtworkGrid.tsx` — 작품 그리드 (2-social에서 생성)
- `/components/artist/UserListItem.tsx` — 유저 리스트 아이템 (2-social에서 생성)
- `/components/common/EmptyState.tsx` — 빈 상태
- `/app/(tabs)/search/index.tsx` — 기존 검색 탭 (있으면 교체)
- `/app/(tabs)/home/index.tsx` — 피드 화면 패턴 참조
- `/lib/constants.ts` — COLORS

## 작업

### 1. `app/(tabs)/search/index.tsx` 재구현

검색 탭 화면:

```typescript
export default function SearchScreen(): JSX.Element;
```

구현 내용:
- **검색 바**: TextInput + 돋보기 아이콘 + 클리어(X) 버튼
- **초기 상태** (검색 전): 인기 태그 칩 목록 + 최근 검색어 목록
  - 최근 검색어: 각 항목에 X(삭제) 버튼 + 상단에 "전체 삭제" 버튼
  - 인기 태그: TagChip 컴포넌트 사용, 탭하면 해당 태그로 검색
- **검색 결과**: "작품" | "작가" 탭 전환
  - 작품 탭: 2열 그리드 (FlatList numColumns={2}), 각 아이템 탭 시 작품 상세로 이동
  - 작가 탭: UserListItem 리스트
- **검색 결과 0건**: "검색 결과가 없습니다" + "작품이나 작가의 앞부분을 입력해보세요" 힌트
- **무한 스크롤**: 결과 하단에서 추가 로딩

핵심 규칙:
- 검색 바 포커스 시 키보드 올라옴
- 결과 항목 탭 시 키보드 자동 내림 (Keyboard.dismiss)
- 디바운싱 500ms (useSearch 훅에서 처리)
- 검색어 최대 50자

## Acceptance Criteria

```bash
npx tsc --noEmit                               # 타입 에러 없음
npx expo export                                # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - 화면에서 Firebase SDK 직접 import 없는가?
   - 비즈니스 로직이 useSearch 훅에 분리되어 있는가?
3. 결과에 따라 `phases/3-utility/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 화면에서 Firebase SDK를 직접 import하지 마라.
- 기존 훅이나 컴포넌트를 수정하지 마라.
- 다른 탭 화면을 수정하지 마라.
