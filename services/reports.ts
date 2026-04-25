import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { mapFirebaseError } from '@/lib/errors';
import { Result } from '@/types/common';
import { ReportReason, ReportTargetType } from '@/types/report';

// 신고 생성 — 중복 신고 방지, reportCount 증가, 5건 이상 시 자동 숨김
export async function createReport(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: ReportReason,
  detail?: string,
): Promise<Result<string>> {
  const reportId = `${reporterId}_${targetType}_${targetId}`;

  try {
    await runTransaction(db, async (transaction) => {
      const reportRef = doc(db, 'reports', reportId);
      const reportSnap = await transaction.get(reportRef);

      if (reportSnap.exists()) {
        throw { code: 'already-reported', message: '이미 신고한 콘텐츠입니다.' };
      }

      transaction.set(reportRef, {
        reporterId,
        targetType,
        targetId,
        reason,
        description: detail ?? null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // 작품 신고 시 reportCount 증가 + 5건 이상이면 자동 숨김
      if (targetType === 'artwork') {
        const artworkRef = doc(db, 'artworks', targetId);
        const artworkSnap = await transaction.get(artworkRef);

        if (artworkSnap.exists()) {
          const currentCount = artworkSnap.data().reportCount as number;
          const newCount = currentCount + 1;
          const updates: Record<string, unknown> = { reportCount: increment(1) };
          if (newCount >= 5) {
            updates.isHidden = true;
          }
          transaction.update(artworkRef, updates);
        }
      }
    });

    return { success: true, data: reportId };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}

// 이미 신고했는지 확인
export async function checkReported(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
): Promise<Result<boolean>> {
  const reportId = `${reporterId}_${targetType}_${targetId}`;

  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportSnap = await getDoc(reportRef);

    return { success: true, data: reportSnap.exists() };
  } catch (error) {
    return { success: false, error: mapFirebaseError(error) };
  }
}
