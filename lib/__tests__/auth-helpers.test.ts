import { webcrypto } from 'crypto';
Object.defineProperty(global, 'crypto', { value: webcrypto } as any);
import { TextEncoder, TextDecoder } from 'util';
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;
import { hashPassword, comparePasswords } from '../auth-helpers';

describe('auth helpers', () => {
  it('hashPassword returns deterministic SHA-256 hash', async () => {
    const hashed = await hashPassword('password');
    expect(hashed).toBe('5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');
  });

  it('comparePasswords returns true for matching password', async () => {
    const hashed = await hashPassword('mysecret');
    const result = await comparePasswords('mysecret', hashed);
    expect(result).toBe(true);
  });

  it('comparePasswords returns false for non-matching password', async () => {
    const hashed = await hashPassword('mysecret');
    const result = await comparePasswords('otherpass', hashed);
    expect(result).toBe(false);
  });
});
