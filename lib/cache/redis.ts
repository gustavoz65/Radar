import 'server-only';
import { Redis } from '@upstash/redis';

export interface CacheStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
}

export type Cached = <T>(key: string, ttlSeconds: number, load: () => Promise<T>) => Promise<T>;

/**
 * Wraps a loader in a cache that is allowed to fail: any Redis error falls
 * through to the real call, so a cache outage never becomes a sync outage.
 */
export function createCache(store: CacheStore | null): Cached {
  if (!store) {
    return <T>(_key: string, _ttl: number, load: () => Promise<T>) => load();
  }

  return async <T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> => {
    try {
      const hit = await store.get(key);
      if (hit !== null && hit !== undefined) return hit as T;
    } catch {
      return load();
    }

    const fresh = await load();

    try {
      await store.set(key, fresh, ttlSeconds);
    } catch {
      // Already loaded; failing to store it is not worth surfacing.
    }

    return fresh;
  };
}

function upstashStore(): CacheStore | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Removing both variables disables caching entirely — the escape hatch for
  // keeping balances and transactions off a third-party service.
  if (!url || !token) return null;

  const redis = new Redis({ url, token });

  return {
    get: (key) => redis.get(key),
    set: async (key, value, ttlSeconds) => {
      await redis.set(key, value, { ex: ttlSeconds });
    },
  };
}

export const cached: Cached = createCache(upstashStore());
