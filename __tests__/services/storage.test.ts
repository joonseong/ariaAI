jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({}));

jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('firebase/storage');

jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}));

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

import { uploadImage, deleteImage, uploadImages } from '@/services/storage';

const mockRef = ref as jest.Mock;
const mockUploadBytesResumable = uploadBytesResumable as jest.Mock;
const mockGetDownloadURL = getDownloadURL as jest.Mock;
const mockDeleteObject = deleteObject as jest.Mock;

// Mock global fetch for blob conversion
const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
global.fetch = jest.fn().mockResolvedValue({
  blob: jest.fn().mockResolvedValue(mockBlob),
}) as jest.Mock;

mockRef.mockImplementation((_storage: unknown, path: string) => ({
  fullPath: path,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRef.mockImplementation((_storage: unknown, path: string) => ({
    fullPath: path,
  }));
  (global.fetch as jest.Mock).mockResolvedValue({
    blob: jest.fn().mockResolvedValue(mockBlob),
  });
});

function createMockUploadTask(success: boolean, error?: unknown) {
  const listeners: Record<string, Function[]> = {};
  const task = {
    on: jest.fn((event: string, next: Function, err: Function, complete: Function) => {
      listeners[event] = [next, err, complete];
      if (success) {
        next({ bytesTransferred: 50, totalBytes: 100 });
        next({ bytesTransferred: 100, totalBytes: 100 });
        complete();
      } else {
        err(error ?? { code: 'storage/unauthorized' });
      }
    }),
    snapshot: { ref: { fullPath: 'test/path' } },
  };
  return task;
}

describe('uploadImage', () => {
  it('성공 시 다운로드 URL을 반환한다', async () => {
    mockUploadBytesResumable.mockReturnValue(createMockUploadTask(true));
    mockGetDownloadURL.mockResolvedValue('https://storage.example.com/image.jpg');

    const result = await uploadImage('artworks/user1/img.jpg', 'file:///photo.jpg');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('https://storage.example.com/image.jpg');
    }
  });

  it('진행률 콜백을 호출한다', async () => {
    mockUploadBytesResumable.mockReturnValue(createMockUploadTask(true));
    mockGetDownloadURL.mockResolvedValue('https://storage.example.com/image.jpg');
    const onProgress = jest.fn();

    await uploadImage('artworks/user1/img.jpg', 'file:///photo.jpg', onProgress);

    expect(onProgress).toHaveBeenCalledWith(0.5);
    expect(onProgress).toHaveBeenCalledWith(1);
  });

  it('업로드 실패 시 Result failure를 반환한다', async () => {
    mockUploadBytesResumable.mockReturnValue(
      createMockUploadTask(false, { code: 'storage/unauthorized' }),
    );

    const result = await uploadImage('artworks/user1/img.jpg', 'file:///photo.jpg');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('storage/unauthorized');
    }
  });

  it('절대 throw하지 않는다', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network error'));

    const result = await uploadImage('path', 'file:///test.jpg');

    expect(result.success).toBe(false);
  });
});

describe('deleteImage', () => {
  it('성공 시 Result<void> success를 반환한다', async () => {
    mockDeleteObject.mockResolvedValue(undefined);

    const result = await deleteImage(
      'https://firebasestorage.googleapis.com/v0/b/bucket/o/artworks%2Fuser1%2Fimg.jpg?alt=media',
    );

    expect(result.success).toBe(true);
  });

  it('삭제 실패 시 Result failure를 반환한다', async () => {
    mockDeleteObject.mockRejectedValue({ code: 'storage/unauthorized' });

    const result = await deleteImage('https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media');

    expect(result.success).toBe(false);
  });

  it('절대 throw하지 않는다', async () => {
    mockDeleteObject.mockRejectedValue(new Error('unexpected'));

    const result = await deleteImage('https://example.com/image.jpg');

    expect(result.success).toBe(false);
  });
});

describe('uploadImages', () => {
  it('여러 이미지를 순차 업로드하고 URL 배열을 반환한다', async () => {
    mockUploadBytesResumable.mockReturnValue(createMockUploadTask(true));
    mockGetDownloadURL
      .mockResolvedValueOnce('https://storage.example.com/img1.jpg')
      .mockResolvedValueOnce('https://storage.example.com/img2.jpg');

    const result = await uploadImages('artworks/user1', [
      'file:///photo1.jpg',
      'file:///photo2.jpg',
    ]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toBe('https://storage.example.com/img1.jpg');
      expect(result.data[1]).toBe('https://storage.example.com/img2.jpg');
    }
  });

  it('전체 진행률 콜백을 호출한다', async () => {
    mockUploadBytesResumable.mockReturnValue(createMockUploadTask(true));
    mockGetDownloadURL.mockResolvedValue('https://storage.example.com/img.jpg');
    const onProgress = jest.fn();

    await uploadImages('artworks/user1', ['file:///a.jpg', 'file:///b.jpg'], onProgress);

    expect(onProgress).toHaveBeenCalledWith(1, 2);
    expect(onProgress).toHaveBeenCalledWith(2, 2);
  });

  it('중간 실패 시 이미 업로드된 이미지를 롤백 삭제한다', async () => {
    mockUploadBytesResumable
      .mockReturnValueOnce(createMockUploadTask(true))
      .mockReturnValueOnce(createMockUploadTask(false, { code: 'storage/unauthorized' }));
    mockGetDownloadURL.mockResolvedValueOnce('https://storage.example.com/img1.jpg');
    mockDeleteObject.mockResolvedValue(undefined);

    const result = await uploadImages('artworks/user1', [
      'file:///photo1.jpg',
      'file:///photo2.jpg',
    ]);

    expect(result.success).toBe(false);
    expect(mockDeleteObject).toHaveBeenCalled();
  });

  it('빈 배열 전달 시 빈 배열을 반환한다', async () => {
    const result = await uploadImages('artworks/user1', []);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });
});
