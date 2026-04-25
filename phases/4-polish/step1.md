# Step 1: onboarding

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — 네비게이션 구조
- `/docs/PRD.md` — 3-12. 온보딩 (3단계 플로우, AsyncStorage 상태 관리, 건너뛰기)
- `/app/_layout.tsx` — 루트 레이아웃 (온보딩 분기 추가)
- `/stores/authStore.ts` — useAuthStore
- `/components/artist/FollowButton.tsx` — 추천 작가 팔로우
- `/components/common/Avatar.tsx` — 작가 카드
- `/components/artwork/TagChip.tsx` — 도구 선택 칩
- `/lib/constants.ts` — 프리셋 도구 태그

## 작업

### 1. `hooks/useOnboarding.ts`

온보딩 상태 관리 훅:

```typescript
export function useOnboarding() {
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);  // null = 로딩 중
  const [step, setStep] = useState(0);  // 0, 1, 2
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const checkCompleted: () => Promise<void>;  // AsyncStorage에서 확인
  const complete: () => Promise<void>;  // AsyncStorage에 저장 + isCompleted = true
  const skip: () => Promise<void>;  // 즉시 완료 처리
  const nextStep: () => void;

  return { isCompleted, step, selectedTools, setSelectedTools, checkCompleted, complete, skip, nextStep };
}
```

### 2. `app/onboarding.tsx`

온보딩 화면:

```typescript
export default function OnboardingScreen(): JSX.Element;
```

구현 내용:
- **Step 0**: 환영 화면 — "환영합니다! Aria에서 AI 작품을 공유해보세요" + 앱 소개 일러스트 (placeholder View)
- **Step 1**: 도구 선택 — 프리셋 도구 태그 칩 (Midjourney, DALL-E 등) 다중 선택. 스킵 가능
- **Step 2**: 추천 작가 팔로우 — 인기 작가 5명 카드 + FollowButton. 스킵 가능
- 하단: "다음" / "건너뛰기" 버튼
- 마지막 step에서 "시작하기" → complete() 호출 → 홈 피드로 이동

핵심 규칙:
- 도구 선택은 선택 사항 (스킵 시 빈 배열로 저장)
- 팔로우도 선택 사항
- 건너뛰기 탭 시 skip() → 즉시 홈 피드로 이동

### 3. `app/_layout.tsx` 수정

루트 레이아웃에 온보딩 분기 추가:
- authStore.isInitialized && user !== null && !onboardingCompleted → 온보딩 화면
- 온보딩 완료 후 → (tabs) 그룹

## Acceptance Criteria

```bash
npx tsc --noEmit                               # 타입 에러 없음
npx expo export                                # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - AsyncStorage에 온보딩 상태가 저장되는가?
   - 건너뛰기가 정상 작동하는가?
   - 루트 레이아웃 분기가 올바른가?
3. 결과에 따라 `phases/4-polish/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 온보딩에서 Firebase SDK를 직접 import하지 마라.
- 기존 인증 플로우를 깨뜨리지 마라.
- 기존 탭 화면을 수정하지 마라.
