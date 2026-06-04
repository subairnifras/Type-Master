import { NextResponse } from 'next/server';
import { getCurrentUserDbDetails } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUserDbDetails();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve user session' }, { status: 500 });
  }
}
