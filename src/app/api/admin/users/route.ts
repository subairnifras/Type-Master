import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// Get all users
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY id ASC'
    ) as any[];

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to retrieve users' }, { status: 500 });
  }
}

// Modify user role (promote/demote)
export async function PUT(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Prevent admin from demoting themselves to avoid lockouts!
    if (userId === session.userId) {
      return NextResponse.json({ error: 'You cannot change your own role!' }, { status: 400 });
    }

    await query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    return NextResponse.json({ success: true, message: 'User role updated.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}

// Delete user profile
export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get('userId');
    if (!userIdStr) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const userId = parseInt(userIdStr, 10);

    // Prevent deleting oneself
    if (userId === session.userId) {
      return NextResponse.json({ error: 'You cannot delete your own account!' }, { status: 400 });
    }

    await query(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    return NextResponse.json({ success: true, message: 'User deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
