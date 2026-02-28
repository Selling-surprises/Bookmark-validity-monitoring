// 书签文件解析工具

import type { Bookmark, BookmarkFileType } from '@/types/bookmark';

/**
 * 解析HTML格式的书签文件
 */
export function parseHTMLBookmarks(content: string): Bookmark[] {
  const bookmarks: Bookmark[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  
  // 查找所有的链接标签
  const links = doc.querySelectorAll('a');
  
  links.forEach((link, index) => {
    const url = link.getAttribute('href');
    const name = link.textContent?.trim() || '';
    
    if (url && url.startsWith('http')) {
      bookmarks.push({
        id: `bookmark-${Date.now()}-${index}`,
        name: name || url,
        url,
        status: 'pending'
      });
    }
  });
  
  return bookmarks;
}

/**
 * 解析Markdown格式的书签文件
 * 支持格式：| 名称 | 链接 | 介绍 |
 */
export function parseMarkdownBookmarks(content: string): Bookmark[] {
  const bookmarks: Bookmark[] = [];
  const lines = content.split('\n');
  
  let currentCategory = '';
  let inTable = false;
  let tableHeaderPassed = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 检测分类标题（# 开头）
    if (trimmedLine.startsWith('#')) {
      currentCategory = trimmedLine.replace(/^#+\s*/, '').trim();
      inTable = false;
      tableHeaderPassed = false;
      continue;
    }
    
    // 检测表格行
    if (trimmedLine.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        continue; // 跳过表头
      }
      
      if (!tableHeaderPassed) {
        tableHeaderPassed = true;
        continue; // 跳过分隔符行
      }
      
      // 解析表格数据行
      const cells = trimmedLine
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '');
      
      if (cells.length >= 2) {
        const name = cells[0];
        const url = cells[1];
        const description = cells[2] || '';
        
        // 验证URL格式
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          bookmarks.push({
            id: `bookmark-${Date.now()}-${bookmarks.length}`,
            name: name || url,
            url,
            description,
            category: currentCategory,
            status: 'pending'
          });
        }
      }
    } else if (trimmedLine === '') {
      inTable = false;
      tableHeaderPassed = false;
    }
  }
  
  return bookmarks;
}

/**
 * 根据文件类型解析书签
 */
export function parseBookmarkFile(content: string, fileType: BookmarkFileType): Bookmark[] {
  if (fileType === 'html') {
    return parseHTMLBookmarks(content);
  } else if (fileType === 'markdown') {
    return parseMarkdownBookmarks(content);
  }
  return [];
}

/**
 * 检测文件类型
 */
export function detectFileType(filename: string): BookmarkFileType | null {
  const ext = filename.toLowerCase().split('.').pop();
  
  if (ext === 'html' || ext === 'htm') {
    return 'html';
  } else if (ext === 'md' || ext === 'markdown') {
    return 'markdown';
  }
  
  return null;
}

/**
 * 导出无效书签为CSV格式
 */
export function exportInvalidBookmarks(bookmarks: Bookmark[]): string {
  const invalidBookmarks = bookmarks.filter(b => b.status === 'invalid');
  
  if (invalidBookmarks.length === 0) {
    return '';
  }
  
  // CSV头部
  const headers = ['名称', '链接', '分类', '错误信息', '状态码'];
  const rows = [headers.join(',')];
  
  // CSV数据行
  invalidBookmarks.forEach(bookmark => {
    const row = [
      `"${bookmark.name.replace(/"/g, '""')}"`,
      `"${bookmark.url}"`,
      `"${bookmark.category || ''}"`,
      `"${bookmark.errorMessage || ''}"`,
      bookmark.statusCode?.toString() || ''
    ];
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
