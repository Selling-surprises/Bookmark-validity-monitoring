// 书签检测主页面

import React, { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Download, Play, RotateCcw, Bookmark as BookmarkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { UploadSection } from '@/components/bookmark/UploadSection';
import { StatsCards } from '@/components/bookmark/StatsCards';
import { ResultsTable } from '@/components/bookmark/ResultsTable';
import { exportInvalidBookmarks, downloadFile } from '@/utils/bookmarkParser';
import type { Bookmark, CheckResult } from '@/types/bookmark';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function BookmarkChecker() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [stats, setStats] = useState<CheckResult>({
    total: 0,
    valid: 0,
    invalid: 0,
    pending: 0,
  });

  // 计算统计数据
  useEffect(() => {
    const newStats: CheckResult = {
      total: bookmarks.length,
      valid: bookmarks.filter((b) => b.status === 'valid').length,
      invalid: bookmarks.filter((b) => b.status === 'invalid').length,
      pending: bookmarks.filter((b) => b.status === 'pending').length,
    };
    setStats(newStats);
  }, [bookmarks]);

  // 加载书签
  const handleBookmarksLoaded = useCallback((newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
  }, []);

  // 检测单个URL
  const checkUrl = async (bookmark: Bookmark): Promise<Bookmark> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-url', {
        body: { url: bookmark.url },
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        console.error('Edge function error in check-url:', errorMsg || error?.message);
        return {
          ...bookmark,
          status: 'invalid',
          errorMessage: errorMsg || error.message || '检测失败',
        };
      }

      return {
        ...bookmark,
        status: data.status,
        statusCode: data.statusCode,
        errorMessage: data.errorMessage,
        responseTime: data.responseTime,
      };
    } catch (error) {
      console.error('检测URL失败:', error);
      return {
        ...bookmark,
        status: 'invalid',
        errorMessage: error instanceof Error ? error.message : '未知错误',
      };
    }
  };

  // 开始检测
  const handleStartCheck = async () => {
    if (bookmarks.length === 0) {
      toast.error('请先上传书签文件');
      return;
    }

    setIsChecking(true);
    toast.info('开始检测书签有效性...');

    // 重置所有书签状态为pending
    const resetBookmarks = bookmarks.map((b) => ({ ...b, status: 'pending' as const }));
    setBookmarks(resetBookmarks);

    // 并发检测，每次最多5个
    const batchSize = 5;
    const results: Bookmark[] = [];

    for (let i = 0; i < resetBookmarks.length; i += batchSize) {
      const batch = resetBookmarks.slice(i, i + batchSize);

      // 标记为检测中
      setBookmarks((prev) =>
        prev.map((b) =>
          batch.find((bb) => bb.id === b.id) ? { ...b, status: 'checking' as const } : b
        )
      );

      // 并发检测
      const batchResults = await Promise.all(batch.map((b) => checkUrl(b)));
      results.push(...batchResults);

      // 更新结果
      setBookmarks((prev) =>
        prev.map((b) => {
          const result = batchResults.find((r) => r.id === b.id);
          return result || b;
        })
      );
    }

    setIsChecking(false);

    const validCount = results.filter((b) => b.status === 'valid').length;
    const invalidCount = results.filter((b) => b.status === 'invalid').length;

    toast.success(`检测完成！有效: ${validCount}, 无效: ${invalidCount}`);
  };

  // 重置
  const handleReset = () => {
    setBookmarks([]);
    setIsChecking(false);
  };

  // 导出无效书签
  const handleExport = () => {
    const invalidBookmarks = bookmarks.filter((b) => b.status === 'invalid');

    if (invalidBookmarks.length === 0) {
      toast.error('没有无效的书签可导出');
      return;
    }

    const csv = exportInvalidBookmarks(bookmarks);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csv, `invalid-bookmarks-${timestamp}.csv`, 'text/csv;charset=utf-8;');
    toast.success(`已导出 ${invalidBookmarks.length} 个无效书签`);
  };

  return (
    <>
      <Helmet>
        <title>书签有效性监测 - Bookmark Checker</title>
        <meta name="description" content="检测浏览器书签链接的有效性，支持HTML和Markdown格式" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* 头部 */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookmarkIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">书签有效性监测</h1>
                  <p className="text-sm text-muted-foreground">检测书签链接是否可访问</p>
                </div>
              </div>
              <div className="flex gap-2">
                {bookmarks.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={isChecking}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重置
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExport}
                      disabled={isChecking || stats.invalid === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出无效书签
                    </Button>
                    <Button
                      onClick={handleStartCheck}
                      disabled={isChecking}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isChecking ? '检测中...' : '开始检测'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* 上传区域 */}
            {bookmarks.length === 0 && (
              <UploadSection onBookmarksLoaded={handleBookmarksLoaded} disabled={isChecking} />
            )}

            {/* 统计卡片 */}
            {bookmarks.length > 0 && <StatsCards stats={stats} />}

            {/* 结果表格 */}
            {bookmarks.length > 0 && <ResultsTable bookmarks={bookmarks} />}
          </div>
        </main>

        {/* 页脚 */}
        <footer className="border-t border-border bg-card mt-12">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              © 2026 书签有效性监测网站. 支持 HTML 和 Markdown 格式的书签文件
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
