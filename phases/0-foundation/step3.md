# Step 3: firebase-config

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (.env 파일과 Firebase 설정 키를 코드에 하드코딩하지 말 것)
- `/docs/ARCHITECTURE.md` — "Firebase 설정 구조" 섹션 (lib/firebase.ts 전체 코드), Emulator 연결 코드
- `/docs/FIREBASE_SETUP.md` — 환경 변수 목록, .env.example
- `/docs/ADR.md` — ADR-002 (Firebase 선택 이유)
- `/lib/constants.ts` — Step 2에서 생성된 상수 확인
- `/.env.example` — 환경 변수 템플릿 확인

## 작업

### 1. `lib/firebase.ts`

ARCHITECTURE.md의 "Firebase 설정 구조" 섹션을 정확히 구현한다:

```typescript
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 환경 변수에서 Firebase 설정값을 읽어온다
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export const storage = getStorage(app);

// 개발 환경에서 Firebase Emulator 연결
if (__DEV__) {
  // connectAuthEmulator, connectFirestoreEmulator, connectStorageEmulator
  // ARCHITECTURE.md의 Emulator 연결 코드를 구현
}
```

핵심 규칙:
- 모든 Firebase 설정값은 `process.env.EXPO_PUBLIC_*` 환경 변수로만 참조한다
- 하드코딩된 API 키가 코드에 존재하면 안 된다
- Emulator 연결은 `__DEV__` 가드 안에서만 수행한다
- `auth`, `db`, `storage` 세 인스턴스만 export한다

### 2. `.env.example` 업데이트

기존 `.env.example`을 확인하고, 없는 항목이 있으면 추가한다. 주석으로 각 값을 어디서 찾는지 안내한다.

## Acceptance Criteria

```bash
npx tsc --noEmit   # 타입 에러 없음
```

참고: Firebase 프로젝트가 아직 설정되지 않았으므로 런타임 테스트는 불가. 타입 체크만 통과하면 된다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 하드코딩된 Firebase 설정값이 없는가? (grep으로 확인: `grep -r "AIzaSy" lib/`)
   - ARCHITECTURE.md의 Firebase 초기화 코드와 일치하는가?
   - `__DEV__` 가드가 Emulator 코드를 감싸고 있는가?
3. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다.

## 금지사항

- Firebase 설정값을 코드에 직접 하드코딩하지 마라. 이유: 보안 위험 + 환경 분리 불가.
- `lib/firebase.ts` 외의 파일에서 Firebase SDK를 직접 import하지 마라. 이유: CLAUDE.md CRITICAL 규칙 — 모든 Firebase 호출은 services/ 래퍼를 통해야 한다. 이 step에서는 초기화만 담당한다.
- services/ 폴더에 파일을 만들지 마라. 서비스 레이어는 Step 4부터 시작한다.
