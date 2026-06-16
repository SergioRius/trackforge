import React, { useEffect, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DestinationTree,
  TreeItem,
  LoadingSpinner,
  ErrorMessage,
  ResizablePanel,
} from '@/components/common';
import { api } from '@/services/api';
import { Trash2, Wand2, FileAudio, Music, Folder } from 'lucide-react';

export function DestinationLibraryPage() {
  const [tree, setTree] = useState<TreeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadTree = useCallback(() => {
    setLoading(true);
    api
      .getDestinationTree()
      .then(setTree)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const loadChildren = useCallback(async (_path: string): Promise<TreeItem> => {
    return api.getDestinationTree();
  }, []);

  const findNodeType = useCallback(
    (path: string, node: TreeItem): string | null => {
      if (node.relativePath === path) return node.type;
      if (node.children) {
        for (const child of node.children) {
          const found = findNodeType(path, child);
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  const handleSelect = useCallback(
    (path: string) => {
      setSelectedPath(path);
      if (tree) {
        setSelectedType(findNodeType(path, tree));
      }
    },
    [tree, findNodeType],
  );

  const handleDelete = async () => {
    if (!selectedPath) return;
    setProcessing(true);
    setError(null);
    try {
      await api.deleteFolder(selectedPath);
      setMessage(`Deleted "${selectedPath}"`);
      setSelectedPath(null);
      setSelectedType(null);
      loadTree();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleNormalize = async () => {
    if (!selectedPath) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await api.normalize(selectedPath, false);
      setMessage(`Normalized ${result.data.filesAffected} files in ${result.data.mode} mode`);
      setSelectedPath(null);
      setSelectedType(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const TypeIcon = selectedType === 'track' ? FileAudio : selectedType === 'album' ? Music : Folder;

  return (
    <ResizablePanel
      storageKey="destination-library"
      defaultLeftPercent={40}
      left={
        <>
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Destination Library</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-6rem)]">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="p-4">
                <ErrorMessage message={error} />
              </div>
            ) : tree ? (
              <div className="p-2">
                <DestinationTree
                  data={tree}
                  selectedPath={selectedPath}
                  onSelect={handleSelect}
                  onLoadChildren={loadChildren}
                />
              </div>
            ) : null}
          </ScrollArea>
        </>
      }
      right={
        <div className="flex flex-col h-full">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Actions</h2>
          </div>

          <div className="flex-1 p-4 space-y-4">
            {selectedPath ? (
              <>
                <div className="rounded-md border p-4">
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    {selectedType === 'track' ? 'Track' : selectedType === 'album' ? 'Album' : 'Folder'}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {selectedPath}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {(selectedType === 'directory' || selectedType === 'album') && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleNormalize}
                      disabled={processing}
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Normalize
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={handleDelete}
                    disabled={processing}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete {selectedType === 'track' ? 'File' : 'Folder'}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Click on a folder, album, or file to manage it
              </p>
            )}

            {message && (
              <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                {message}
              </div>
            )}

            {error && <ErrorMessage message={error} />}
          </div>
        </div>
      }
    />
  );
}
