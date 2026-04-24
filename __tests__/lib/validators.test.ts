import {
  isValidEmail,
  isValidPassword,
  isValidNickname,
  isValidBio,
  isValidTitle,
  isValidDescription,
  isValidTag,
  isValidTags,
  isValidGuestbookContent,
  isValidReportDescription,
} from '@/lib/validators';

describe('isValidEmail', () => {
  it('올바른 이메일 형식을 허용한다', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.kr')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('잘못된 형식을 거부한다', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-email')).toBe(false);
    expect(isValidEmail('@no-local.com')).toBe(false);
    expect(isValidEmail('no-domain@')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('8자 이상 영문+숫자 포함 비밀번호를 허용한다', () => {
    expect(isValidPassword('abcdef12')).toBe(true);
    expect(isValidPassword('Password1')).toBe(true);
    expect(isValidPassword('a1b2c3d4e5')).toBe(true);
  });

  it('8자 미만을 거부한다', () => {
    expect(isValidPassword('abc123')).toBe(false);
    expect(isValidPassword('a1')).toBe(false);
  });

  it('숫자만 있는 비밀번호를 거부한다', () => {
    expect(isValidPassword('12345678')).toBe(false);
  });

  it('영문만 있는 비밀번호를 거부한다', () => {
    expect(isValidPassword('abcdefgh')).toBe(false);
  });

  it('빈 문자열을 거부한다', () => {
    expect(isValidPassword('')).toBe(false);
  });
});

describe('isValidNickname', () => {
  it('2~20자 한글/영문/숫자/밑줄 닉네임을 허용한다', () => {
    expect(isValidNickname('아리아')).toBe(true);
    expect(isValidNickname('ab')).toBe(true);
    expect(isValidNickname('user_name')).toBe(true);
    expect(isValidNickname('닉네임123')).toBe(true);
    expect(isValidNickname('a'.repeat(20))).toBe(true);
  });

  it('1자 이하를 거부한다', () => {
    expect(isValidNickname('')).toBe(false);
    expect(isValidNickname('a')).toBe(false);
  });

  it('20자 초과를 거부한다', () => {
    expect(isValidNickname('a'.repeat(21))).toBe(false);
  });

  it('특수문자를 거부한다', () => {
    expect(isValidNickname('user@name')).toBe(false);
    expect(isValidNickname('user!name')).toBe(false);
    expect(isValidNickname('user#name')).toBe(false);
  });

  it('공백을 거부한다', () => {
    expect(isValidNickname('user name')).toBe(false);
    expect(isValidNickname(' user')).toBe(false);
  });
});

describe('isValidBio', () => {
  it('150자 이내 소개를 허용한다', () => {
    expect(isValidBio('')).toBe(true);
    expect(isValidBio('안녕하세요')).toBe(true);
    expect(isValidBio('a'.repeat(150))).toBe(true);
  });

  it('150자 초과를 거부한다', () => {
    expect(isValidBio('a'.repeat(151))).toBe(false);
  });
});

describe('isValidTitle', () => {
  it('1~100자 제목을 허용한다', () => {
    expect(isValidTitle('작품')).toBe(true);
    expect(isValidTitle('a')).toBe(true);
    expect(isValidTitle('a'.repeat(100))).toBe(true);
  });

  it('빈 문자열을 거부한다', () => {
    expect(isValidTitle('')).toBe(false);
  });

  it('공백만 있는 문자열을 거부한다', () => {
    expect(isValidTitle('   ')).toBe(false);
    expect(isValidTitle('\t\n')).toBe(false);
  });

  it('100자 초과를 거부한다', () => {
    expect(isValidTitle('a'.repeat(101))).toBe(false);
  });
});

describe('isValidDescription', () => {
  it('2000자 이내 설명을 허용한다', () => {
    expect(isValidDescription('')).toBe(true);
    expect(isValidDescription('설명')).toBe(true);
    expect(isValidDescription('a'.repeat(2000))).toBe(true);
  });

  it('2000자 초과를 거부한다', () => {
    expect(isValidDescription('a'.repeat(2001))).toBe(false);
  });
});

describe('isValidTag', () => {
  it('1~30자 태그를 허용한다', () => {
    expect(isValidTag('Midjourney')).toBe(true);
    expect(isValidTag('a')).toBe(true);
    expect(isValidTag('a'.repeat(30))).toBe(true);
  });

  it('빈 태그를 거부한다', () => {
    expect(isValidTag('')).toBe(false);
  });

  it('30자 초과를 거부한다', () => {
    expect(isValidTag('a'.repeat(31))).toBe(false);
  });
});

describe('isValidTags', () => {
  it('10개 이하 태그를 허용한다', () => {
    expect(isValidTags([])).toBe(true);
    expect(isValidTags(['tag1', 'tag2'])).toBe(true);
    expect(isValidTags(Array(10).fill('tag'))).toBe(true);
  });

  it('10개 초과를 거부한다', () => {
    expect(isValidTags(Array(11).fill('tag'))).toBe(false);
  });

  it('유효하지 않은 태그가 포함되면 거부한다', () => {
    expect(isValidTags(['', 'valid'])).toBe(false);
    expect(isValidTags(['a'.repeat(31)])).toBe(false);
  });
});

describe('isValidGuestbookContent', () => {
  it('1~200자 메시지를 허용한다', () => {
    expect(isValidGuestbookContent('안녕하세요')).toBe(true);
    expect(isValidGuestbookContent('a')).toBe(true);
    expect(isValidGuestbookContent('a'.repeat(200))).toBe(true);
  });

  it('빈 메시지를 거부한다', () => {
    expect(isValidGuestbookContent('')).toBe(false);
  });

  it('공백만 있는 메시지를 거부한다', () => {
    expect(isValidGuestbookContent('   ')).toBe(false);
  });

  it('200자 초과를 거부한다', () => {
    expect(isValidGuestbookContent('a'.repeat(201))).toBe(false);
  });
});

describe('isValidReportDescription', () => {
  it('500자 이내 신고 사유를 허용한다', () => {
    expect(isValidReportDescription('')).toBe(true);
    expect(isValidReportDescription('사유')).toBe(true);
    expect(isValidReportDescription('a'.repeat(500))).toBe(true);
  });

  it('500자 초과를 거부한다', () => {
    expect(isValidReportDescription('a'.repeat(501))).toBe(false);
  });
});
