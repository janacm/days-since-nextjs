import bcrypt from 'bcryptjs';

// Password hashing function
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Password comparison function
export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
