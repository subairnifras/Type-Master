import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// Save a typing test score
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to save your stats.' },
        { status: 401 }
      );
    }

    const { wpm, cpm, accuracy, testMode, duration } = await request.json();

    if (wpm === undefined || accuracy === undefined || duration === undefined) {
      return NextResponse.json(
        { error: 'Missing typing score metrics.' },
        { status: 400 }
      );
    }

    // Insert score into typing_stats
    await query(
      'INSERT INTO typing_stats (user_id, wpm, cpm, accuracy, test_mode, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [session.userId, wpm, cpm, accuracy, testMode || 'timed_60', duration]
    );

    return NextResponse.json({ success: true, message: 'Stats saved successfully.' });

  } catch (error: any) {
    console.error('Save stats API error:', error);
    return NextResponse.json({ error: 'Failed to save stats.' }, { status: 500 });
  }
}

// Fetch stats history for current user
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await query(
      'SELECT id, wpm, cpm, accuracy, test_mode, duration, created_at FROM typing_stats WHERE user_id = ? ORDER BY created_at ASC LIMIT 100',
      [session.userId]
    ) as any[];

    return NextResponse.json({ success: true, stats });

  } catch (error: any) {
    console.error('Fetch stats API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve stats.' }, { status: 500 });
  }
}
