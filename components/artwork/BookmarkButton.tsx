import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Animated } from 'react-native';
import { useBookmark } from '@/hooks/useBookmark';
import { useAuthStore } from '@/stores/authStore';
import { LoginPromptSheet } from '@/components/common/LoginPromptSheet';
import { haptics } from '@/lib/haptics';

interface BookmarkButtonProps {
  artworkId: string;
  initialBookmarked: boolean;
}

export default function BookmarkButton({
  artworkId,
  initialBookmarked,
}: BookmarkButtonProps) {
  const user = useAuthStore((state) => state.user);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { bookmarked, toggle } = useBookmark(artworkId, initialBookmarked);
  const scale = useRef(new Animated.Value(1)).current;
  const prevBookmarked = useRef(bookmarked);

  useEffect(() => {
    if (bookmarked && !prevBookmarked.current) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevBookmarked.current = bookmarked;
  }, [bookmarked, scale]);

  const handlePress = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    haptics.light();
    await toggle();
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={bookmarked ? '저장 취소' : '저장'}
      >
        <Animated.Text
          className={`text-xl ${bookmarked ? 'text-accent-primary' : 'text-text-tertiary'}`}
          style={{ transform: [{ scale }] }}
        >
          {bookmarked ? '\u2605' : '\u2606'}
        </Animated.Text>
      </Pressable>

      <LoginPromptSheet
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="저장하려면 로그인이 필요합니다"
      />
    </>
  );
}
