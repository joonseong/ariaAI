export type NotificationType = 'content_hidden' | 'content_restored';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  targetType: 'artwork' | null;
  targetId: string | null;
  isRead: boolean;
  createdAt: Date;
}
