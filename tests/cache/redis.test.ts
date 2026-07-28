import { describe, expect, it, vi } from 'vitest';
import { createCache, type CacheStore } from '@/lib/cache/redis';

function store(overrides: Partial<CacheStore> = {}): CacheStore {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('createCache', () => {
  it('calls the loader and stores the result on a miss', async () => {
    const s = store();
    const cached = createCache(s);
    const load = vi.fn().mockResolvedValue({ total: 10 });

    await expect(cached('k', 60, load)).resolves.toEqual({ total: 10 });
    expect(load).toHaveBeenCalledOnce();
    expect(s.set).toHaveBeenCalledWith('k', { total: 10 }, 60);
  });

  it('returns the cached value without calling the loader on a hit', async () => {
    const cached = createCache(store({ get: vi.fn().mockResolvedValue({ total: 7 }) }));
    const load = vi.fn();

    await expect(cached('k', 60, load)).resolves.toEqual({ total: 7 });
    expect(load).not.toHaveBeenCalled();
  });

  it('treats a stored falsy value as a hit', async () => {
    const cached = createCache(store({ get: vi.fn().mockResolvedValue(0) }));
    const load = vi.fn();

    await expect(cached('k', 60, load)).resolves.toBe(0);
    expect(load).not.toHaveBeenCalled();
  });

  it('falls back to the loader when the cache read fails', async () => {
    // A Redis outage must not become a sync outage.
    const cached = createCache(store({ get: vi.fn().mockRejectedValue(new Error('down')) }));
    const load = vi.fn().mockResolvedValue('fresh');

    await expect(cached('k', 60, load)).resolves.toBe('fresh');
    expect(load).toHaveBeenCalledOnce();
  });

  it('still returns the value when the cache write fails', async () => {
    const cached = createCache(store({ set: vi.fn().mockRejectedValue(new Error('down')) }));

    await expect(cached('k', 60, () => Promise.resolve('fresh'))).resolves.toBe('fresh');
  });

  it('lets the loader error through instead of swallowing it', async () => {
    const cached = createCache(store());

    await expect(cached('k', 60, () => Promise.reject(new Error('pierre falhou')))).rejects.toThrow(
      'pierre falhou',
    );
  });

  it('is a pass-through when no store is configured', async () => {
    const cached = createCache(null);
    const load = vi.fn().mockResolvedValue('fresh');

    await expect(cached('k', 60, load)).resolves.toBe('fresh');
    expect(load).toHaveBeenCalledOnce();
  });
});
