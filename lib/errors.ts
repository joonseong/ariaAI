import { AppError } from '@/types/common';

const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  'auth/nickname-taken': '이미 사용 중인 닉네임입니다.',
  'auth/email-already-in-use': '이미 가입된 이메일입니다.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/invalid-email': '올바른 이메일 주소를 입력해주세요.',
  'auth/user-not-found': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/wrong-password': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/too-many-requests': '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
  'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
  'auth/user-disabled': '비활성화된 계정입니다.',
  'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.',

  // Firestore
  'permission-denied': '접근 권한이 없습니다.',
  'not-found': '요청한 데이터를 찾을 수 없습니다.',
  'unavailable': '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
  'deadline-exceeded': '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  'resource-exhausted': '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',

  // Storage
  'storage/unauthorized': '파일 업로드 권한이 없습니다.',
  'storage/canceled': '업로드가 취소되었습니다.',
  'storage/retry-limit-exceeded': '업로드에 실패했습니다. 네트워크를 확인해주세요.',
  'storage/invalid-checksum': '파일이 손상되었습니다. 다시 시도해주세요.',
  'storage/quota-exceeded': '저장 공간이 부족합니다.',
};

const DEFAULT_MESSAGE = '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

export function mapFirebaseError(error: unknown): AppError {
  if (__DEV__) {
    console.error('[mapFirebaseError]', error);
  }

  if (
    error != null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    const code = (error as { code: string }).code;
    return {
      code,
      message: ERROR_MESSAGES[code] ?? DEFAULT_MESSAGE,
    };
  }

  if (error instanceof Error) {
    return { code: 'unknown', message: error.message || DEFAULT_MESSAGE };
  }

  return { code: 'unknown', message: DEFAULT_MESSAGE };
}
