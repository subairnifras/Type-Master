import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const sql = `
      SELECT 
        u.id, 
        u.username, 
        u.avatar_url,
        MAX(s.wpm) as max_wpm, 
        MAX(s.cpm) as max_cpm, 
        ROUND(AVG(s.accuracy)) as avg_accuracy,
        COUNT(s.id) as tests_completed
      FROM users u
      JOIN typing_stats s ON u.id = s.user_id
      GROUP BY u.id, u.username, u.avatar_url
      ORDER BY max_wpm DESC, avg_accuracy DESC
      LIMIT 50
    `;

    const leaderboard = await query(sql) as any[];

    // Ensure database properties are converted to expected numeric formats
    const formattedLeaderboard = leaderboard.map(row => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatar_url,
      maxWpm: Number(row.max_wpm),
      maxCpm: Number(row.max_cpm),
      avgAccuracy: Number(row.avg_accuracy),
      testsCompleted: Number(row.tests_completed)
    }));

    return NextResponse.json({ success: true, leaderboard: formattedLeaderboard });

  } catch (error: any) {
    console.error('Fetch leaderboard API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve leaderboard.' }, { status: 500 });
  }
}
