import { formatRelativeTime, formatCount } from '@/lib/formatters';

describe('formatRelativeTime', () => {
  const now = new Date('2026-04-24T12:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('0~59초 전은 "방금 전"을 반환한다', () => {
    expect(formatRelativeTime(new Date('2026-04-24T12:00:00Z'))).toBe('방금 전');
    expect(formatRelativeTime(new Date('2026-04-24T11:59:01Z'))).toBe('방금 전');
  });

  it('1~59분 전은 "N분 전"을 반환한다', () => {
    expect(formatRelativeTime(new Date('2026-04-24T11:59:00Z'))).toBe('1분 전');
    expect(formatRelativeTime(new Date('2026-04-24T11:30:00Z'))).toBe('30분 전');
    expect(formatRelativeTime(new Date('2026-04-24T11:01:00Z'))).toBe('59분 전');
  });

  it('1~23시간 전은 "N시간 전"을 반환한다', () => {
    expect(formatRelativeTime(new Date('2026-04-24T11:00:00Z'))).toBe('1시간 전');
    expect(formatRelativeTime(new Date('2026-04-24T00:00:00Z'))).toBe('12시간 전');
    expect(formatRelativeTime(new Date('2026-04-23T13:00:00Z'))).toBe('23시간 전');
  });

  it('1~6일 전은 "N일 전"을 반환한다', () => {
    expect(formatRelativeTime(new Date('2026-04-23T12:00:00Z'))).toBe('1일 전');
    expect(formatRelativeTime(new Date('2026-04-18T12:00:00Z'))).toBe('6일 전');
  });

  it('7~29일 전은 "N주 전"을 반환한다', () => {
    expect(formatRelativeTime(new Date('2026-04-17T12:00:00Z'))).toBe('1주 전');
    expect(formatRelativeTime(new Date('2026-04-10T12:00:00Z'))).toBe('2주 전');
    expect(formatRelativeTime(new Date('2026-03-26T12:00:00Z'))).toBe('4주 전');
  });

  it('30일~11개월 전은 "N개월 전"을 반환한다', () => {
    expect(formatRelativeTime(new Date('2026-03-25T12:00:00Z'))).toBe('1개월 전');
    expect(formatRelativeTime(new Date('2025-06-24T12:00:00Z'))).toBe('10개월 전');
  });

  it('12개월 이상은 절대 날짜(YYYY.MM.DD)를 반환한다', () => {
    expect(formatRelativeTime(new Date('2025-04-24T12:00:00Z'))).toBe('2025.04.24');
    expect(formatRelativeTime(new Date('2024-01-01T00:00:00Z'))).toBe('2024.01.01');
  });
});

describe('formatCount', () => {
  it('0~999는 그대로 표시한다', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(1)).toBe('1');
    expect(formatCount(423)).toBe('423');
    expect(formatCount(999)).toBe('999');
  });

  it('1,000~9,999는 소수점 1자리로 표시한다', () => {
    expect(formatCount(1000)).toBe('1K');
    expect(formatCount(1200)).toBe('1.2K');
    expect(formatCount(1234)).toBe('1.2K');
    expect(formatCount(9999)).toBe('9.9K');
  });

  it('10,000~999,999는 소수점 없이 표시한다', () => {
    expect(formatCount(10000)).toBe('10K');
    expect(formatCount(12500)).toBe('12K');
    expect(formatCount(123456)).toBe('123K');
    expect(formatCount(999999)).toBe('999K');
  });

  it('1,000,000 이상은 M으로 표시한다', () => {
    expect(formatCount(1000000)).toBe('1M');
    expect(formatCount(1200000)).toBe('1.2M');
    expect(formatCount(12000000)).toBe('12M');
  });
});
