import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    // 1. Basic validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email and password are required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // 2. Check if username or email already exists
    const existingUsers = await query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [username, email]
    ) as any[];

    if (existingUsers.length > 0) {
      const duplicate = existingUsers[0];
      if (duplicate.username.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
    }

    // 3. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Insert user
    const result = await query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, 'user']
    ) as any;

    const userId = result.insertId;

    // 5. Generate and set JWT session cookie
    const token = signToken({
      userId,
      username,
      role: 'user',
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username,
        email,
        role: 'user',
      }
    });

  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
