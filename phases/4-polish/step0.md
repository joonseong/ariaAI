# Step 0: network-haptics

## 읽어야 할 파일

- `/CLAUDE.md` — CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — "오프라인 대응" 섹션, "햅틱 피드백" 섹션, hooks/useNetworkStatus.ts
- `/docs/PRD.md` — 오프라인 동작 규칙 테이블, 4-3. 햅틱 피드백 테이블
- `/lib/constants.ts` — COLORS
- `/components/common/Toast.tsx` — 토스트 컴포넌트
- `/hooks/useLike.ts` — 햅틱 추가 대상
- `/hooks/useFollow.ts` — 햅틱 추가 대상
- `/hooks/useBookmark.ts` — 햅틱 추가 대상
- `/app/_layout.tsx` — 루트 레이아웃 (OfflineBanner 배치 위치)

## 작업

### 1. `hooks/useNetworkStatus.ts`

네트워크 상태 감지 훅:

```typescript
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // @react-native-community/netinfo 사용
  // 네트워크 상태 변경 시 자동 업데이트

  return { isConnected };
}
```

### 2. `components/common/OfflineBanner.tsx`

오프라인 상태 배너:

```typescript
export default function OfflineBanner(): JSX.Element | null;
```

구현 내용:
- useNetworkStatus 사용
- 오프라인 시 화면 상단에 고정 배너 표시: "인터넷에 연결되어 있지 않습니다"
- 온라인 복귀 시 배너 숨김 (페이드아웃)
- 배경색: warning (#F59E0B)

### 3. `app/_layout.tsx` 수정

- OfflineBanner를 루트 레이아웃에 추가 (모든 화면에서 표시)

### 4. `lib/haptics.ts`

햅틱 피드백 유틸:

```typescript
import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  selection: () => Haptics.selectionAsync(),
};
```

### 5. 기존 훅에 햅틱 피드백 추가

PRD 4-3 기준으로 기존 훅에 haptics 호출 추가:
- `hooks/useLike.ts`: toggle 시 `haptics.light()`
- `hooks/useFollow.ts`: toggle 시 `haptics.light()`
- `hooks/useBookmark.ts`: toggle 시 `haptics.light()`

## Acceptance Criteria

```bash
npx tsc --noEmit                               # 타입 에러 없음
npx expo export                                # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트:
   - useNetworkStatus가 @react-native-community/netinfo를 사용하는가?
   - OfflineBanner가 루트 레이아웃에 배치되었는가?
   - 햅틱 호출이 적절한 위치에 추가되었는가?
3. 결과에 따라 `phases/4-polish/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 기존 훅의 비즈니스 로직을 변경하지 마라. haptics 호출 한 줄만 추가한다.
- 서비스 코드를 수정하지 마라.
