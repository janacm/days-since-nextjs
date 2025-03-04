import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';

export function LogoutButton() {
  return (
    <form
      action={async () => {
        'use server';
        await signOut({ redirectTo: '/login' });
      }}
    >
      <Button variant="ghost" size="sm">
        Logout
      </Button>
    </form>
  );
}
