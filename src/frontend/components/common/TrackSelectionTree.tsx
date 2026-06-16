import React, { useState, useCallback, useEffect } from 'react';
import { Folder, FolderOpen, Music, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner, truncateFilename } from './Common';

export interface TreeItem {
  name: string;
  relativePath: string;
  type: 'directory' | 'album' | 'track';
  children?: TreeItem[];
  trackCount?: number;
}

interface TrackSelectionTreeProps {
  data: TreeItem;
  selectedPaths: string[];
  onSelect: (paths: string[]) => void;
  onAddAlbum: (albumPath: string) => void;
  onAddDirectory: (dirPath: string) => void;
  onAddTrack: (trackPath: string) => void;
  onLoadChildren: (path: string) => Promise<TreeItem>;
}

const PLUS_BTN =
  'ml-auto shrink-0 rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20';

export function TrackSelectionTree({
  data,
  selectedPaths: _selectedPaths,
  onSelect: _onSelect,
  onAddAlbum,
  onAddDirectory,
  onAddTrack,
  onLoadChildren,
}: TrackSelectionTreeProps) {
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
            'flex items-center gap-1 rounded px-2 py-1 text-sm group',
            !isTrack && 'cursor-pointer hover:bg-accent',
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
          ) : isTrack ? (
            <Music className="h-4 w-4 shrink-0 text-green-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-blue-500" />
          )}

          <span className={cn('truncate min-w-0')}>
            {displayName}
          </span>

          {isLoading && <LoadingSpinner size={12} />}

          {item.trackCount !== undefined && !isExpanded && (
            <span className="shrink-0 text-xs text-muted-foreground ml-1">
              {item.trackCount} tracks
            </span>
          )}

          {isDirectory && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddDirectory(item.relativePath); }}
              className={PLUS_BTN}
              title="Add all tracks from this folder"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}

          {isAlbum && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddAlbum(item.relativePath); }}
              className={PLUS_BTN}
              title="Add all tracks from this album"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}

          {isTrack && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddTrack(item.relativePath); }}
              className={PLUS_BTN}
              title="Add this track"
            >
              <Plus className="h-4 w-4" />
            </button>
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
