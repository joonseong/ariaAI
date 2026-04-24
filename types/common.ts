export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

export interface AppError {
  code: string;
  message: string;
}

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: AppError | null;
}

export interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  lastCursor: unknown | null;
}
