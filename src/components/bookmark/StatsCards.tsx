// 统计卡片组件

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, Link as LinkIcon } from 'lucide-react';
import type { CheckResult } from '@/types/bookmark';

interface StatsCardsProps {
  stats: CheckResult;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: '总计',
      value: stats.total,
      icon: LinkIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: '有效',
      value: stats.valid,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: '无效',
      value: stats.invalid,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: '待检测',
      value: stats.pending,
      icon: Clock,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
