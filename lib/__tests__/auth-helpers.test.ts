import { TextEncoder, TextDecoder } from 'util';
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock crypto.getRandomValues for consistent testing
const mockSalt = new Uint8Array([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
]);
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(() => mockSalt),
    subtle: require('crypto').webcrypto.subtle
  }
});

import { hashPassword, comparePasswords } from '../auth-helpers';

describe('auth helpers', () => {
  it('hashPassword creates a PBKDF2 hash', async () => {
    const password = 'testpassword';
    const hashed = await hashPassword(password);

    // PBKDF2 hash should be 96 characters (16 bytes salt + 32 bytes hash in hex)
    expect(hashed).toHaveLength(96);
    expect(typeof hashed).toBe('string');
    expect(hashed).toMatch(/^[0-9a-f]+$/);
  });

  it('comparePasswords returns true for matching password', async () => {
    const password = 'mysecret';
    const hashed = await hashPassword(password);
    const result = await comparePasswords(password, hashed);
    expect(result).toBe(true);
  });

  it('comparePasswords returns false for non-matching password', async () => {
    const password = 'mysecret';
    const wrongPassword = 'wrongpassword';
    const hashed = await hashPassword(password);
    const result = await comparePasswords(wrongPassword, hashed);
    expect(result).toBe(false);
  });

  it('comparePasswords returns false for invalid hash', async () => {
    const password = 'mysecret';
    const invalidHash = 'invalid-hash';
    const result = await comparePasswords(password, invalidHash);
    expect(result).toBe(false);
  });

  it('comparePasswords handles malformed hash gracefully', async () => {
    const password = 'mysecret';
    const malformedHash = 'abcd'; // Too short
    const result = await comparePasswords(password, malformedHash);
    expect(result).toBe(false);
  });
});
