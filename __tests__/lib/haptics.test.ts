import { haptics } from '@/lib/haptics';
import * as Haptics from 'expo-haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Error: 'error',
    Warning: 'warning',
  },
}));

describe('haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('light는 ImpactFeedbackStyle.Light로 호출한다', () => {
    haptics.light();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('medium은 ImpactFeedbackStyle.Medium으로 호출한다', () => {
    haptics.medium();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('success는 NotificationFeedbackType.Success로 호출한다', () => {
    haptics.success();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
  });

  it('error는 NotificationFeedbackType.Error로 호출한다', () => {
    haptics.error();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
  });

  it('warning은 NotificationFeedbackType.Warning으로 호출한다', () => {
    haptics.warning();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
  });

  it('selection은 selectionAsync를 호출한다', () => {
    haptics.selection();
    expect(Haptics.selectionAsync).toHaveBeenCalled();
  });
});
