import React, { useState, useCallback, useEffect } from 'react';
import { Folder, FolderOpen, Music, FileAudio, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner, truncateFilename } from './Common';

export interface TreeItem {
  name: string;
  relativePath: string;
  type: 'directory' | 'album' | 'track';
  children?: TreeItem[];
  trackCount?: number;
}

interface DestinationTreeProps {
  data: TreeItem;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onLoadChildren: (path: string) => Promise<TreeItem>;
}

export function DestinationTree({
  data,
  selectedPath,
  onSelect,
  onLoadChildren,
}: DestinationTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([data.relativePath]));
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  const [treeData, setTreeData] = useState<TreeItem>(data);

  useEffect(() => {
    setTreeData(data);
    setExpanded(new Set([data.relativePath]));
  }, [data]);

  const mergeChildren = useCallback(
    (parentPath: string, children: TreeItem[]) => {
      const merge = (node: TreeItem): TreeItem => {
        if (node.relativePath === parentPath) return { ...node, children };
        if (node.children) return { ...node, children: node.children.map(merge) };
        return node;
      };
      setTreeData((prev) => merge(prev));
    },
    [],
  );

  const toggleExpand = useCallback(
    async (itemPath: string) => {
      const findNode = (node: TreeItem, target: string): TreeItem | null => {
        if (node.relativePath === target) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child, target);
            if (found) return found;
          }
        }
        return null;
      };

      const node = findNode(treeData, itemPath);

      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(itemPath)) {
          next.delete(itemPath);
        } else {
          next.add(itemPath);
          if (node && node.type === 'directory' && (!node.children || node.children.length === 0)) {
            setLoadingPaths((prev) => new Set(prev).add(itemPath));
            onLoadChildren(itemPath)
              .then((result) => mergeChildren(itemPath, result.children ?? []))
              .finally(() =>
                setLoadingPaths((prev) => {
                  const next = new Set(prev);
                  next.delete(itemPath);
                  return next;
                }),
              );
          }
        }
        return next;
      });
    },
    [treeData, onLoadChildren, mergeChildren],
  );

  const renderNode = (item: TreeItem, depth: number) => {
    const isExpanded = expanded.has(item.relativePath);
    const isSelected = selectedPath === item.relativePath;
    const hasChildren = item.children && item.children.length > 0;
    const isDirectory = item.type === 'directory';
    const isAlbum = item.type === 'album';
    const isTrack = item.type === 'track';
    const canExpand = isDirectory || (isAlbum && hasChildren);
    const isLoading = loadingPaths.has(item.relativePath);
    const displayName = isTrack ? truncateFilename(item.name) : item.name;

    return (
      <div key={item.relativePath}>
        <div
          className={cn(
            'flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent',
            isSelected && 'bg-primary/15 text-primary font-medium',
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (canExpand) toggleExpand(item.relativePath);
            onSelect(item.relativePath);
          }}
        >
          {canExpand ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )
          ) : (
            <span className="w-3.5" />
          )}

          {isExpanded && hasChildren ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
          ) : isAlbum ? (
            <Music className="h-4 w-4 shrink-0 text-orange-500" />
          ) : isTrack ? (
            <FileAudio className="h-4 w-4 shrink-0 text-green-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-blue-500" />
          )}

          <span className="truncate min-w-0">{displayName}</span>

          {isLoading && <LoadingSpinner size={12} />}

          {item.trackCount !== undefined && !isExpanded && (
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
              {item.trackCount} tracks
            </span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>{item.children!.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return <div className="select-none">{renderNode(treeData, 0)}</div>;
}
