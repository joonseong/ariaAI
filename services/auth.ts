import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  deleteUser,
  onAuthStateChanged,
  signInWithCredential,
  signInWithCustomToken,
  OAuthProvider,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { login as kakaoLogin } from '@react-native-kakao/user';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { Result } from '@/types/common';
import { User, SignUpInput } from '@/types/user';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

interface FirestoreTimestamp {
  toDate: () => Date;
}

function toUser(uid: string, data: Record<string, unknown>): User {
  return {
    id: uid,
    email: data.email as string,
    nickname: data.nickname as string,
    normalizedNickname: data.normalizedNickname as string,
    bio: data.bio as string,
    profileImageUrl: (data.profileImageUrl as string | null) ?? null,
    followersCount: data.followersCount as number,
    followingCount: data.followingCount as number,
    artworksCount: data.artworksCount as number,
    bookmarksCount: data.bookmarksCount as number,
    pointBalance: (data.pointBalance as number) ?? 0,
    creatorPointBalance: (data.creatorPointBalance as number) ?? 0,
    loginProvider: data.loginProvider as 'email' | 'google' | 'apple' | 'kakao',
    isDeleted: data.isDeleted as boolean,
    createdAt: (data.createdAt as FirestoreTimestamp).toDate(),
    updatedAt: (data.updatedAt as FirestoreTimestamp).toDate(),
  };
}

async function getOrCreateSocialUser(
  firebaseUser: FirebaseUser,
  provider: 'google' | 'apple' | 'kakao',
  displayName?: string | null,
  email?: string | null,
): Promise<Result<User>> {
  const uid = firebaseUser.uid;
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    if (data.isDeleted) {
      await firebaseSignOut(auth);
      return {
        success: false,
        error: { code: 'auth/user-disabled', message: '비활성화된 계정입니다.' },
      };
    }
    return { success: true, data: toUser(uid, data) };
  }

  // New social user — create Firestore doc
  const baseNickname = (displayName ?? `user_${uid.slice(0, 8)}`).slice(0, 20);
  const normalized = baseNickname.toLowerCase().trim();
  const socialEmail = email ?? `${provider}_${uid}@aria.social`;
  const now = new Date();

  const userData = {
    email: socialEmail,
    nickname: baseNickname,
    normalizedNickname: normalized,
    bio: '',
    profileImageUrl: null,
    followersCount: 0,
    followingCount: 0,
    artworksCount: 0,
    bookmarksCount: 0,
    pointBalance: 0,
    creatorPointBalance: 0,
    loginProvider: provider,
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await runTransaction(db, async (transaction) => {
      const nicknameRef = doc(db, 'nicknames', normalized);
      const nicknameSnap = await transaction.get(nicknameRef);

      let finalNickname = baseNickname;
      let finalNormalized = normalized;
      if (nicknameSnap.exists()) {
        finalNickname = `${baseNickname}_${uid.slice(0, 4)}`;
        finalNormalized = finalNickname.toLowerCase();
        userData.nickname = finalNickname;
        userData.normalizedNickname = finalNormalized;
        const altNicknameRef = doc(db, 'nicknames', finalNormalized);
        transaction.set(altNicknameRef, { userId: uid, createdAt: serverTimestamp() });
      } else {
        transaction.set(nicknameRef, { userId: uid, createdAt: serverTimestamp() });
      }
      transaction.set(userRef, userData);
    });
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }

  return {
    success: true,
    data: {
      id: uid,
      email: userData.email,
      nickname: userData.nickname,
      normalizedNickname: userData.normalizedNickname,
      bio: '',
      profileImageUrl: null,
      followersCount: 0,
      followingCount: 0,
      artworksCount: 0,
      bookmarksCount: 0,
      pointBalance: 0,
      creatorPointBalance: 0,
      loginProvider: provider,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    },
  };
}

