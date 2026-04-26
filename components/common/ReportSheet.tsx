import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { ReportTargetType, ReportReason } from '@/types/report';
import { useReport } from '@/hooks/useReport';
import { showToast } from '@/stores/toastStore';

interface ReportSheetProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
  onReported: () => void;
}

const REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: '스팸/광고' },
  { value: 'offensive', label: '불쾌한 콘텐츠' },
  { value: 'copyright', label: '저작권 침해' },
  { value: 'other', label: '기타' },
];

export default function ReportSheet({
  visible,
  targetType,
  targetId,
  onClose,
  onReported,
}: ReportSheetProps) {
  const { isSubmitting, submitReport, checkAlreadyReported } = useReport();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSelectedReason(null);
      setDetail('');
      setAlreadyReported(false);
      return;
    }
    setChecking(true);
    checkAlreadyReported(targetType, targetId).then((result) => {
      setAlreadyReported(result);
      setChecking(false);
    });
  }, [visible, targetType, targetId, checkAlreadyReported]);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    const result = await submitReport(
      targetType,
      targetId,
      selectedReason,
      selectedReason === 'other' ? detail.trim() || undefined : undefined,
    );

    if (!result.success) {
      showToast(result.error.message, 'error');
      return;
    }

    showToast('신고가 접수되었습니다', 'success');
    onReported();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end bg-black/50"
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-2xl bg-surface px-6 pb-10 pt-6"
          onPress={() => {}}
        >
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full bg-elevated" />
          </View>

          <Text className="mb-4 text-lg font-bold text-text-primary">신고</Text>

          {checking ? (
            <ActivityIndicator color="#F53356" size="small" />
          ) : alreadyReported ? (
            <Text className="py-6 text-center text-sm text-text-secondary">
              이미 신고한 콘텐츠입니다
            </Text>
          ) : (
            <>
              <View className="mb-4 gap-2">
                {REASON_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setSelectedReason(option.value)}
                    className="flex-row items-center rounded-lg bg-elevated px-4 py-3"
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedReason === option.value }}
                  >
                    <View
                      className={`mr-3 h-5 w-5 rounded-full border-2 items-center justify-center ${
                        selectedReason === option.value
                          ? 'border-accent-primary'
                          : 'border-text-tertiary'
                      }`}
                    >
                      {selectedReason === option.value && (
                        <View className="h-2.5 w-2.5 rounded-full bg-accent-primary" />
                      )}
                    </View>
                    <Text className="text-sm text-text-primary">{option.label}</Text>
                  </Pressable>
                ))}
              </View>

              {selectedReason === 'other' && (
                <View className="mb-4">
                  <TextInput
                    className="rounded-lg bg-elevated px-4 py-3 text-sm text-text-primary min-h-[80px]"
                    placeholder="신고 사유를 입력해주세요 (최대 500자)"
                    placeholderTextColor="#808080"
                    value={detail}
                    onChangeText={setDetail}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                    accessibilityLabel="신고 사유 입력"
                  />
                </View>
              )}

              <Pressable
                onPress={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                className={`h-12 items-center justify-center rounded-xl ${
                  !selectedReason || isSubmitting ? 'bg-elevated opacity-50' : 'bg-accent-primary'
                }`}
                accessibilityRole="button"
                accessibilityLabel="신고 제출"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#F5F5F5" size="small" />
                ) : (
                  <Text className="text-sm font-semibold text-text-primary">신고</Text>
                )}
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
