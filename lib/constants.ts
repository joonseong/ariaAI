export const COLORS = {
  bg: { primary: '#0D0D0D', surface: '#1A1A1A', elevated: '#262626' },
  text: { primary: '#F5F5F5', secondary: '#A3A3A3', tertiary: '#808080' },
  accent: { primary: '#8B5CF6', primaryHover: '#7C3AED', heart: '#EF4444' },
  semantic: { error: '#EF4444', success: '#22C55E', warning: '#F59E0B', border: '#2A2A2A' },
} as const;

export const LIMITS = {
  NICKNAME_MIN: 2,
  NICKNAME_MAX: 20,
  BIO_MAX: 150,
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 2000,
  TAGS_MAX: 10,
  IMAGES_MAX: 5,
  IMAGE_SIZE_MB: 10,
  FEED_PAGE_SIZE: 20,
  GUESTBOOK_PAGE_SIZE: 20,
} as const;
