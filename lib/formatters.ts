const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < MINUTE) return '방금 전';
  if (diffSeconds < HOUR) return `${Math.floor(diffSeconds / MINUTE)}분 전`;
  if (diffSeconds < DAY) return `${Math.floor(diffSeconds / HOUR)}시간 전`;

  const diffDays = Math.floor(diffSeconds / DAY);
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}개월 전`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

export function formatCount(count: number): string {
  if (count < 1000) return String(count);

  if (count < 10000) {
    const k = Math.floor(count / 100) / 10;
    return `${k}K`;
  }

  if (count < 1000000) {
    return `${Math.floor(count / 1000)}K`;
  }

  const m = Math.floor(count / 100000) / 10;
  return `${m}M`;
}
