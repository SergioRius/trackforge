const BASE_URL = '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(typeof errorData.error === 'string' ? errorData.error : 'Request failed');
  }

  return response.json() as Promise<T>;
}

export interface ApiTreeResponse {
  name: string;
  relativePath: string;
  type: 'directory' | 'album' | 'track';
  children?: ApiTreeResponse[];
  trackCount?: number;
  totalSizeBytes?: number;
  files?: string[];
}

export interface CapacityResponse {
  usedBytes: number;
  limitBytes: number;
  availableBytes: number;
  usagePercent: number;
  stats: {
    albumCount: number;
    compilationCount: number;
    totalTracks: number;
    totalSizeBytes: number;
  };
}

export interface SettingsResponse {
  compilationsDirectory: string;
  maxLibrarySizeGb: number;
}

export interface PreviewResponse {
  preview: {
    filesAffected: number;
    estimatedSizeBytes: number;
    destinationPath?: string;
    metadataChanges?: {
      title: number;
      album: number;
      filename: number;
      trackNumber: number;
    };
  };
}

export const api = {
  // Source
  getSourceTree: (params?: { path?: string; search?: string }) =>
    request<ApiTreeResponse>('/source/tree', { params }),

  // Albums
  copyAlbums: (albumPaths: string[], preview?: boolean) =>
    request<PreviewResponse>('/albums/copy', {
      method: 'POST',
      body: { albumPaths },
      params: preview ? { preview: 'true' } : undefined,
    }),

  // Compilations
  createCompilation: (
    data: {
      name: string;
      tracks: {
        sourcePath: string;
        title: string;
        artist: string;
        album: string;
        format: string;
        sizeBytes: number;
        duration: number;
      }[];
    },
    preview?: boolean,
  ) =>
    request<PreviewResponse>('/compilations', {
      method: 'POST',
      body: data,
      params: preview ? { preview: 'true' } : undefined,
    }),

  // Normalize
  normalize: (folderPath: string, preview?: boolean) =>
    request<{ data: { filesAffected: number; mode: string } }>('/normalize', {
      method: 'POST',
      body: { folderPath },
      params: preview ? { preview: 'true' } : undefined,
    }),

  // Destination
  deleteFolder: (folderPath: string) =>
    request<{ success: boolean }>('/destination/folder', {
      method: 'DELETE',
      body: { folderPath },
    }),

  getDestinationTree: () => request<ApiTreeResponse>('/destination/tree'),

  // Capacity
  getCapacity: () => request<CapacityResponse>('/capacity'),

  // Settings
  getSettings: () => request<SettingsResponse>('/settings'),

  updateSettings: (settings: Partial<SettingsResponse>) =>
    request<SettingsResponse>('/settings', {
      method: 'PUT',
      body: settings,
    }),
};
