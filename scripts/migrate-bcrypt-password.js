import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  pgTable,
  varchar,
  serial,
  timestamp,
  boolean,
  integer
} from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Define the users table schema (copied from lib/db.ts)
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  username: varchar('username', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Connect to database
const db = drizzle(neon(process.env.POSTGRES_URL));

// PBKDF2 password hashing function (copied from lib/auth-helpers.ts)
async function hashPassword(password) {
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

// Script to migrate a specific user's bcrypt password to the new format
async function migrateBcryptPassword(email, plainPassword) {
  try {
    console.log(`🔍 Looking up user with email: ${email}`);

    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (userResults.length === 0) {
      console.error(`❌ No user found with email: ${email}`);
      return;
    }

    const user = userResults[0];
    console.log(`✅ User found: ID ${user.id}`);
    console.log(
      `📝 Current password hash: ${user.passwordHash.substring(0, 20)}...`
    );
    console.log(`📏 Hash length: ${user.passwordHash.length} characters`);

    // Verify the current password works with bcrypt
    if (user.passwordHash.length === 60 && user.passwordHash.startsWith('$2')) {
      console.log('🔐 Verifying current bcrypt password...');
      const isValid = await bcrypt.compare(plainPassword, user.passwordHash);

      if (!isValid) {
        console.error(
          '❌ The provided password does not match the current bcrypt hash!'
        );
        console.error('   Please check the password and try again.');
        return;
      }

      console.log('✅ Password verified successfully!');

      // Generate new PBKDF2 hash
      console.log('🔄 Generating new PBKDF2+salt hash...');
      const newHash = await hashPassword(plainPassword);
      console.log(`📝 New hash: ${newHash.substring(0, 20)}...`);
      console.log(`📏 New hash length: ${newHash.length} characters`);

      // Update the database
      console.log('💾 Updating database...');
      await db
        .update(users)
        .set({ passwordHash: newHash })
        .where(eq(users.id, user.id));

      console.log('🎉 Password migration completed successfully!');
      console.log(
        '🔑 The user can now log in with their existing password using the new secure format.'
      );
    } else {
      console.log(
        'ℹ️  This user does not have a bcrypt password (length: ' +
          user.passwordHash.length +
          ')'
      );
      console.log(
        '📝 Current hash format appears to be: ' +
          (user.passwordHash.length === 64
            ? 'SHA-256'
            : user.passwordHash.length === 96
              ? 'PBKDF2+salt'
              : 'Unknown')
      );
    }
  } catch (error) {
    console.error('💥 Error during migration:', error);
  }
}

// Usage
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log(
    'Usage: npx tsx scripts/migrate-bcrypt-password.js <email> <password>'
  );
  console.log(
    'Example: npx tsx scripts/migrate-bcrypt-password.js user@example.com mypassword123'
  );
  process.exit(1);
}

migrateBcryptPassword(email, password);
