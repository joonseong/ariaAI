import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import * as guestbooksService from '@/services/guestbooks';
import { GuestbookMessage } from '@/types/guestbook';
import { Result } from '@/types/common';

const SPAM_WINDOW_MS = 60 * 1000; // 1분
const SPAM_MAX_COUNT = 3;

export function useGuestbook(artistId: string) {
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<Date | undefined>(undefined);

  // 스팸 방지: 최근 전송 타임스탬프 목록
  const sentTimestampsRef = useRef<number[]>([]);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    cursorRef.current = undefined;
    setHasMore(true);

    const result = await guestbooksService.getGuestbookMessages(artistId);
    if (result.success) {
      setMessages(result.data.items);
      setHasMore(result.data.hasMore);
      cursorRef.current = result.data.lastCursor as Date | undefined;
    }

    setIsLoading(false);
  }, [artistId]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const result = await guestbooksService.getGuestbookMessages(
      artistId,
      cursorRef.current,
    );
    if (result.success) {
      setMessages((prev) => [...prev, ...result.data.items]);
      setHasMore(result.data.hasMore);
      cursorRef.current = result.data.lastCursor as Date | undefined;
    }

    setIsLoadingMore(false);
  }, [artistId, isLoadingMore, hasMore]);

  const sendMessage = useCallback(
    async (content: string): Promise<Result<void>> => {
      if (!user) {
        return {
          success: false,
          error: { code: 'unauthenticated', message: '로그인이 필요합니다.' },
        };
      }

      // 스팸 방지: 1분 내 3회 초과 차단
      const now = Date.now();
      sentTimestampsRef.current = sentTimestampsRef.current.filter(
        (ts) => now - ts < SPAM_WINDOW_MS,
      );
      if (sentTimestampsRef.current.length >= SPAM_MAX_COUNT) {
        return {
          success: false,
          error: {
            code: 'rate-limited',
            message: '잠시 후 다시 작성해주세요.',
          },
        };
      }

      const result = await guestbooksService.createGuestbookMessage(
        artistId,
        user.id,
        user.nickname,
        content,
      );

      if (result.success) {
        sentTimestampsRef.current.push(now);
        // 새 메시지를 로컬 상태에 낙관적으로 추가
        const newMessage: GuestbookMessage = {
          id: result.data,
          authorId: user.id,
          authorNickname: user.nickname,
          authorProfileImageUrl: user.profileImageUrl,
          content,
          replyContent: null,
          replyCreatedAt: null,
          createdAt: new Date(),
        };
        setMessages((prev) => [newMessage, ...prev]);
        return { success: true, data: undefined };
      }

      return result as Result<void>;
    },
    [user, artistId],
  );

  const sendReply = useCallback(
    async (messageId: string, content: string): Promise<Result<void>> => {
      if (!user) {
        return {
          success: false,
          error: { code: 'unauthenticated', message: '로그인이 필요합니다.' },
        };
      }

      const result = await guestbooksService.createReply(
        messageId,
        artistId,
        content,
      );

      if (result.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, replyContent: content, replyCreatedAt: new Date() }
              : msg,
          ),
        );
      }

      return result;
    },
    [user, artistId],
  );

  const deleteMessage = useCallback(
    async (messageId: string): Promise<Result<void>> => {
      if (!user) {
        return {
          success: false,
          error: { code: 'unauthenticated', message: '로그인이 필요합니다.' },
        };
      }

      // 낙관적 삭제
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      const result = await guestbooksService.deleteGuestbookMessage(
        messageId,
        user.id,
        artistId,
      );

      if (!result.success) {
        // 삭제 실패 시 롤백은 하지 않음 (재로딩으로 복원)
        await loadMessages();
      }

      return result;
    },
    [user, artistId, loadMessages],
  );

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMessages,
    loadMore,
    sendMessage,
    sendReply,
    deleteMessage,
  };
}
