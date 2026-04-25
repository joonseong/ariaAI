import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDebounce } from '@/hooks/useDebounce';
import * as searchService from '@/services/search';
import { Artwork } from '@/types/artwork';
import { User } from '@/types/user';

const MAX_QUERY_LENGTH = 50;
const MAX_RECENT_SEARCHES = 20;
const DEBOUNCE_DELAY = 500;
const RECENT_SEARCHES_KEY = 'recent_searches';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'artworks' | 'users'>('artworks');
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastCursor, setLastCursor] = useState<Date | null>(null);

  const debouncedQuery = useDebounce(query, DEBOUNCE_DELAY);

  useEffect(() => {
    const trimmed = debouncedQuery.trim().slice(0, MAX_QUERY_LENGTH);
    if (!trimmed) {
      setArtworks([]);
      setUsers([]);
      setHasMore(false);
      setLastCursor(null);
      return;
    }

    let cancelled = false;

    setIsSearching(true);
    setArtworks([]);
    setUsers([]);
    setHasMore(false);
    setLastCursor(null);

    (async () => {
      if (tab === 'artworks') {
        const result = await searchService.searchArtworks(trimmed);
        if (!cancelled && result.success) {
          setArtworks(result.data.items);
          setHasMore(result.data.hasMore);
          setLastCursor(result.data.lastCursor as Date | null);
        }
      } else {
        const result = await searchService.searchUsers(trimmed);
        if (!cancelled && result.success) {
          setUsers(result.data.items);
          setHasMore(result.data.hasMore);
          setLastCursor(result.data.lastCursor as Date | null);
        }
      }
      if (!cancelled) setIsSearching(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, tab]);

  const addRecentSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== trimmed);
      const next = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const search = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;
      setQuery(searchQuery.slice(0, MAX_QUERY_LENGTH));
      addRecentSearch(trimmed);
    },
    [addRecentSearch],
  );

  const searchByTag = useCallback(
    async (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;

      setIsSearching(true);
      setArtworks([]);
      setHasMore(false);
      setLastCursor(null);

      const result = await searchService.searchByTag(trimmed);
      if (result.success) {
        setArtworks(result.data.items);
        setHasMore(result.data.hasMore);
        setLastCursor(result.data.lastCursor as Date | null);
      }

      setIsSearching(false);
      addRecentSearch(trimmed);
    },
    [addRecentSearch],
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !lastCursor) return;
    const trimmed = query.trim().slice(0, MAX_QUERY_LENGTH);
    if (!trimmed) return;

    setIsLoadingMore(true);

    if (tab === 'artworks') {
      const result = await searchService.searchArtworks(trimmed, lastCursor);
      if (result.success) {
        setArtworks((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          return [...prev, ...result.data.items.filter((a) => !existingIds.has(a.id))];
        });
        setHasMore(result.data.hasMore);
        setLastCursor(result.data.lastCursor as Date | null);
      }
    } else {
      const result = await searchService.searchUsers(trimmed, lastCursor);
      if (result.success) {
        setUsers((prev) => {
          const existingIds = new Set(prev.map((u) => u.id));
          return [...prev, ...result.data.items.filter((u) => !existingIds.has(u.id))];
        });
        setHasMore(result.data.hasMore);
        setLastCursor(result.data.lastCursor as Date | null);
      }
    }

    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, lastCursor, query, tab]);

  const loadPopularTags = useCallback(async () => {
    const result = await searchService.getPopularTags();
    if (result.success) {
      setPopularTags(result.data);
    }
  }, []);

  const loadRecentSearches = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored) as string[]);
      }
    } catch {
      // ignore
    }
  }, []);

  const removeRecentSearch = useCallback((searchQuery: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== searchQuery);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    AsyncStorage.removeItem(RECENT_SEARCHES_KEY).catch(() => {});
  }, []);

  return {
    query,
    setQuery,
    tab,
    setTab,
    artworks,
    users,
    popularTags,
    recentSearches,
    isSearching,
    hasMore,
    isLoadingMore,
    search,
    searchByTag,
    loadMore,
    loadPopularTags,
    loadRecentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}
