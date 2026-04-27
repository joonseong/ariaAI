import {
  doc,
  getDoc,
  serverTimestamp,
  runTransaction,
  increment,
  collection,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { Result } from '@/types/common';
import { PROMPT_UNLOCK_COST } from '@/services/points';

// 100P 중 70CP가 작가에게 지급됨 (나머지 30P는 플랫폼 수수료)
const CREATOR_REWARD_CP = 70;

export async function checkUnlocked(
  userId: string,
  artworkId: string,
): Promise<Result<boolean>> {
  try {
    const unlockId = `${userId}_${artworkId}`;
    const unlockRef = doc(db, 'promptUnlocks', unlockId);
    const unlockSnap = await getDoc(unlockRef);
    return { success: true, data: unlockSnap.exists() };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function unlockPrompt(
  userId: string,
  artworkId: string,
): Promise<Result<{ prompt: string; newBalance: number }>> {
  try {
    const artworkRef = doc(db, 'artworks', artworkId);
    const artworkSnap = await getDoc(artworkRef);

    if (!artworkSnap.exists()) {
      return { success: false, error: { code: 'not-found', message: '작품을 찾을 수 없습니다.' } };
    }

    const artworkData = artworkSnap.data();
    if (!artworkData.hasPrompt) {
      return { success: false, error: { code: 'no-prompt', message: '이 작품에는 프롬프트가 없습니다.' } };
    }

    // Already unlocked — return prompt without charging
    const unlockId = `${userId}_${artworkId}`;
    const unlockRef = doc(db, 'promptUnlocks', unlockId);
    const existingUnlock = await getDoc(unlockRef);
    if (existingUnlock.exists()) {
      const userSnap = await getDoc(doc(db, 'users', userId));
      const balance = (userSnap.data()?.pointBalance as number) ?? 0;
      return { success: true, data: { prompt: artworkData.prompt as string, newBalance: balance } };
    }

    const creatorId = artworkData.authorId as string;
    let promptText = '';
    let newBalance = 0;

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw { code: 'not-found', message: '사용자를 찾을 수 없습니다.' };
      }

      const currentBalance = (userSnap.data().pointBalance as number) ?? 0;
      if (currentBalance < PROMPT_UNLOCK_COST) {
        throw { code: 'insufficient-points', message: '포인트가 부족합니다.' };
      }

      newBalance = currentBalance - PROMPT_UNLOCK_COST;

      // 열람 사용자: P 차감 + pointTransactions 기록
      const ptxRef = doc(collection(db, 'pointTransactions'));
      transaction.set(ptxRef, {
        userId,
        type: 'spend',
        amount: PROMPT_UNLOCK_COST,
        price: null,
        reason: 'prompt_unlock',
        targetId: artworkId,
        iapTransactionId: null,
        createdAt: serverTimestamp(),
      });
      transaction.update(userRef, {
        pointBalance: increment(-PROMPT_UNLOCK_COST),
      });

      // 작가: CP 지급 + creatorPointTransactions 기록
      const creatorRef = doc(db, 'users', creatorId);
      const ctxRef = doc(collection(db, 'creatorPointTransactions'));
      transaction.set(ctxRef, {
        creatorId,
        type: 'earn',
        amount: CREATOR_REWARD_CP,
        reason: 'prompt_view',
        artworkId,
        viewerUserId: userId,
        createdAt: serverTimestamp(),
      });
      transaction.update(creatorRef, {
        creatorPointBalance: increment(CREATOR_REWARD_CP),
      });

      // 잠금 해제 기록
      transaction.set(unlockRef, {
        userId,
        artworkId,
        pointsSpent: PROMPT_UNLOCK_COST,
        createdAt: serverTimestamp(),
      });

      promptText = artworkData.prompt as string;
    });

    return { success: true, data: { prompt: promptText, newBalance } };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export { CREATOR_REWARD_CP };
