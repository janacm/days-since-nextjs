'use server';

import { signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function handleLogin(formData: FormData) {
  try {
    // Log what we're trying to authenticate with
    console.log('Login attempt for email:', formData.get('email'));

    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false // Disable automatic redirection
    });

    // If we get here, the sign in was successful
    redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    // We can't return errors directly in the current setup, so we'll use console logs
    throw error;
  }
}
