// 结果表格组件

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Clock, Loader2, ExternalLink, Search } from 'lucide-react';
import type { Bookmark } from '@/types/bookmark';

interface ResultsTableProps {
  bookmarks: Bookmark[];
}

type FilterStatus = 'all' | 'valid' | 'invalid' | 'pending' | 'checking';

export const ResultsTable: React.FC<ResultsTableProps> = ({ bookmarks }) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤书签
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesStatus = filterStatus === 'all' || bookmark.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      bookmark.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: Bookmark['status']) => {
    switch (status) {
      case 'valid':
        return (
          <Badge variant="outline" className="gap-1 border-green-600 text-green-600 dark:border-green-500 dark:text-green-500">
            <CheckCircle2 className="w-3 h-3" />
            有效
          </Badge>
        );
      case 'invalid':
        return (
          <Badge variant="outline" className="gap-1 border-destructive text-destructive">
            <XCircle className="w-3 h-3" />
            无效
          </Badge>
        );
      case 'checking':
        return (
          <Badge variant="outline" className="gap-1 border-primary text-primary">
            <Loader2 className="w-3 h-3 animate-spin" />
            检测中
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            待检测
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>检测结果</CardTitle>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索书签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="valid">有效</SelectItem>
                <SelectItem value="invalid">无效</SelectItem>
                <SelectItem value="checking">检测中</SelectItem>
                <SelectItem value="pending">待检测</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {bookmarks.length === 0 ? '暂无数据' : '没有符合条件的书签'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">名称</TableHead>
                  <TableHead className="w-[35%]">链接</TableHead>
                  <TableHead className="w-[15%]">分类</TableHead>
                  <TableHead className="w-[10%]">状态</TableHead>
                  <TableHead className="w-[10%] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookmarks.map((bookmark) => (
                  <TableRow key={bookmark.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-xs truncate" title={bookmark.name}>
                        {bookmark.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md truncate text-muted-foreground text-sm" title={bookmark.url}>
                        {bookmark.url}
                      </div>
                      {bookmark.errorMessage && (
                        <div className="text-xs text-destructive mt-1">
                          {bookmark.errorMessage}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {bookmark.category && (
                        <Badge variant="secondary" className="text-xs">
                          {bookmark.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(bookmark.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
