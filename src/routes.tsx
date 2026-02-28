import BookmarkChecker from './pages/BookmarkChecker';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '书签检测',
    path: '/',
    element: <BookmarkChecker />
  }
];

export default routes;
