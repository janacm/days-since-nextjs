import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Call the reminders API to send emails
    // Determine the base URL for the reminders API. Prefer NEXT_PUBLIC_APP_URL
    // but fall back to NEXTAUTH_URL for production environments where the
    // former might not be defined.
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

    const response = await fetch(`${baseUrl}/api/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to send reminders');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
