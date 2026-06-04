import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { usernameOrEmail, password } = await request.json();

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required' },
        { status: 400 }
      );
    }

    // 1. Fetch user by username or email
    const users = await query(
      'SELECT id, username, email, password_hash, role, avatar_url FROM users WHERE username = ? OR email = ?',
      [usernameOrEmail, usernameOrEmail]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = users[0];

    // 2. Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 3. Generate token and set session cookie
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url,
      }
    });

  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
