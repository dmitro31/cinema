import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { detectImageType } from './image-type';
import { PostersService } from './posters.service';

const PUBLIC_BASE = 'http://localhost:3001/uploads/posters/';

const jpeg = () => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
const png = () =>
  Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
const webp = () =>
  Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(32)]);

const exists = (path: string) =>
  stat(path).then(
    () => true,
    () => false,
  );

describe('detectImageType', () => {
  it('recognises JPEG, PNG and WebP by their signatures', () => {
    expect(detectImageType(jpeg())).toBe('jpg');
    expect(detectImageType(png())).toBe('png');
    expect(detectImageType(webp())).toBe('webp');
  });

  it('rejects other content', () => {
    expect(detectImageType(Buffer.from('<svg></svg>'))).toBeNull();
    expect(detectImageType(Buffer.from('GIF89a'))).toBeNull();
    expect(detectImageType(Buffer.from('MZ executable'))).toBeNull();
  });

  it('rejects buffers that are too short', () => {
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
    expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(detectImageType(Buffer.from('RIFF'))).toBeNull();
  });

  it('does not accept a RIFF container that is not WebP', () => {
    const wave = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE')]);

    expect(detectImageType(wave)).toBeNull();
  });
});

describe('PostersService', () => {
  let root: string;
  let postersDir: string;
  let prisma: {
    movie: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  };
  let service: PostersService;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'cinema-posters-'));
    postersDir = join(root, 'posters');
    prisma = {
      movie: {
        findUnique: vi.fn().mockResolvedValue({ id: 'movie-1', posterUrl: null }),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    const config = {
      get: (key: string) => (key === 'UPLOADS_DIR' ? root : undefined),
      getOrThrow: (key: string) => {
        if (key === 'API_PUBLIC_URL') return 'http://localhost:3001/';
        throw new Error(`Missing ${key}`);
      },
    };
    service = new PostersService(prisma as never, config as never);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  describe('setPoster', () => {
    it('stores the image under a random name and saves its public url', async () => {
      const result = await service.setPoster('movie-1', jpeg());

      expect(result.posterUrl).toMatch(
        new RegExp(`^${PUBLIC_BASE.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}[0-9a-f-]{36}\\.jpg$`),
      );
      const files = await readdir(postersDir);
      expect(files).toHaveLength(1);
      expect(result.posterUrl.endsWith(files[0])).toBe(true);
      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: 'movie-1' },
        data: { posterUrl: result.posterUrl },
      });
    });

    it('uses the extension that matches the real content', async () => {
      const asPng = await service.setPoster('movie-1', png());
      const asWebp = await service.setPoster('movie-1', webp());

      expect(asPng.posterUrl.endsWith('.png')).toBe(true);
      expect(asWebp.posterUrl.endsWith('.webp')).toBe(true);
    });

    it('rejects content that is not an image and writes nothing', async () => {
      await expect(service.setPoster('movie-1', Buffer.from('<svg></svg>'))).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(prisma.movie.findUnique).not.toHaveBeenCalled();
      expect(await exists(postersDir)).toBe(false);
    });

    it('throws when the movie does not exist and writes nothing', async () => {
      prisma.movie.findUnique.mockResolvedValue(null);

      await expect(service.setPoster('movie-1', jpeg())).rejects.toBeInstanceOf(NotFoundException);

      expect(await exists(postersDir)).toBe(false);
    });

    it('removes the previous poster file when it was uploaded earlier', async () => {
      await mkdir(postersDir, { recursive: true });
      await writeFile(join(postersDir, 'old.jpg'), jpeg());
      prisma.movie.findUnique.mockResolvedValue({
        id: 'movie-1',
        posterUrl: `${PUBLIC_BASE}old.jpg`,
      });

      const result = await service.setPoster('movie-1', png());

      expect(await exists(join(postersDir, 'old.jpg'))).toBe(false);
      const files = await readdir(postersDir);
      expect(files).toHaveLength(1);
      expect(result.posterUrl.endsWith(files[0])).toBe(true);
    });

    it('leaves external poster urls alone', async () => {
      prisma.movie.findUnique.mockResolvedValue({
        id: 'movie-1',
        posterUrl: 'https://placehold.co/400x600/png?text=Dune',
      });

      await expect(service.setPoster('movie-1', jpeg())).resolves.toBeDefined();

      expect(await readdir(postersDir)).toHaveLength(1);
    });

    it('removes the new file when the database update fails', async () => {
      prisma.movie.update.mockRejectedValue(new Error('db down'));

      await expect(service.setPoster('movie-1', jpeg())).rejects.toThrow('db down');

      expect(await readdir(postersDir)).toHaveLength(0);
    });

    it('does not follow path traversal in a stored poster url', async () => {
      await mkdir(postersDir, { recursive: true });
      const outside = join(root, 'secret.txt');
      await writeFile(outside, 'secret');
      prisma.movie.findUnique.mockResolvedValue({
        id: 'movie-1',
        posterUrl: `${PUBLIC_BASE}../secret.txt`,
      });

      await service.setPoster('movie-1', jpeg());

      expect(await exists(outside)).toBe(true);
    });
  });

  describe('removePoster', () => {
    it('clears the url and deletes the file', async () => {
      await mkdir(postersDir, { recursive: true });
      await writeFile(join(postersDir, 'current.jpg'), jpeg());
      prisma.movie.findUnique.mockResolvedValue({
        id: 'movie-1',
        posterUrl: `${PUBLIC_BASE}current.jpg`,
      });

      await service.removePoster('movie-1');

      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: 'movie-1' },
        data: { posterUrl: null },
      });
      expect(await exists(join(postersDir, 'current.jpg'))).toBe(false);
    });

    it('throws when the movie does not exist', async () => {
      prisma.movie.findUnique.mockResolvedValue(null);

      await expect(service.removePoster('movie-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.movie.update).not.toHaveBeenCalled();
    });
  });
});
