// 书签上传区域组件

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { detectFileType, parseBookmarkFile } from '@/utils/bookmarkParser';
import type { Bookmark } from '@/types/bookmark';

interface UploadSectionProps {
  onBookmarksLoaded: (bookmarks: Bookmark[]) => void;
  disabled?: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onBookmarksLoaded, disabled }) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        toast.error('请选择有效的文件');
        return;
      }

      const file = acceptedFiles[0];
      const fileType = detectFileType(file.name);

      if (!fileType) {
        toast.error('不支持的文件格式，请上传 HTML 或 Markdown 文件');
        return;
      }

      try {
        const content = await file.text();
        const bookmarks = parseBookmarkFile(content, fileType);

        if (bookmarks.length === 0) {
          toast.error('未能从文件中解析出任何书签');
          return;
        }

        toast.success(`成功解析 ${bookmarks.length} 个书签`);
        onBookmarksLoaded(bookmarks);
      } catch (error) {
        console.error('解析文件失败:', error);
        toast.error('解析文件失败，请检查文件格式');
      }
    },
    [onBookmarksLoaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/html': ['.html', '.htm'],
      'text/markdown': ['.md', '.markdown'],
    },
    multiple: false,
    disabled,
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            {isDragActive ? (
              <>
                <Upload className="w-12 h-12 text-primary" />
                <p className="text-lg font-medium text-primary">释放文件以上传</p>
              </>
            ) : (
              <>
                <FileText className="w-12 h-12 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-foreground">
                    拖拽书签文件到此处，或点击选择文件
                  </p>
                  <p className="text-sm text-muted-foreground">
                    支持 HTML 和 Markdown 格式的书签文件
                  </p>
                </div>
                <Button variant="outline" disabled={disabled}>
                  选择文件
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* Chrome 导出提示 */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <span className="text-primary">💡</span>
              Chrome 浏览器导出书签方法
            </h3>
            <p className="text-sm text-foreground">
              Chrome内核浏览器打开{' '}
              <code className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">
                chrome://bookmarks/
              </code>
              {' '}可以导出书签
            </p>
          </div>

          <h3 className="text-sm font-medium text-foreground">支持的格式：</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium text-foreground">HTML 格式</p>
              <p className="text-xs text-muted-foreground">
                浏览器导出的标准书签文件（.html）
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium text-foreground">Markdown 格式</p>
              <p className="text-xs text-muted-foreground mb-2">
                支持表格格式的书签文件（.md）
              </p>
              <div className="bg-card p-3 rounded border border-border">
                <pre className="text-xs text-foreground font-mono overflow-x-auto">
{`# 分类名称

| 名称 | 链接 | 介绍 |
| ---- | ---- | ---- |
| 网站名称 | https://example.com | 网站介绍信息 |
| 另一个网站 | https://another.com | 该网站的描述 |`}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                注：表格需包含名称、链接两列，介绍列可选
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