export async function signUpWithEmail(
  input: SignUpInput,
): Promise<Result<User>> {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      input.email,
      input.password,
    );
    const uid = credential.user.uid;
    const normalized = input.nickname.toLowerCase().trim();
    const now = new Date();

    await runTransaction(db, async (transaction) => {
      const nicknameRef = doc(db, 'nicknames', normalized);
      const nicknameSnap = await transaction.get(nicknameRef);

      if (nicknameSnap.exists()) {
        throw { code: 'auth/nickname-taken', message: '이미 사용 중인 닉네임입니다.' };
      }

      const userRef = doc(db, 'users', uid);
      transaction.set(nicknameRef, {
        userId: uid,
        createdAt: serverTimestamp(),
      });
      transaction.set(userRef, {
        email: input.email,
        nickname: input.nickname,
        normalizedNickname: normalized,
        bio: '',
        profileImageUrl: null,
        followersCount: 0,
        followingCount: 0,
        artworksCount: 0,
        bookmarksCount: 0,
        pointBalance: 0,
        creatorPointBalance: 0,
        loginProvider: 'email',
        isDeleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    return {
      success: true,
      data: {
        id: uid,
        email: input.email,
        nickname: input.nickname,
        normalizedNickname: normalized,
        bio: '',
        profileImageUrl: null,
        followersCount: 0,
        followingCount: 0,
        artworksCount: 0,
        bookmarksCount: 0,
        pointBalance: 0,
        creatorPointBalance: 0,
        loginProvider: 'email',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      },
    };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<Result<User>> {
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const uid = credential.user.uid;

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        success: false,
        error: { code: 'not-found', message: '요청한 데이터를 찾을 수 없습니다.' },
      };
    }

    const data = userSnap.data();

    if (data.isDeleted) {
      await firebaseSignOut(auth);
      return {
        success: false,
        error: { code: 'auth/user-disabled', message: '비활성화된 계정입니다.' },
      };
    }

    return { success: true, data: toUser(uid, data) };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function signInWithGoogle(): Promise<Result<User>> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult.data?.idToken;
    if (!idToken) {
      return { success: false, error: { code: 'auth/google-no-token', message: 'Google 로그인에 실패했습니다.' } };
    }
    const { GoogleAuthProvider } = await import('firebase/auth');
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;
    return getOrCreateSocialUser(
      firebaseUser,
      'google',
      firebaseUser.displayName,
      firebaseUser.email,
    );
  } catch (error: unknown) {
    if (
      error != null &&
      typeof error === 'object' &&
      'code' in error
    ) {
      const code = (error as { code: string }).code;
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: { code: 'auth/cancelled', message: '로그인이 취소되었습니다.' } };
      }
      if (code === statusCodes.IN_PROGRESS) {
        return { success: false, error: { code: 'auth/in-progress', message: '이미 로그인 중입니다.' } };
      }
    }
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function signInWithApple(): Promise<Result<User>> {
  try {
    const nonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    const { identityToken } = credential;
    if (!identityToken) {
      return { success: false, error: { code: 'auth/apple-no-token', message: 'Apple 로그인에 실패했습니다.' } };
    }

    const provider = new OAuthProvider('apple.com');
    const oauthCredential = provider.credential({
      idToken: identityToken,
      rawNonce: nonce,
    });
    const userCredential = await signInWithCredential(auth, oauthCredential);
    const firebaseUser = userCredential.user;

    const displayName = credential.fullName
      ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
      : null;

    return getOrCreateSocialUser(
      firebaseUser,
      'apple',
      displayName || firebaseUser.displayName,
      credential.email || firebaseUser.email,
    );
  } catch (error: unknown) {
    if (
      error != null &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'ERR_REQUEST_CANCELED'
    ) {
      return { success: false, error: { code: 'auth/cancelled', message: '로그인이 취소되었습니다.' } };
    }
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function signInWithKakao(): Promise<Result<User>> {
  try {
    const kakaoToken = await kakaoLogin();
    if (!kakaoToken.accessToken) {
      return { success: false, error: { code: 'auth/kakao-no-token', message: '카카오 로그인에 실패했습니다.' } };
    }

    // Exchange Kakao access token for Firebase custom token via Cloud Function
    const cfUrl = process.env.EXPO_PUBLIC_KAKAO_FIREBASE_CF_URL;
    if (!cfUrl) {
      return {
        success: false,
        error: { code: 'auth/not-configured', message: '카카오 로그인 서버 설정이 필요합니다.' },
      };
    }

    const response = await fetch(cfUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: kakaoToken.accessToken }),
    });

    if (!response.ok) {
      return { success: false, error: { code: 'auth/kakao-cf-error', message: '카카오 로그인에 실패했습니다.' } };
    }

    const { firebaseToken, uid, nickname, email } = await response.json() as {
      firebaseToken: string;
      uid: string;
      nickname?: string;
      email?: string;
    };

    const userCredential = await signInWithCustomToken(auth, firebaseToken);
    return getOrCreateSocialUser(userCredential.user, 'kakao', nickname ?? null, email ?? null);
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function signOut(): Promise<Result<void>> {
  try {
    await firebaseSignOut(auth);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function sendPasswordReset(
  email: string,
): Promise<Result<void>> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getCurrentUser(uid: string): Promise<Result<User>> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return {
        success: false,
        error: { code: 'not-found', message: '요청한 데이터를 찾을 수 없습니다.' },
      };
    }

    return { success: true, data: toUser(uid, userSnap.data()) };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function deleteAccount(uid: string): Promise<Result<void>> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isDeleted: true,
      updatedAt: serverTimestamp(),
    });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function deleteCurrentUser(): Promise<Result<void>> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: { code: 'auth/no-current-user', message: '로그인이 필요합니다.' },
      };
    }
    await deleteUser(currentUser);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export function subscribeToAuthState(
  callback: (uid: string | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    callback(firebaseUser?.uid ?? null);
  });
}
