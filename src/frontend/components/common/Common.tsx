import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
}

export function LoadingSpinner({ size = 24 }: LoadingSpinnerProps) {
  return <Loader2 className="animate-spin" style={{ width: size, height: size }} />;
}

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function truncateFilename(name: string, maxLen = 54): string {
  if (name.length <= maxLen) return name;
  const dotIdx = name.lastIndexOf('.');
  const hasExt = dotIdx > -1 && dotIdx > name.lastIndexOf('/');
  const ext = hasExt ? name.slice(dotIdx) : '';
  const base = hasExt ? name.slice(0, dotIdx) : name;
  const keepStart = 21;
  const keepEnd = maxLen - keepStart - 3 - ext.length;
  if (keepEnd <= 0) return name.slice(0, maxLen - 3) + '...';
  return base.slice(0, keepStart) + '...' + base.slice(-keepEnd) + ext;
}
