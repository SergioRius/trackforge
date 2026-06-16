import { z } from 'zod';

export const trackSchema = z.object({
  sourcePath: z.string().min(1),
  title: z.string().min(1),
  trackNumber: z.string().regex(/^\d{2}$/),
  album: z.string(),
  artist: z.string(),
  filename: z.string().min(1),
  sizeBytes: z.number().min(0),
  format: z.enum(['mp3', 'flac', 'm4a', 'unknown']),
  duration: z.number().min(0),
});

export const albumCopyRequestSchema = z.object({
  albumPaths: z.array(z.string().min(1)).min(1),
});

export const compilationCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  tracks: z
    .array(
      z.object({
        sourcePath: z.string().min(1),
        title: z.string().min(1),
        artist: z.string(),
        album: z.string(),
        format: z.enum(['mp3', 'flac', 'm4a', 'unknown']),
        sizeBytes: z.number().min(0),
        duration: z.number().min(0),
      }),
    )
    .min(1),
});

export const normalizeRequestSchema = z.object({
  folderPath: z.string().min(1),
});

export const deleteFolderRequestSchema = z.object({
  folderPath: z.string().min(1),
});

export const sourceTreeQuerySchema = z.object({
  path: z.string().optional(),
  search: z.string().optional(),
});

export const settingsSchema = z.object({
  compilationsDirectory: z.string().min(1).max(100),
  maxLibrarySizeGb: z.number().positive().max(10000),
});

export const configSchema = z.object({
  sourceDir: z.string().min(1),
  destinationDir: z.string().min(1),
  configDir: z.string().min(1),
  compilationsDirectory: z.string().min(1).default('Compilations'),
  maxLibrarySizeGb: z.number().positive().default(64),
});

export type TrackDTO = z.infer<typeof trackSchema>;
export type AlbumCopyRequest = z.infer<typeof albumCopyRequestSchema>;
export type CompilationCreateRequest = z.infer<typeof compilationCreateRequestSchema>;
export type NormalizeRequest = z.infer<typeof normalizeRequestSchema>;
export type DeleteFolderRequest = z.infer<typeof deleteFolderRequestSchema>;
export type SourceTreeQuery = z.infer<typeof sourceTreeQuerySchema>;
export type SettingsDTO = z.infer<typeof settingsSchema>;
export type AppConfig = z.infer<typeof configSchema>;
