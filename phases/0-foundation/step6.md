# Step 6: ui-foundation

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/docs/ARCHITECTURE.md` — "UX 인프라 패턴" 섹션 전체 (토스트 시스템, 햅틱 피드백), "로딩 상태 패턴" 섹션 (스켈레톤), "에러 표시 계층" 섹션 (ErrorState, EmptyState)
- `/docs/DESIGN.md` — 색상 팔레트, 컴포넌트 규격 (버튼, 카드, 하단 탭 바), 타이포그래피
- `/docs/PRD.md` — 4-4. 토스트 규격 (위치, 자동 닫힘, 스타일), 빈 상태별 UX (3-12)
- `/lib/constants.ts` — COLORS, LIMITS (Step 2에서 생성)
- `/lib/haptics.ts` — haptics 유틸 (Step 2에서 생성)
- `/tailwind.config.js` — 커스텀 색상 (Step 0에서 생성)

## 작업

`components/common/` 폴더에 공통 UI 컴포넌트를 생성한다. 모든 컴포넌트는 NativeWind(Tailwind CSS)로 스타일링한다.

### 1. `components/common/Toast.tsx` + `stores/toastStore.ts`

ARCHITECTURE.md의 토스트 시스템을 구현한다:

```typescript
// stores/toastStore.ts
interface Toast {
  id: string;
  message: string;
  type: 'default' | 'error' | 'success';
}

// 전역에서 showToast() 호출 가능
export function showToast(message: string, type?: Toast['type']): void { ... }
```

```typescript
// components/common/Toast.tsx
// 루트 레이아웃에 <ToastContainer /> 배치
// 화면 하단에서 올라오는 애니메이션 (SafeArea 내부, 탭 바 위)
// 3초 후 자동 사라짐
// error → semantic-error 배경, success → semantic-success 배경, default → surface 배경
```

PRD 4-4 토스트 규격:
- 위치: 화면 하단, 탭 바 바로 위
- 자동 닫힘: 3초
- 수동 닫힘: 우측 X 버튼 또는 스와이프
- 동시 1개만 표시 (새 토스트가 기존 토스트를 대체)

### 2. `components/common/ErrorState.tsx`

에러 발생 시 화면 전체를 덮는 에러 표시 컴포넌트:

```typescript
interface ErrorStateProps {
  message: string;           // "피드를 불러올 수 없습니다"
  onRetry?: () => void;      // 재시도 버튼 콜백
}
```

- 중앙에 에러 아이콘 + 메시지 + "다시 시도" 버튼
- 다크 모드 스타일 (bg-primary 배경)

### 3. `components/common/EmptyState.tsx`

데이터가 없을 때 표시하는 빈 상태 컴포넌트:

```typescript
interface EmptyStateProps {
  message: string;           // "아직 작품이 없습니다"
  actionLabel?: string;      // "작가를 팔로우해보세요"
  onAction?: () => void;     // CTA 버튼 콜백
}
```

- 중앙에 일러스트(placeholder) + 메시지 + 선택적 CTA 버튼

### 4. `components/common/Skeleton.tsx`

로딩 중 표시할 스켈레톤 shimmer 컴포넌트:

```typescript
interface SkeletonProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
}
```

- shimmer 애니메이션 (좌→우 반복 그라디언트)
- bg-elevated 기반 색상

### 5. `components/common/Button.tsx`

DESIGN.md의 버튼 규격을 구현한다:

```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}
```

- Primary: bg-accent-primary, 높이 48px, 라운드 12px, 텍스트 #F5F5F5
- Secondary: border border-border, 높이 40px, 라운드 8px
- disabled 상태: opacity 0.5, onPress 무시
- loading 상태: ActivityIndicator 표시, onPress 무시

### 6. `components/common/Input.tsx`

텍스트 입력 컴포넌트:

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;            // 에러 메시지 (인라인 표시)
  secureTextEntry?: boolean;
  maxLength?: number;
  multiline?: boolean;
}
```

- bg-elevated 배경, 라운드 8px
- 에러 시: border semantic-error + 하단 에러 메시지 표시
- placeholder 색상: text-tertiary

## Acceptance Criteria

```bash
npx tsc --noEmit   # 타입 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 모든 컴포넌트가 NativeWind 클래스명을 사용하는가? (StyleSheet.create 사용 금지)
   - 색상이 DESIGN.md 토큰과 일치하는가? (하드코딩 색상값 없이 Tailwind 클래스 사용)
   - 각 컴포넌트가 200줄을 넘지 않는가?
   - 컴포넌트에 비즈니스 로직이 없는가?
3. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다.

## 금지사항

- `StyleSheet.create`를 사용하지 마라. 이유: ADR-005 결정에 따라 NativeWind를 사용한다.
- 컴포넌트에 Firebase 호출이나 비즈니스 로직을 넣지 마라. 이유: CLAUDE.md CRITICAL 규칙.
- 색상값을 하드코딩하지 마라. 이유: `tailwind.config.js`에 정의된 커스텀 색상 클래스를 사용해야 일관성이 유지된다.
- 화면(Screen) 컴포넌트를 만들지 마라. 이 step에서는 `components/common/` 폴더의 재사용 가능한 UI 부품만 다룬다.
