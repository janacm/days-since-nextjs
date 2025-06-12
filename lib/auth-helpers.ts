// Hashes a password using the Web Crypto API so it can run in Edge environments
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Compares a plain text password to a previously hashed value
export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  const hashedPlain = await hashPassword(plainPassword);
  return hashedPlain === hashedPassword;
}
