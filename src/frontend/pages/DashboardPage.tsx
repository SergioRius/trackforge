import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner, ErrorMessage, formatBytes } from '@/components/common';
import { api, CapacityResponse } from '@/services/api';
import { HardDrive, Disc, Music, FolderOpen } from 'lucide-react';

export function DashboardPage() {
  const [data, setData] = useState<CapacityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCapacity()
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error)
    return (
      <div className="p-6">
        <ErrorMessage message={error} />
      </div>
    );
  if (!data) return null;

  const stats = [
    { icon: Disc, label: 'Albums', value: data.stats.albumCount },
    { icon: Music, label: 'Compilations', value: data.stats.compilationCount },
    { icon: FolderOpen, label: 'Total Tracks', value: data.stats.totalTracks },
  ];

  const usageColor =
    data.usagePercent > 90
      ? 'bg-destructive'
      : data.usagePercent > 70
        ? 'bg-yellow-500'
        : 'bg-primary';

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {formatBytes(data.usedBytes)} of {formatBytes(data.limitBytes)}
            </span>
            <Badge variant={data.usagePercent > 90 ? 'destructive' : 'default'}>
              {data.usagePercent}%
            </Badge>
          </div>
          <Progress value={data.usagePercent} className={usageColor} />
          <p className="text-xs text-muted-foreground">
            {formatBytes(data.availableBytes)} available
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
