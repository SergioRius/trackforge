import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

import { createLogger } from '../infrastructure/logger.js';
import { JsonConfigStore } from '../infrastructure/configStore.js';
import { LocalFileSystem } from '../infrastructure/fileSystem.js';
import { MusicMetadataService } from '../infrastructure/metadata.js';
import { ScanSourceLibrary } from '../application/scanSourceLibrary.js';
import { CopyAlbums } from '../application/copyAlbums.js';
import { CreateCompilation } from '../application/createCompilation.js';
import { NormalizeFolder } from '../application/normalizeFolder.js';
import { DeleteDestinationFolder } from '../application/deleteDestinationFolder.js';
import { CalculateLibrarySize } from '../application/calculateLibrarySize.js';

import {
  albumCopyRequestSchema,
  compilationCreateRequestSchema,
  normalizeRequestSchema,
  deleteFolderRequestSchema,
  sourceTreeQuerySchema,
  settingsSchema,
} from '@trackforge/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_DIR = '/library';
const DESTINATION_DIR = '/destination';
const CONFIG_DIR = '/config';
const PORT = 8080;

export async function buildApp() {
  const logger = createLogger();
  const config = new JsonConfigStore(CONFIG_DIR, SOURCE_DIR, DESTINATION_DIR);
  const fs = new LocalFileSystem(SOURCE_DIR, DESTINATION_DIR, logger);
  const metadata = new MusicMetadataService(SOURCE_DIR);

  const scanSourceLibrary = new ScanSourceLibrary(fs, logger);
  const copyAlbums = new CopyAlbums(fs, metadata, metadata, config, logger);
  const createCompilation = new CreateCompilation(fs, metadata, metadata, config, logger);
  const normalizeFolder = new NormalizeFolder(fs, metadata, metadata, config, logger);
  const deleteDestinationFolder = new DeleteDestinationFolder(fs, logger);
  const calculateLibrarySize = new CalculateLibrarySize(fs, config, logger);

  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '../../../frontend/dist'),
    prefix: '/',
    wildcard: false,
  });

  // GET /api/source/tree
  app.get('/api/source/tree', async (request, reply) => {
    const query = sourceTreeQuerySchema.parse(request.query);
    const result = await scanSourceLibrary.execute(query.path);
    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }
    return result.data;
  });

  // POST /api/albums/copy
  app.post('/api/albums/copy', async (request, reply) => {
    const body = albumCopyRequestSchema.parse(request.body);
    const previewOnly = (request.query as Record<string, string>).preview === 'true';
    const result = await copyAlbums.execute(body.albumPaths, previewOnly);
    if (!result.success) {
      return reply.status(400).send({ error: result.error, preview: result.preview });
    }
    return { preview: result.preview };
  });

  // POST /api/compilations
  app.post('/api/compilations', async (request, reply) => {
    const body = compilationCreateRequestSchema.parse(request.body);
    const previewOnly = (request.query as Record<string, string>).preview === 'true';
    const result = await createCompilation.execute(body, previewOnly);
    if (!result.success) {
      return reply.status(400).send({ error: result.error, preview: result.preview });
    }
    return { preview: result.preview };
  });

  // POST /api/normalize
  app.post('/api/normalize', async (request, reply) => {
    const body = normalizeRequestSchema.parse(request.body);
    const previewOnly = (request.query as Record<string, string>).preview === 'true';
    const result = await normalizeFolder.execute(body.folderPath, previewOnly);
    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }
    return { data: result.data };
  });

  // DELETE /api/destination/folder
  app.delete('/api/destination/folder', async (request, reply) => {
    const body = deleteFolderRequestSchema.parse(request.body);
    const result = await deleteDestinationFolder.execute(body.folderPath);
    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }
    return { success: true };
  });

  // GET /api/destination/tree
  app.get('/api/destination/tree', async (_request, reply) => {
    try {
      const tree = await fs.scanDirectoryFlat('');
      return tree;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  });

  // GET /api/capacity
  app.get('/api/capacity', async (_request, reply) => {
    const result = await calculateLibrarySize.execute();
    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }
    return result.data;
  });

  // GET /api/settings
  app.get('/api/settings', async (_request, _reply) => {
    return config.getSettings();
  });

  // PUT /api/settings
  app.put('/api/settings', async (request, _reply) => {
    const body = settingsSchema.partial().parse(request.body);
    const result = config.updateSettings(body);
    return result;
  });

  app.setNotFoundHandler(async (_request, reply) => {
    return reply.sendFile('index.html');
  });

  return { app, logger };
}

async function main() {
  const { app, logger } = await buildApp();

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    logger.info(`Server running on port ${PORT}`);
  } catch (err) {
    logger.error('Failed to start server', { error: (err as Error).message });
    process.exit(1);
  }
}

// Allow importing without auto-starting (for testing)
const isMainModule = process.argv[1]?.includes('server');
if (isMainModule) {
  main();
}
