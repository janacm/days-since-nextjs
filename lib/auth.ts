import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { getUserByEmail } from './db';
import { comparePasswords } from './auth-helpers';

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  debug: true,
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('Sign-in callback:', {
        user,
        account,
        profile,
        email,
        credentials
      });
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'name@example.com'
        },
        password: {
          label: 'Password',
          type: 'password'
        }
      },
      async authorize(credentials) {
        try {
          // Schema validation
          const parsedCredentials = z
            .object({
              email: z.string().email(),
              password: z.string().min(6)
            })
            .safeParse(credentials);

          if (!parsedCredentials.success) {
            console.error(
              'Validation error:',
              parsedCredentials.error.format()
            );
            return null;
          }

          const { email, password } = parsedCredentials.data;
          console.log(`Looking up user with email: ${email}`);

          const user = await getUserByEmail(email);

          if (!user) {
            console.error(`No user found with email: ${email}`);
            return null;
          }

          console.log(`User found: ${user.id}, attempting password comparison`);

          const passwordsMatch = await comparePasswords(
            password,
            user.passwordHash
          );

          if (!passwordsMatch) {
            console.error('Password comparison failed');
            return null;
          }

          console.log('Authentication successful');

          return {
            id: user.id.toString(),
            name: user.name || null,
            email: user.email
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ]
});
