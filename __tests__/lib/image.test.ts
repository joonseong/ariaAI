import { resizeImage, compressImage, validateImageSize } from '@/lib/image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
}));

const mockManipulate = ImageManipulator.manipulateAsync as jest.MockedFunction<typeof ImageManipulator.manipulateAsync>;
const mockGetInfo = FileSystem.getInfoAsync as jest.MockedFunction<typeof FileSystem.getInfoAsync>;

describe('resizeImage', () => {
  it('기본 maxWidth 2048px로 리사이징한다', async () => {
    mockManipulate.mockResolvedValue({ uri: 'resized-uri', width: 2048, height: 1536 } as ImageManipulator.ImageResult);

    const result = await resizeImage('original-uri');
    expect(result).toBe('resized-uri');
    expect(mockManipulate).toHaveBeenCalledWith(
      'original-uri',
      [{ resize: { width: 2048 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
    );
  });

  it('커스텀 maxWidth로 리사이징한다', async () => {
    mockManipulate.mockResolvedValue({ uri: 'resized-uri', width: 1024, height: 768 } as ImageManipulator.ImageResult);

    await resizeImage('original-uri', 1024);
    expect(mockManipulate).toHaveBeenCalledWith(
      'original-uri',
      [{ resize: { width: 1024 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
    );
  });
});

describe('compressImage', () => {
  it('기본 quality 0.8로 압축한다', async () => {
    mockManipulate.mockResolvedValue({ uri: 'compressed-uri', width: 100, height: 100 } as ImageManipulator.ImageResult);

    const result = await compressImage('original-uri');
    expect(result).toBe('compressed-uri');
    expect(mockManipulate).toHaveBeenCalledWith(
      'original-uri',
      [],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
    );
  });

  it('커스텀 quality로 압축한다', async () => {
    mockManipulate.mockResolvedValue({ uri: 'compressed-uri', width: 100, height: 100 } as ImageManipulator.ImageResult);

    await compressImage('original-uri', 0.5);
    expect(mockManipulate).toHaveBeenCalledWith(
      'original-uri',
      [],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG },
    );
  });
});

describe('validateImageSize', () => {
  it('10MB 이하 파일을 허용한다', async () => {
    mockGetInfo.mockResolvedValue({ exists: true, size: 5 * 1024 * 1024, isDirectory: false, uri: '', modificationTime: 0 });
    expect(await validateImageSize('test-uri')).toBe(true);
  });

  it('10MB 초과 파일을 거부한다', async () => {
    mockGetInfo.mockResolvedValue({ exists: true, size: 11 * 1024 * 1024, isDirectory: false, uri: '', modificationTime: 0 });
    expect(await validateImageSize('test-uri')).toBe(false);
  });

  it('정확히 10MB 파일을 허용한다', async () => {
    mockGetInfo.mockResolvedValue({ exists: true, size: 10 * 1024 * 1024, isDirectory: false, uri: '', modificationTime: 0 });
    expect(await validateImageSize('test-uri')).toBe(true);
  });

  it('파일이 존재하지 않으면 거부한다', async () => {
    mockGetInfo.mockResolvedValue({ exists: false, isDirectory: false, uri: '' });
    expect(await validateImageSize('nonexistent-uri')).toBe(false);
  });
});
