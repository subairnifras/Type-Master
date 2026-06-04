import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'typemaster_jwt_secure_key_9871536420123';
const COOKIE_NAME = 'typemaster_session';

export interface UserSession {
  userId: number;
  username: string;
  role: string;
}

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (error) {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getSessionUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionToken) return null;
  return verifyToken(sessionToken);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUserDbDetails() {
  const session = await getSessionUser();
  if (!session) return null;

  try {
    const users = await query(
      'SELECT id, username, email, role, avatar_url, created_at FROM users WHERE id = ?',
      [session.userId]
    ) as any[];

    if (users.length === 0) return null;
    return users[0];
  } catch (error) {
    console.error('Error fetching user DB details:', error);
    return null;
  }
}
