import {
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  increment,
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { Result, PaginatedResult } from '@/types/common';
import { PointTransaction, PointPackage } from '@/types/points';

const PROMPT_UNLOCK_COST = 100;

interface FirestoreTimestamp {
  toDate: () => Date;
}

function toPointTransaction(id: string, data: Record<string, unknown>): PointTransaction {
  return {
    id,
    userId: data.userId as string,
    type: data.type as 'purchase' | 'spend',
    amount: data.amount as number,
    price: (data.price as number | null) ?? null,
    reason: (data.reason as string | null) ?? null,
    targetId: (data.targetId as string | null) ?? null,
    iapTransactionId: (data.iapTransactionId as string | null) ?? null,
    createdAt: (data.createdAt as FirestoreTimestamp).toDate(),
  };
}

export async function getPointBalance(userId: string): Promise<Result<number>> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, error: { code: 'not-found', message: '사용자를 찾을 수 없습니다.' } };
    }

    const balance = (userSnap.data().pointBalance as number) ?? 0;
    return { success: true, data: balance };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function spendPoints(
  userId: string,
  amount: number,
  reason: string,
  targetId: string | null,
): Promise<Result<number>> {
  try {
    let newBalance = 0;

    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw { code: 'not-found', message: '사용자를 찾을 수 없습니다.' };
      }

      const currentBalance = (userSnap.data().pointBalance as number) ?? 0;
      if (currentBalance < amount) {
        throw { code: 'insufficient-points', message: '포인트가 부족합니다.' };
      }

      newBalance = currentBalance - amount;

      const txRef = doc(collection(db, 'pointTransactions'));
      transaction.set(txRef, {
        userId,
        type: 'spend',
        amount,
        price: null,
        reason,
        targetId,
        iapTransactionId: null,
        createdAt: serverTimestamp(),
      });

      transaction.update(userRef, {
        pointBalance: increment(-amount),
        updatedAt: serverTimestamp(),
      });
    });

    return { success: true, data: newBalance };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function purchasePoints(
  userId: string,
  packageId: string,
  points: number,
  price: number,
  iapTransactionId: string,
): Promise<Result<number>> {
  try {
    let newBalance = 0;

    await runTransaction(db, async (transaction) => {
      // Idempotency: check if this IAP transaction was already processed
      const txQuery = query(
        collection(db, 'pointTransactions'),
        where('iapTransactionId', '==', iapTransactionId),
        firestoreLimit(1),
      );
      const existing = await getDocs(txQuery);
      if (!existing.empty) {
        const userSnap = await transaction.get(doc(db, 'users', userId));
        newBalance = (userSnap.data()?.pointBalance as number) ?? 0;
        return;
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw { code: 'not-found', message: '사용자를 찾을 수 없습니다.' };
      }

      newBalance = ((userSnap.data().pointBalance as number) ?? 0) + points;

      const txRef = doc(collection(db, 'pointTransactions'));
      transaction.set(txRef, {
        userId,
        type: 'purchase',
        amount: points,
        price,
        reason: `package:${packageId}`,
        targetId: null,
        iapTransactionId,
        createdAt: serverTimestamp(),
      });

      transaction.update(userRef, {
        pointBalance: increment(points),
        updatedAt: serverTimestamp(),
      });
    });

    return { success: true, data: newBalance };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getTransactionHistory(
  userId: string,
  cursor?: Date,
  limit?: number,
): Promise<Result<PaginatedResult<PointTransaction>>> {
  try {
    const pageSize = limit ?? 20;
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    if (cursor) {
      constraints.push(startAfter(Timestamp.fromDate(cursor)));
    }
    constraints.push(firestoreLimit(pageSize));

    const q = query(collection(db, 'pointTransactions'), ...constraints);
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => toPointTransaction(d.id, d.data()));
    const lastItem = items[items.length - 1] ?? null;

    return {
      success: true,
      data: {
        items,
        hasMore: items.length >= pageSize,
        lastCursor: lastItem?.createdAt ?? null,
      },
    };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export async function getPointPackages(): Promise<Result<PointPackage[]>> {
  try {
    const q = query(
      collection(db, 'pointPackages'),
      where('isActive', '==', true),
      orderBy('order', 'asc'),
    );
    const snapshot = await getDocs(q);
    const packages = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<PointPackage, 'id'>),
    }));
    return { success: true, data: packages };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

export { PROMPT_UNLOCK_COST };
