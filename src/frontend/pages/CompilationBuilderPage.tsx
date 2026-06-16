import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TrackSelectionTree, TreeItem, LoadingSpinner, formatBytes, ResizablePanel } from '@/components/common';
import { api } from '@/services/api';
import { Search, Disc3, X, GripVertical, ArrowUp, ArrowDown, Check, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectedTrack {
  sourcePath: string;
  title: string;
  artist: string;
  album: string;
  format: string;
  sizeBytes: number;
  duration: number;
}

export function CompilationBuilderPage() {
  const [sourceTree, setSourceTree] = useState<TreeItem | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrackPaths, setSelectedTrackPaths] = useState<string[]>([]);
  const [tracks, setTracks] = useState<SelectedTrack[]>([]);
  const [checkedTracks, setCheckedTracks] = useState<Set<number>>(new Set());
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  interface PreviewData {
    filesAffected: number;
    estimatedSizeBytes: number;
    destinationPath?: string;
    metadataChanges?: { title: number; album: number; filename: number; trackNumber: number };
  }

  const loadRoot = useCallback(async () => {
    setLoading(true);
    try {
      const tree = await api.getSourceTree({});
      setSourceTree(tree);
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

  const syncTracksFromPaths = useCallback(
    (paths: string[]) => {
      setSelectedTrackPaths(paths);
      setTracks((prev) => {
        const prevPaths = new Set(prev.map((t) => t.sourcePath));
        const newPaths = new Set(paths);
        const added = paths.filter((p) => !prevPaths.has(p));
        const kept = prev.filter((t) => newPaths.has(t.sourcePath));
        const newTracks: SelectedTrack[] = added.map((p) => {
          const segments = p.split('/');
          const filename = segments.pop() ?? p;
          const album = segments.pop() ?? 'Unknown';
          return {
            sourcePath: p,
            title: filename.replace(/\.[^.]+$/, ''),
            artist: '',
            album,
            format: filename.split('.').pop() ?? 'mp3',
            sizeBytes: 0,
            duration: 0,
          };
        });
        return [...kept, ...newTracks];
      });
    },
    [],
  );

  const addAllTracksFromAlbum = useCallback(
    async (albumPath: string) => {
      try {
        const node = await api.getSourceTree({ path: albumPath });
        if (!node.children) return;
        const albumTrackPaths = node.children
          .filter((c) => c.type === 'track')
          .map((c) => c.relativePath);
        const newPaths = [...new Set([...selectedTrackPaths, ...albumTrackPaths])];
        syncTracksFromPaths(newPaths);
      } catch {
        // ignore
      }
    },
    [selectedTrackPaths, syncTracksFromPaths],
  );

  const addAllTracksFromDirectory = useCallback(
    async (dirPath: string) => {
      try {
        const node = await api.getSourceTree({ path: dirPath });
        if (!node.children) return;
        const albumPaths = node.children
          .filter((c) => c.type === 'album')
          .map((c) => c.relativePath);
        const allTrackPaths: string[] = [];
        for (const albumPath of albumPaths) {
          try {
            const albumNode = await api.getSourceTree({ path: albumPath });
            if (albumNode.children) {
              const tracks = albumNode.children
                .filter((c) => c.type === 'track')
                .map((c) => c.relativePath);
              allTrackPaths.push(...tracks);
            }
          } catch {
            // skip
          }
        }
        const newPaths = [...new Set([...selectedTrackPaths, ...allTrackPaths])];
        syncTracksFromPaths(newPaths);
      } catch {
        // ignore
      }
    },
    [selectedTrackPaths, syncTracksFromPaths],
  );

  const addSingleTrack = useCallback(
    (trackPath: string) => {
      if (!selectedTrackPaths.includes(trackPath)) {
        syncTracksFromPaths([...selectedTrackPaths, trackPath]);
      }
    },
    [selectedTrackPaths, syncTracksFromPaths],
  );

  const removeTrack = (index: number) => {
    const track = tracks[index];
    if (!track) return;
    setSelectedTrackPaths((prev) => prev.filter((p) => p !== track.sourcePath));
    setTracks((prev) => prev.filter((_, i) => i !== index));
    setCheckedTracks((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return new Set([...next].map((i) => (i > index ? i - 1 : i)));
    });
  };

  const dragItem = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => {
    if (dragItem.current === null || dragItem.current === index) {
      setDragOverIndex(null);
      return;
    }
    setTracks((prev) => {
      const newTracks = [...prev];
      const dragged = newTracks.splice(dragItem.current!, 1)[0]!;
      newTracks.splice(index, 0, dragged);
      return newTracks;
    });
    setCheckedTracks(new Set());
    setDragOverIndex(null);
    dragItem.current = null;
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    setDragOverIndex(null);
  };

  const removeCheckedTracks = () => {
    const indices = [...checkedTracks].sort((a, b) => b - a);
    const toRemove = new Set(
      indices.map((i) => tracks[i]?.sourcePath).filter(Boolean) as string[],
    );
    setSelectedTrackPaths((prev) => prev.filter((p) => !toRemove.has(p)));
    setTracks((prev) => prev.filter((_, i) => !checkedTracks.has(i)));
    setCheckedTracks(new Set());
  };

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    const newTracks = [...tracks];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newTracks.length) return;
    [newTracks[index], newTracks[target]] = [newTracks[target]!, newTracks[index]!];
    setTracks(newTracks);
    setCheckedTracks(new Set());
  };

  const toggleCheckTrack = (index: number) => {
    setCheckedTracks((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const checkAll = () => setCheckedTracks(new Set(tracks.map((_, i) => i)));
  const uncheckAll = () => setCheckedTracks(new Set());

  const handlePreview = async () => {
    if (!name || tracks.length === 0) return;
    setError(null);
    try {
      const result = await api.createCompilation({ name, tracks }, true);
      setPreview(result.preview);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCreate = async () => {
    if (!name || tracks.length === 0) return;
    setCreating(true);
    setError(null);
    try {
      const result = await api.createCompilation({ name, tracks }, false);
      setMessage(`Compilation "${name}" created with ${result.preview.filesAffected} tracks`);
      setTracks([]);
      setSelectedTrackPaths([]);
      setName('');
      setPreview(null);
      setCheckedTracks(new Set());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const allChecked = tracks.length > 0 && checkedTracks.size === tracks.length;

  return (
    <ResizablePanel
      storageKey="compilation-builder"
      defaultLeftPercent={40}
      left={
        <>
          <div className="border-b p-4">
            <h2 className="mb-2 text-lg font-semibold">Source</h2>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
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
            ) : sourceTree ? (
              <div className="p-2">
                <TrackSelectionTree
                  data={sourceTree}
                  selectedPaths={selectedTrackPaths}
                  onSelect={syncTracksFromPaths}
                  onAddAlbum={addAllTracksFromAlbum}
                  onAddDirectory={addAllTracksFromDirectory}
                  onAddTrack={addSingleTrack}
                  onLoadChildren={search ? () => Promise.resolve({} as TreeItem) : loadChildren}
                />
              </div>
            ) : null}
          </ScrollArea>
        </>
      }
      right={
        <div className="flex flex-col h-full">
          <div className="border-b p-4 flex items-center gap-4">
            <h2 className="text-lg font-semibold shrink-0">Compilation</h2>
            <Input
              placeholder="Compilation name..."
              className="max-w-xs"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
            <Badge variant="secondary">{tracks.length} tracks</Badge>
          </div>

          {tracks.length > 0 && (
            <div className="flex items-center gap-2 border-b px-4 py-1">
              <button
                onClick={allChecked ? uncheckAll : checkAll}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {allChecked ? (
                  <Square className="h-3.5 w-3.5" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                {allChecked ? 'Uncheck all' : 'Check all'}
              </button>
              {checkedTracks.size > 0 && (
                <button
                  onClick={removeCheckedTracks}
                  className="flex items-center gap-1 text-xs text-destructive hover:underline"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove selected ({checkedTracks.size})
                </button>
              )}
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {tracks.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Check tracks in the source tree or click + on an album to add them
                </p>
              ) : (
                tracks.map((track, i) => (
                  <div
                    key={`${track.sourcePath}-${i}`}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-2 rounded-md bg-accent/50 p-2 transition-colors',
                      checkedTracks.has(i) && 'bg-primary/10',
                      dragOverIndex === i && 'border-t-2 border-primary',
                    )}
                  >
                    <button
                      onClick={() => toggleCheckTrack(i)}
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checkedTracks.has(i)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/50 bg-transparent',
                      )}
                    >
                      {checkedTracks.has(i) && <Check className="h-3 w-3" />}
                    </button>
                    <span className="text-xs text-muted-foreground w-6 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-accent transition-colors"
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.album || 'Unknown Album'}
                      </p>
                    </div>
                    <button
                      onClick={() => moveTrack(i, 'up')}
                      disabled={i === 0}
                      className="p-1 hover:bg-accent rounded disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveTrack(i, 'down')}
                      disabled={i === tracks.length - 1}
                      className="p-1 hover:bg-accent rounded disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeTrack(i)}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <X className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {error && (
            <div className="border-t p-4">
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            </div>
          )}

          {preview && (
            <div className="border-t p-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{preview.filesAffected} tracks</Badge>
                <Badge variant="secondary">{formatBytes(preview.estimatedSizeBytes)}</Badge>
                {preview.destinationPath && (
                  <Badge variant="outline">{preview.destinationPath}</Badge>
                )}
              </div>
            </div>
          )}

          {message && <div className="border-t p-4 text-sm text-green-600">{message}</div>}

          <div className="border-t p-4 flex gap-2">
            <Button
              variant="outline"
              disabled={!name || tracks.length === 0 || creating}
              onClick={handlePreview}
            >
              Preview
            </Button>
            <Button disabled={!name || tracks.length === 0 || creating} onClick={handleCreate}>
              {creating ? <LoadingSpinner size={16} /> : <Disc3 className="mr-2 h-4 w-4" />}
              {creating ? 'Creating...' : 'Create Compilation'}
            </Button>
          </div>
        </div>
      }
    />
  );
}
