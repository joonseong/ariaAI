import {
  doc,
  getDoc,
  serverTimestamp,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { Result } from '@/types/common';
import { PROMPT_UNLOCK_COST, spendPoints } from '@/services/points';

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
): Promise<Result<string>> {
  try {
    // Verify artwork has a prompt before spending points
    const artworkRef = doc(db, 'artworks', artworkId);
    const artworkSnap = await getDoc(artworkRef);

    if (!artworkSnap.exists()) {
      return { success: false, error: { code: 'not-found', message: '작품을 찾을 수 없습니다.' } };
    }

    const artworkData = artworkSnap.data();
    if (!artworkData.hasPrompt) {
      return { success: false, error: { code: 'no-prompt', message: '이 작품에는 프롬프트가 없습니다.' } };
    }

    // Check if already unlocked
    const unlockId = `${userId}_${artworkId}`;
    const unlockRef = doc(db, 'promptUnlocks', unlockId);
    const existingUnlock = await getDoc(unlockRef);
    if (existingUnlock.exists()) {
      return { success: true, data: artworkData.prompt as string };
    }

    // Spend points and create unlock record atomically
    let promptText = '';

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

      const txRef = doc(db, 'pointTransactions', `tx_${userId}_${artworkId}_${Date.now()}`);
      transaction.set(txRef, {
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

      transaction.set(unlockRef, {
        userId,
        artworkId,
        pointsSpent: PROMPT_UNLOCK_COST,
        createdAt: serverTimestamp(),
      });

      promptText = artworkData.prompt as string;
    });

    return { success: true, data: promptText };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}
