import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import * as reportsService from '@/services/reports';
import { ReportTargetType, ReportReason } from '@/types/report';
import { Result } from '@/types/common';

export function useReport() {
  const user = useAuthStore((state) => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReport = useCallback(
    async (
      targetType: ReportTargetType,
      targetId: string,
      reason: ReportReason,
      detail?: string,
    ): Promise<Result<void>> => {
      if (!user) {
        return {
          success: false,
          error: { code: 'auth/unauthenticated', message: '로그인이 필요합니다.' },
        };
      }

      setIsSubmitting(true);

      const checkResult = await reportsService.checkReported(user.id, targetType, targetId);
      if (checkResult.success && checkResult.data) {
        setIsSubmitting(false);
        return {
          success: false,
          error: { code: 'already-reported', message: '이미 신고한 콘텐츠입니다.' },
        };
      }

      const result = await reportsService.createReport(
        user.id,
        targetType,
        targetId,
        reason,
        detail,
      );
      setIsSubmitting(false);

      if (!result.success) {
        return result;
      }

      return { success: true, data: undefined };
    },
    [user],
  );

  const checkAlreadyReported = useCallback(
    async (targetType: ReportTargetType, targetId: string): Promise<boolean> => {
      if (!user) return false;

      const result = await reportsService.checkReported(user.id, targetType, targetId);
      if (result.success) {
        return result.data;
      }
      return false;
    },
    [user],
  );

  return { isSubmitting, submitReport, checkAlreadyReported };
}
