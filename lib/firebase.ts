import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  connectAuthEmulator,
  type Persistence,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Metro(React Native bundler) resolves the "react-native" export condition at
// runtime, making getReactNativePersistence available from "firebase/auth".
// TypeScript, however, picks the top-level "types" condition (browser-only)
// where this symbol does not exist. The require + cast below keeps the runtime
// behavior correct while satisfying the type checker.
const { getReactNativePersistence } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('firebase/auth') as {
    getReactNativePersistence: (
      storage: typeof AsyncStorage,
    ) => Persistence;
  };

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

// Firebase Emulator 연결은 로컬 에뮬레이터를 실행 중일 때만 사용
// 실제 Firebase 프로젝트에 연결하려면 이 블록을 비활성화
// if (__DEV__) {
//   connectAuthEmulator(auth, 'http://localhost:9099', {
//     disableWarnings: true,
//   });
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectStorageEmulator(storage, 'localhost', 9199);
// }
