import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { createUser, getUserByEmail } from '@/lib/db';
import { signIn } from '@/lib/auth';
import { z } from 'zod';
import { redirect } from 'next/navigation';

const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional()
});

async function registerUser(formData: FormData) {
  'use server';

  try {
    // Validate the form data
    const validatedFields = SignupSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name')
    });

    const email = validatedFields.email;
    console.log(`Checking if user exists with email: ${email}`);

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.error(`User already exists with email: ${email}`);
      throw new Error('User with this email already exists');
    }

    // Hash the password
    console.log('Hashing password');
    const { hashPassword } = await import('@/lib/auth-helpers');
    const hashedPassword = await hashPassword(validatedFields.password);

    // Create the user
    console.log('Creating user');
    const newUser = await createUser(
      email,
      hashedPassword,
      validatedFields.name || undefined
    );
    console.log(`User created with ID: ${newUser.id}`);

    // Sign the user in
    console.log('Signing in user');
    await signIn('credentials', {
      email: validatedFields.email,
      password: validatedFields.password,
      redirectTo: '/'
    });

    return redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex justify-center items-start md:items-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Sign up to get started with Days Since
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={registerUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters long
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
              />
            </div>
            <Button type="submit" className="w-full">
              Create account
            </Button>

            <div className="text-red-500 text-sm text-center">
              {/* Error messages will be shown by Next.js built-in error handling */}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
