import { initializeApp } from 'firebase/app';
import { initializeAuth, connectAuthEmulator } from 'firebase/auth';
// @firebase/auth exposes getReactNativePersistence under the "react-native" export
// condition (dist/rn/index.js). TypeScript resolves "types" condition first in the
// exports map and uses the browser type declarations, so we suppress the error.
// Metro correctly resolves the react-native bundle at runtime.
// @ts-expect-error – react-native condition exports this; TS sees browser types
import { getReactNativePersistence } from '@firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
