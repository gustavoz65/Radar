import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('password hashing', () => {
  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(verifyPassword('wrong password', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time for the same input', async () => {
    const a = await hashPassword('same input');
    const b = await hashPassword('same input');
    expect(a).not.toBe(b);
  });

  it('returns false for an empty or malformed hash instead of throwing', async () => {
    await expect(verifyPassword('anything', '')).resolves.toBe(false);
    await expect(verifyPassword('anything', 'not-a-bcrypt-hash')).resolves.toBe(false);
  });
});
