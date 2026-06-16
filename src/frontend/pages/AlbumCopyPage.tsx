import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlbumTree, TreeItem, LoadingSpinner, ErrorMessage, formatBytes, ResizablePanel } from '@/components/common';
import { api } from '@/services/api';
import { Search, Copy, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AlbumCopyPage() {
  const [sourceTree, setSourceTree] = useState<TreeItem | null>(null);
  const [destTree, setDestTree] = useState<TreeItem | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [preview, setPreview] = useState<{
    filesAffected: number;
    estimatedSizeBytes: number;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRoot = useCallback(async () => {
    setLoading(true);
    try {
      const [tree, dest] = await Promise.all([
        api.getSourceTree({}),
        api.getDestinationTree().catch(() => null),
      ]);
      setSourceTree(tree);
      setDestTree(dest);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChildren = useCallback(async (path: string): Promise<TreeItem> => {
    return api.getSourceTree({ path });
  }, []);

  useEffect(() => {
    loadRoot();
  }, [loadRoot]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (!value.trim()) {
        loadRoot();
        return;
      }
      searchTimer.current = setTimeout(async () => {
        setLoading(true);
        try {
          const tree = await api.getSourceTree({ search: value });
          setSourceTree(tree);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [loadRoot],
  );

  const collectExistingPaths = useCallback(
    (node: TreeItem | null): Set<string> => {
      const paths = new Set<string>();
      if (!node) return paths;
      const walk = (n: TreeItem) => {
        if (n.type === 'album') paths.add(n.relativePath);
        if (n.children) n.children.forEach(walk);
      };
      walk(node);
      return paths;
    },
    [],
  );

  const existingPaths = collectExistingPaths(destTree);

  const handlePreview = async () => {
    if (selectedPaths.length === 0) return;
    try {
      setError(null);
      const result = await api.copyAlbums(selectedPaths, true);
      setPreview(result.preview);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopy = async () => {
    if (selectedPaths.length === 0) return;
    setCopying(true);
    try {
      setError(null);
      const result = await api.copyAlbums(selectedPaths, false);
      setMessage(`Successfully copied ${result.preview.filesAffected} files`);
      setSelectedPaths([]);
      setPreview(null);
      loadRoot();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCopying(false);
    }
  };

  return (
    <ResizablePanel
      storageKey="album-copy"
      defaultLeftPercent={40}
      left={
        <>
          <div className="border-b p-4">
            <h2 className="mb-2 text-lg font-semibold">Source Library</h2>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search albums..."
                className="pl-8"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSearch(e.target.value)
                }
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-10rem)]">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="p-4">
                <ErrorMessage message={error} />
              </div>
            ) : sourceTree ? (
              <div className="p-2">
                <AlbumTree
                  data={sourceTree}
                  selectedPaths={selectedPaths}
                  onSelect={setSelectedPaths}
                  onLoadChildren={search ? () => Promise.resolve({} as TreeItem) : loadChildren}
                  disabledPaths={search ? undefined : existingPaths}
                />
              </div>
            ) : null}
          </ScrollArea>
        </>
      }
      right={
        <div className="flex flex-col h-full">
          <div className="border-b p-4">
            <h2 className="mb-2 text-lg font-semibold">Selected ({selectedPaths.length})</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {selectedPaths.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Click on albums or folders in the source tree to select them for copy
                </p>
              ) : (
                selectedPaths.map((path) => (
                  <div
                    key={path}
                    className={cn(
                      'flex items-center justify-between rounded-md px-3 py-2 text-sm bg-accent/50',
                      existingPaths.has(path) && 'opacity-50',
                    )}
                  >
                    <span className="truncate">
                      {path}
                      {existingPaths.has(path) && (
                        <span className="ml-2 text-xs text-muted-foreground">(already exists)</span>
                      )}
                    </span>
                    <button
                      onClick={() =>
                        setSelectedPaths(selectedPaths.filter((p) => p !== path))
                      }
                      className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {preview && (
            <div className="border-t p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{preview.filesAffected} files</Badge>
                <Badge variant="secondary">{formatBytes(preview.estimatedSizeBytes)}</Badge>
              </div>
            </div>
          )}

          {message && <div className="border-t p-4 text-sm text-green-600">{message}</div>}

          <div className="border-t p-4 flex gap-2">
            <Button
              variant="outline"
              disabled={selectedPaths.length === 0 || copying}
              onClick={handlePreview}
            >
              Preview
            </Button>
            <Button disabled={selectedPaths.length === 0 || copying} onClick={handleCopy}>
              {copying ? <LoadingSpinner size={16} /> : <Copy className="mr-2 h-4 w-4" />}
              {copying ? 'Copying...' : 'Copy Albums'}
            </Button>
          </div>
        </div>
      }
    />
  );
}
