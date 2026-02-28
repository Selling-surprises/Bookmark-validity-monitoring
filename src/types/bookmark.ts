// 书签类型定义

export interface Bookmark {
  id: string;
  name: string;
  url: string;
  description?: string;
  category?: string;
  status: 'pending' | 'checking' | 'valid' | 'invalid';
  statusCode?: number;
  errorMessage?: string;
  responseTime?: number;
}

export interface BookmarkCategory {
  name: string;
  bookmarks: Bookmark[];
}

export interface CheckResult {
  total: number;
  valid: number;
  invalid: number;
  pending: number;
}

export type BookmarkFileType = 'html' | 'markdown';
