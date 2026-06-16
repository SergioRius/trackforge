import React, { useState, useCallback, useEffect } from 'react';
import { Folder, FolderOpen, Music, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './Common';

export interface TreeItem {
  name: string;
  relativePath: string;
  type: 'directory' | 'album' | 'track';
  children?: TreeItem[];
  trackCount?: number;
  files?: string[];
}

interface TreeProps {
  data: TreeItem;
  onSelect?: (items: string[]) => void;
  selectionMode?: 'album' | 'track' | 'folder';
  selectedPaths?: string[];
  onLoadChildren?: (path: string) => Promise<TreeItem>;
}

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-muted-foreground/30 bg-transparent',
      )}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
}

export function Tree({
  data,
  onSelect,
  selectionMode = 'album',
  selectedPaths = [],
  onLoadChildren,
}: TreeProps) {
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
        if (node.relativePath === parentPath) {
          return { ...node, children };
        }
        if (node.children) {
          return { ...node, children: node.children.map(merge) };
        }
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

          if (
            onLoadChildren &&
            node &&
            node.type === 'directory' &&
            (!node.children || node.children.length === 0)
          ) {
            setLoadingPaths((prev) => new Set(prev).add(itemPath));
            onLoadChildren(itemPath)
              .then((result) => {
                mergeChildren(itemPath, result.children ?? []);
              })
              .finally(() => {
                setLoadingPaths((prev) => {
                  const next = new Set(prev);
                  next.delete(itemPath);
                  return next;
                });
              });
          }
        }
        return next;
      });
    },
    [treeData, onLoadChildren, mergeChildren],
  );

  const handleSelect = useCallback(
    (item: TreeItem) => {
      if (!onSelect) return;
      const isSelected = selectedPaths.includes(item.relativePath);

      if (selectionMode === 'track') {
        const newPaths = isSelected
          ? selectedPaths.filter((p) => p !== item.relativePath)
          : [...selectedPaths, item.relativePath];
        onSelect(newPaths);
      } else if (selectionMode === 'album' && item.type === 'album') {
        const newPaths = isSelected
          ? selectedPaths.filter((p) => p !== item.relativePath)
          : [...selectedPaths, item.relativePath];
        onSelect(newPaths);
      } else if (selectionMode === 'folder') {
        const newPaths = isSelected
          ? selectedPaths.filter((p) => p !== item.relativePath)
          : [...selectedPaths, item.relativePath];
        onSelect(newPaths);
      }
    },
    [onSelect, selectionMode, selectedPaths],
  );

  const renderNode = (item: TreeItem, depth: number) => {
    const isExpanded = expanded.has(item.relativePath);
    const isSelected = selectedPaths.includes(item.relativePath);
    const hasChildren = item.children && item.children.length > 0;
    const isDirectory = item.type === 'directory';
    const isAlbum = item.type === 'album';
    const isTrack = item.type === 'track';
    const canExpand = isDirectory || (isAlbum && hasChildren);
    const isLoading = loadingPaths.has(item.relativePath);
    const showCheckbox = selectionMode === 'track' && isTrack;

    return (
      <div key={item.relativePath}>
        <div
          className={cn(
            'flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent',
            isSelected && !showCheckbox && 'bg-primary/10 text-primary',
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (canExpand) toggleExpand(item.relativePath);
            if ((isAlbum && selectionMode === 'album') || selectionMode === 'folder') {
              handleSelect(item);
            }
          }}
        >
          {canExpand ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )
          ) : isTrack ? (
            <span className="w-3.5" />
          ) : (
            <span className="w-3.5" />
          )}

          {showCheckbox && <Checkbox checked={isSelected} onChange={() => handleSelect(item)} />}

          {isExpanded && hasChildren ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
          ) : isAlbum ? (
            <Music className="h-4 w-4 shrink-0 text-orange-500" />
          ) : isTrack ? (
            <Music className="h-4 w-4 shrink-0 text-green-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-blue-500" />
          )}

          <span className="truncate">{item.name}</span>

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
