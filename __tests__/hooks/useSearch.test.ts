jest.mock('firebase/app', () => ({ initializeApp: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('firebase/storage');
jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}));
jest.mock('@/services/search');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as searchService from '@/services/search';
import { useSearch } from '@/hooks/useSearch';
import { Artwork } from '@/types/artwork';
import { User } from '@/types/user';

const mockSearchArtworks = searchService.searchArtworks as jest.MockedFunction<
  typeof searchService.searchArtworks
>;
const mockSearchUsers = searchService.searchUsers as jest.MockedFunction<
  typeof searchService.searchUsers
>;
const mockSearchByTag = searchService.searchByTag as jest.MockedFunction<
  typeof searchService.searchByTag
>;
const mockGetPopularTags = searchService.getPopularTags as jest.MockedFunction<
  typeof searchService.getPopularTags
>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const mockArtwork: Artwork = {
  id: 'artwork-1',
  authorId: 'user-1',
  authorNickname: 'artist',
  authorProfileImageUrl: null,
  title: '환상의 숲',
  description: '',
  imageUrls: ['url1'],
  thumbnailUrl: 'url1',
  tags: ['fantasy'],
  tool: 'Midjourney',
    prompt: null,
    hasPrompt: false,
  likesCount: 0,
  reportCount: 0,
  isHidden: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  nickname: 'artist',
  normalizedNickname: 'artist',
  bio: '',
  profileImageUrl: null,
  followersCount: 0,
  followingCount: 0,
  artworksCount: 0,
  bookmarksCount: 0,
    pointBalance: 0,
    creatorPointBalance: 0,
  loginProvider: 'email',
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockAsyncStorage.setItem.mockResolvedValue();
  mockAsyncStorage.removeItem.mockResolvedValue();
  mockAsyncStorage.getItem.mockResolvedValue(null);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useSearch', () => {
  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.query).toBe('');
    expect(result.current.artworks).toEqual([]);
    expect(result.current.users).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.tab).toBe('artworks');
  });

  it('쿼리 입력 후 500ms 디바운싱 후 검색이 실행된다', async () => {
    mockSearchArtworks.mockResolvedValue({
      success: true,
      data: { items: [mockArtwork], hasMore: false, lastCursor: null },
    });

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery('환상');
    });

    expect(mockSearchArtworks).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockSearchArtworks).toHaveBeenCalledWith('환상');
      expect(result.current.artworks).toHaveLength(1);
    });
  });

  it('빈 쿼리는 검색을 실행하지 않는다', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery('   ');
    });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(mockSearchArtworks).not.toHaveBeenCalled();
    expect(result.current.artworks).toEqual([]);
  });

  it('tab이 users면 사용자 검색이 실행된다', async () => {
    mockSearchUsers.mockResolvedValue({
      success: true,
      data: { items: [mockUser], hasMore: false, lastCursor: null },
    });

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setTab('users');
      result.current.setQuery('artist');
    });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockSearchUsers).toHaveBeenCalledWith('artist');
      expect(result.current.users).toHaveLength(1);
    });
  });

  it('태그 검색이 작동한다', async () => {
    mockSearchByTag.mockResolvedValue({
      success: true,
      data: { items: [mockArtwork], hasMore: false, lastCursor: null },
    });

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.searchByTag('fantasy');
    });

    expect(mockSearchByTag).toHaveBeenCalledWith('fantasy');
    expect(result.current.artworks).toHaveLength(1);
    expect(result.current.isSearching).toBe(false);
  });

  it('빈 태그로 searchByTag를 호출하면 아무것도 하지 않는다', async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.searchByTag('  ');
    });

    expect(mockSearchByTag).not.toHaveBeenCalled();
  });

  it('인기 태그를 로드한다', async () => {
    mockGetPopularTags.mockResolvedValue({
      success: true,
      data: ['fantasy', 'landscape'],
    });

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.loadPopularTags();
    });

    expect(result.current.popularTags).toEqual(['fantasy', 'landscape']);
  });

  it('최근 검색어가 추가된다', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.addRecentSearch('환상');
    });

    expect(result.current.recentSearches).toContain('환상');
    expect(mockAsyncStorage.setItem).toHaveBeenCalled();
  });

  it('최근 검색어가 중복되면 앞으로 이동한다', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.addRecentSearch('환상');
      result.current.addRecentSearch('꿈');
      result.current.addRecentSearch('환상');
    });

    expect(result.current.recentSearches[0]).toBe('환상');
    expect(result.current.recentSearches).toHaveLength(2);
  });

  it('최근 검색어가 제거된다', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.addRecentSearch('환상');
      result.current.addRecentSearch('꿈');
    });

    act(() => {
      result.current.removeRecentSearch('환상');
    });

    expect(result.current.recentSearches).not.toContain('환상');
    expect(result.current.recentSearches).toContain('꿈');
  });

  it('최근 검색어 전체 삭제', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.addRecentSearch('환상');
      result.current.addRecentSearch('꿈');
    });

    act(() => {
      result.current.clearRecentSearches();
    });

    expect(result.current.recentSearches).toHaveLength(0);
    expect(mockAsyncStorage.removeItem).toHaveBeenCalled();
  });

  it('AsyncStorage에서 최근 검색어를 로드한다', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(['환상', '꿈']));

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.loadRecentSearches();
    });

    expect(result.current.recentSearches).toEqual(['환상', '꿈']);
  });

  it('search 함수가 query를 설정하고 최근 검색어를 추가한다', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search('환상');
    });

    expect(result.current.query).toBe('환상');
    expect(result.current.recentSearches).toContain('환상');
  });

  it('search 함수에 빈 문자열을 전달하면 아무것도 하지 않는다', async () => {
    const { result } = renderHook(() => useSearch());
    const initialQuery = result.current.query;

    act(() => {
      result.current.search('  ');
    });

    expect(result.current.query).toBe(initialQuery);
  });

  it('hasMore가 false이면 loadMore가 실행되지 않는다', async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.loadMore();
    });

    expect(mockSearchArtworks).not.toHaveBeenCalled();
  });

  it('검색 결과가 없으면 artworks가 빈 배열이다', async () => {
    mockSearchArtworks.mockResolvedValue({
      success: true,
      data: { items: [], hasMore: false, lastCursor: null },
    });

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery('존재하지않는검색어');
    });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.artworks).toHaveLength(0);
    });
  });
});
