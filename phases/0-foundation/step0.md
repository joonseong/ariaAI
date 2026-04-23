# Step 0: project-setup

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — 프로젝트 규칙, 기술 스택, CRITICAL 규칙
- `/docs/ARCHITECTURE.md` — 디렉토리 구조 전체 (lines 1~120)
- `/docs/ADR.md` — ADR-001 (Expo), ADR-004 (Expo Router), ADR-005 (NativeWind)
- `/docs/DESIGN.md` — 색상 팔레트, 타이포그래피

## 작업

### 1. Expo 프로젝트 초기화

프로젝트 루트에서 Expo TypeScript 템플릿으로 프로젝트를 생성한다.

```bash
npx create-expo-app@latest aria --template blank-typescript
```

생성된 파일들을 프로젝트 루트로 이동한다 (aria/ 하위가 아닌 루트에 위치하도록).

### 2. 의존성 설치

아래 패키지들을 설치한다:

**Core:**
- `expo-router` — 파일 기반 라우팅
- `expo-linking`, `expo-constants`, `expo-status-bar` — Expo Router 필수 피어 의존성
- `react-native-safe-area-context`, `react-native-screens` — 네비게이션 필수

**UI:**
- `nativewind@^4` — Tailwind CSS for React Native
- `tailwindcss@^3` — NativeWind 피어 의존성
- `expo-image` — 이미지 캐싱, blurhash
- `react-native-reanimated` — 애니메이션

**State:**
- `zustand` — 글로벌 상태 관리

**Firebase:**
- `firebase` — Firebase JS SDK (v10+)
- `@react-native-async-storage/async-storage` — Firestore 오프라인 캐시 + Auth 토큰 저장

**Utils:**
- `expo-haptics` — 햅틱 피드백
- `expo-image-picker` — 이미지 선택
- `expo-image-manipulator` — 이미지 리사이징/압축

**Dev:**
- `jest`, `@testing-library/react-native`, `jest-expo` — 테스트
- `@types/react` — TypeScript 타입

### 3. NativeWind v4 설정

`tailwind.config.js` 파일을 프로젝트 루트에 생성한다:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        surface: '#1A1A1A',
        elevated: '#262626',
        'accent-primary': '#8B5CF6',
        'accent-hover': '#7C3AED',
        'accent-heart': '#EF4444',
        'text-primary': '#F5F5F5',
        'text-secondary': '#A3A3A3',
        'text-tertiary': '#808080',
        'semantic-error': '#EF4444',
        'semantic-success': '#22C55E',
        'semantic-warning': '#F59E0B',
        border: '#2A2A2A',
      },
    },
  },
  plugins: [],
};
```

`global.css` 파일을 프로젝트 루트에 생성:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`babel.config.js`에 NativeWind 프리셋을 추가:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

`metro.config.js` 파일을 생성:
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

`nativewind-env.d.ts` 파일을 프로젝트 루트에 생성:
```typescript
/// <reference types="nativewind/types" />
```

### 4. TypeScript 설정

`tsconfig.json`에 아래 설정을 적용한다:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts", "nativewind-env.d.ts"]
}
```

### 5. 디렉토리 구조 생성

ARCHITECTURE.md에 정의된 디렉토리 구조를 생성한다. 빈 디렉토리에는 `.gitkeep` 파일을 둔다:

```
app/
  (auth)/
  (tabs)/
    home/
    search/
    upload/
    profile/
components/
  common/
  feed/
  guestbook/
hooks/
services/
stores/
types/
lib/
assets/
  icons/
  images/
    empty-states/
__tests__/
  lib/
  hooks/
  services/
```

### 6. Jest 설정

`jest.config.js` 파일을 생성한다:

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterSetup: ['@testing-library/react-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

### 7. app.json 업데이트

`app.json`에 아래 설정을 적용한다:

```json
{
  "expo": {
    "name": "Aria",
    "slug": "aria",
    "version": "1.0.0",
    "scheme": "aria",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "platforms": ["ios", "android"],
    "plugins": [
      "expo-router"
    ]
  }
}
```

### 8. .env.example 업데이트

프로젝트 루트의 `.env.example` 파일을 업데이트한다:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

## Acceptance Criteria

```bash
cd /Users/kimjoonseong/Desktop/claude/harness_framework-main
npx expo export --platform web 2>&1 | head -20   # 빌드 에러 없음 (또는 npx tsc --noEmit)
npx jest --passWithNoTests                         # Jest 설정 정상
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - ARCHITECTURE.md 디렉토리 구조를 따르는가?
   - ADR 기술 스택(Expo SDK 52+, NativeWind v4, TypeScript strict)을 벗어나지 않았는가?
   - CLAUDE.md CRITICAL 규칙을 위반하지 않았는가?
3. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- Firebase SDK를 직접 초기화하지 마라. Firebase 설정은 Step 3(firebase-config)에서 한다.
- 화면(Screen) 컴포넌트를 만들지 마라. 이 step에서는 디렉토리 구조와 설정 파일만 다룬다.
- `app/` 폴더에 실제 라우트 파일을 만들지 마라. 빈 디렉토리 구조만 생성한다. 단, Expo Router가 요구하는 최소한의 `app/_layout.tsx`와 `app/index.tsx`는 placeholder로 생성한다.
- 기존 docs/ 폴더의 문서를 수정하지 마라.
