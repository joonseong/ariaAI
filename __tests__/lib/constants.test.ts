import { COLORS, LIMITS } from '@/lib/constants';

describe('COLORS', () => {
  it('bg 색상이 DESIGN.md와 일치한다', () => {
    expect(COLORS.bg.primary).toBe('#0D0D0D');
    expect(COLORS.bg.surface).toBe('#1A1A1A');
    expect(COLORS.bg.elevated).toBe('#262626');
  });

  it('text 색상이 DESIGN.md와 일치한다', () => {
    expect(COLORS.text.primary).toBe('#F5F5F5');
    expect(COLORS.text.secondary).toBe('#A3A3A3');
    expect(COLORS.text.tertiary).toBe('#808080');
  });

  it('accent 색상이 DESIGN.md와 일치한다', () => {
    expect(COLORS.accent.primary).toBe('#F53356');
    expect(COLORS.accent.primaryHover).toBe('#D42549');
    expect(COLORS.accent.heart).toBe('#F53356');
  });

  it('semantic 색상이 DESIGN.md와 일치한다', () => {
    expect(COLORS.semantic.error).toBe('#EF4444');
    expect(COLORS.semantic.success).toBe('#22C55E');
    expect(COLORS.semantic.warning).toBe('#F59E0B');
    expect(COLORS.semantic.border).toBe('#2A2A2A');
  });
});

describe('LIMITS', () => {
  it('닉네임 제한이 PRD와 일치한다', () => {
    expect(LIMITS.NICKNAME_MIN).toBe(2);
    expect(LIMITS.NICKNAME_MAX).toBe(20);
  });

  it('콘텐츠 제한이 PRD와 일치한다', () => {
    expect(LIMITS.BIO_MAX).toBe(150);
    expect(LIMITS.TITLE_MAX).toBe(100);
    expect(LIMITS.DESCRIPTION_MAX).toBe(2000);
    expect(LIMITS.TAGS_MAX).toBe(10);
  });

  it('이미지 제한이 PRD와 일치한다', () => {
    expect(LIMITS.IMAGES_MAX).toBe(5);
    expect(LIMITS.IMAGE_SIZE_MB).toBe(10);
  });

  it('페이지네이션 제한이 ARCHITECTURE와 일치한다', () => {
    expect(LIMITS.FEED_PAGE_SIZE).toBe(20);
    expect(LIMITS.GUESTBOOK_PAGE_SIZE).toBe(20);
  });
});
