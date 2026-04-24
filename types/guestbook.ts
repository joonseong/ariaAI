export interface GuestbookMessage {
  id: string;
  authorId: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  content: string;
  replyContent: string | null;
  replyCreatedAt: Date | null;
  createdAt: Date;
}
