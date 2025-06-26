// Secure password hashing using Web Crypto API with PBKDF2 and salt
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Convert password to bytes
  const passwordBytes = new TextEncoder().encode(password);

  // Import the password as a key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive a key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    key,
    256 // 32 bytes
  );

  // Combine salt and hash
  const hashBytes = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashBytes.length);
  combined.set(salt);
  combined.set(hashBytes, salt.length);

  // Convert to hex string
  return Array.from(combined)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Legacy password hashing for backward compatibility
async function hashPasswordLegacy(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Check if a password hash is in the old format and needs migration
export function needsPasswordMigration(hashedPassword: string): boolean {
  return hashedPassword.length === 64 || hashedPassword.length === 60; // Old SHA-256 or bcrypt format
}

// Compares a plain text password to a previously hashed value
// Supports old SHA-256 (64) and new PBKDF2+salt (96) formats
// Note: bcrypt (60) requires manual password reset
export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // Check if this is bcrypt format (60 characters, starts with $2)
    if (hashedPassword.length === 60 && hashedPassword.startsWith('$2')) {
      console.error(
        '⚠️  This user has a bcrypt password which cannot be verified in Edge Runtime.'
      );
      console.error('   The user needs to reset their password to log in.');
      console.error('   Consider implementing a password reset flow.');
      return false;
    }

    // Check if this is an old SHA-256 format password (64 characters)
    if (hashedPassword.length === 64) {
      console.log('Using legacy password comparison (SHA-256)');
      const hashedPlain = await hashPasswordLegacy(plainPassword);
      return hashedPlain === hashedPassword;
    }

    // New format password (96 characters = PBKDF2+salt)
    if (hashedPassword.length === 96) {
      console.log('Using new password comparison (PBKDF2+salt)');

      // Convert hex string back to bytes
      const combinedBytes = new Uint8Array(
        hashedPassword.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
      );

      // Extract salt (first 16 bytes) and hash (rest)
      const salt = combinedBytes.slice(0, 16);
      const originalHash = combinedBytes.slice(16);

      // Convert password to bytes
      const passwordBytes = new TextEncoder().encode(plainPassword);

      // Import the password as a key
      const key = await crypto.subtle.importKey(
        'raw',
        passwordBytes,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      // Derive bits using the same salt and parameters
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        key,
        256
      );

      const newHash = new Uint8Array(derivedBits);

      // Constant-time comparison
      if (originalHash.length !== newHash.length) {
        return false;
      }

      let result = 0;
      for (let i = 0; i < originalHash.length; i++) {
        result |= originalHash[i] ^ newHash[i];
      }

      return result === 0;
    }

    // Unknown format
    console.error(
      'Unknown password hash format. Length:',
      hashedPassword.length
    );
    return false;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}
