import React, { useState, useCallback, useEffect } from 'react';
import { Folder, FolderOpen, Music, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './Common';

export interface TreeItem {
  name: string;
  relativePath: string;
  type: 'directory' | 'album' | 'track';
  children?: TreeItem[];
  trackCount?: number;
}

interface AlbumTreeProps {
  data: TreeItem;
  selectedPaths: string[];
  onSelect: (paths: string[]) => void;
  onLoadChildren: (path: string) => Promise<TreeItem>;
  disabledPaths?: Set<string>;
}

const PLUS_BTN =
  'ml-auto shrink-0 rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20';

export function AlbumTree({
  data,
  selectedPaths,
  onSelect,
  onLoadChildren,
  disabledPaths,
}: AlbumTreeProps) {
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
            if (child.type === 'track') continue;
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
              .then((result) => {
                const filtered = (result.children ?? []).filter((c) => c.type !== 'track');
                mergeChildren(itemPath, filtered);
              })
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

  const handleClick = useCallback(
    (item: TreeItem) => {
      const isDisabled = disabledPaths?.has(item.relativePath);
      if (isDisabled) return;
      if (selectedPaths.includes(item.relativePath)) {
        onSelect(selectedPaths.filter((p) => p !== item.relativePath));
      } else {
        onSelect([...selectedPaths, item.relativePath]);
      }
    },
    [selectedPaths, onSelect, disabledPaths],
  );

  const renderNode = (item: TreeItem, depth: number) => {
    if (item.type === 'track') return null;

    const isExpanded = expanded.has(item.relativePath);
    const isDisabled = disabledPaths?.has(item.relativePath);
    const visibleChildren = (item.children ?? []).filter((c) => c.type !== 'track');
    const hasChildren = visibleChildren.length > 0;
    const isDirectory = item.type === 'directory';
    const isAlbum = item.type === 'album';
    const canExpand = isDirectory || (isAlbum && hasChildren);
    const isLoading = loadingPaths.has(item.relativePath);
    const selectable = isAlbum || isDirectory;

    return (
      <div key={item.relativePath}>
        <div
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent group',
            isDisabled && 'opacity-40 cursor-not-allowed',
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (canExpand) toggleExpand(item.relativePath);
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
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-blue-500" />
          )}

          <span className="truncate min-w-0">{item.name}</span>
          {isLoading && <LoadingSpinner size={12} />}
          {isDisabled && (
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">already exists</span>
          )}
          {item.trackCount !== undefined && !isDisabled && (
            <span className="shrink-0 text-xs text-muted-foreground ml-1">
              {item.trackCount} tracks
            </span>
          )}

          {selectable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick(item);
              }}
              className={PLUS_BTN}
              title={`Add "${item.name}"`}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>{visibleChildren.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return <div className="select-none">{renderNode(treeData, 0)}</div>;
}
