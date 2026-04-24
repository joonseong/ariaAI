import { LIMITS } from '@/lib/constants';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

export function isValidNickname(nickname: string): boolean {
  if (nickname.length < LIMITS.NICKNAME_MIN || nickname.length > LIMITS.NICKNAME_MAX) return false;
  return NICKNAME_REGEX.test(nickname);
}

export function isValidBio(bio: string): boolean {
  return bio.length <= LIMITS.BIO_MAX;
}

export function isValidTitle(title: string): boolean {
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= LIMITS.TITLE_MAX;
}

export function isValidDescription(desc: string): boolean {
  return desc.length <= LIMITS.DESCRIPTION_MAX;
}

export function isValidTag(tag: string): boolean {
  return tag.length >= 1 && tag.length <= 30;
}

export function isValidTags(tags: string[]): boolean {
  if (tags.length > LIMITS.TAGS_MAX) return false;
  return tags.every(isValidTag);
}

export function isValidGuestbookContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.length >= 1 && content.length <= 200;
}

export function isValidReportDescription(desc: string): boolean {
  return desc.length <= 500;
}
