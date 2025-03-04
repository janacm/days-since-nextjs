// Script to create users table in Neon database
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = `
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT email_unique UNIQUE ("email")
);
`;

async function main() {
  try {
    console.log('Connecting to database...');
    const dbClient = neon(process.env.POSTGRES_URL);

    console.log('Executing SQL to create users table...');
    await dbClient(sql);

    console.log('Users table created successfully!');
  } catch (error) {
    console.error('Error creating users table:', error);
  }
}

main();
