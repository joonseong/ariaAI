import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';

export function useDiscardGuard(isDirty: boolean) {
  const navigation = useNavigation();

  useEffect(() => {
    if (!isDirty) return;

    const unsubscribe = navigation.addListener('beforeRemove', (e: { preventDefault: () => void; data: { action: unknown } }) => {
      e.preventDefault();
      Alert.alert(
        '작성 중인 내용이 있습니다',
        '나가시면 작성 중인 내용이 사라집니다.',
        [
          { text: '계속 작성', style: 'cancel' },
          {
            text: '나가기',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action as never),
          },
        ],
      );
    });

    return unsubscribe;
  }, [isDirty, navigation]);
}
