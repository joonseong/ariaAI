import { mapFirebaseError } from '@/lib/errors';

describe('mapFirebaseError', () => {
  it('Firebase Auth 에러 코드를 한국어 메시지로 변환한다', () => {
    const error = { code: 'auth/email-already-in-use' };
    const result = mapFirebaseError(error);
    expect(result).toEqual({
      code: 'auth/email-already-in-use',
      message: '이미 가입된 이메일입니다.',
    });
  });

  it('auth/invalid-email 에러를 변환한다', () => {
    const result = mapFirebaseError({ code: 'auth/invalid-email' });
    expect(result.code).toBe('auth/invalid-email');
    expect(result.message).toBe('올바른 이메일 주소를 입력해주세요.');
  });

  it('auth/user-not-found와 auth/wrong-password는 동일 메시지를 반환한다', () => {
    const notFound = mapFirebaseError({ code: 'auth/user-not-found' });
    const wrongPw = mapFirebaseError({ code: 'auth/wrong-password' });
    expect(notFound.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
    expect(wrongPw.message).toBe(notFound.message);
  });

  it('auth/too-many-requests 에러를 변환한다', () => {
    const result = mapFirebaseError({ code: 'auth/too-many-requests' });
    expect(result.message).toBe('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.');
  });

  it('auth/network-request-failed 에러를 변환한다', () => {
    const result = mapFirebaseError({ code: 'auth/network-request-failed' });
    expect(result.message).toBe('네트워크 연결을 확인해주세요.');
  });

  it('auth/user-disabled 에러를 변환한다', () => {
    const result = mapFirebaseError({ code: 'auth/user-disabled' });
    expect(result.message).toBe('비활성화된 계정입니다.');
  });

  it('auth/requires-recent-login 에러를 변환한다', () => {
    const result = mapFirebaseError({ code: 'auth/requires-recent-login' });
    expect(result.message).toBe('보안을 위해 다시 로그인해주세요.');
  });

  it('Firestore 에러 코드를 변환한다', () => {
    expect(mapFirebaseError({ code: 'permission-denied' }).message).toBe('접근 권한이 없습니다.');
    expect(mapFirebaseError({ code: 'not-found' }).message).toBe('요청한 데이터를 찾을 수 없습니다.');
    expect(mapFirebaseError({ code: 'unavailable' }).message).toBe('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    expect(mapFirebaseError({ code: 'deadline-exceeded' }).message).toBe('요청 시간이 초과되었습니다. 다시 시도해주세요.');
    expect(mapFirebaseError({ code: 'resource-exhausted' }).message).toBe('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
  });

  it('Storage 에러 코드를 변환한다', () => {
    expect(mapFirebaseError({ code: 'storage/unauthorized' }).message).toBe('파일 업로드 권한이 없습니다.');
    expect(mapFirebaseError({ code: 'storage/canceled' }).message).toBe('업로드가 취소되었습니다.');
    expect(mapFirebaseError({ code: 'storage/retry-limit-exceeded' }).message).toBe('업로드에 실패했습니다. 네트워크를 확인해주세요.');
    expect(mapFirebaseError({ code: 'storage/invalid-checksum' }).message).toBe('파일이 손상되었습니다. 다시 시도해주세요.');
    expect(mapFirebaseError({ code: 'storage/quota-exceeded' }).message).toBe('저장 공간이 부족합니다.');
  });

  it('매핑되지 않는 에러 코드는 기본 메시지를 반환한다', () => {
    const result = mapFirebaseError({ code: 'unknown/error' });
    expect(result).toEqual({
      code: 'unknown/error',
      message: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    });
  });

  it('code 속성이 없는 객체는 unknown 코드와 기본 메시지를 반환한다', () => {
    const result = mapFirebaseError(new Error('something'));
    expect(result.code).toBe('unknown');
    expect(result.message).toBe('알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  });

  it('null을 전달해도 throw하지 않는다', () => {
    expect(() => mapFirebaseError(null)).not.toThrow();
    const result = mapFirebaseError(null);
    expect(result.code).toBe('unknown');
  });

  it('undefined를 전달해도 throw하지 않는다', () => {
    expect(() => mapFirebaseError(undefined)).not.toThrow();
    const result = mapFirebaseError(undefined);
    expect(result.code).toBe('unknown');
  });

  it('문자열을 전달해도 throw하지 않는다', () => {
    expect(() => mapFirebaseError('error string')).not.toThrow();
    const result = mapFirebaseError('error string');
    expect(result.code).toBe('unknown');
  });

  it('반환값이 AppError 타입과 일치한다', () => {
    const result = mapFirebaseError({ code: 'auth/invalid-email' });
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('message');
    expect(typeof result.code).toBe('string');
    expect(typeof result.message).toBe('string');
  });
});
