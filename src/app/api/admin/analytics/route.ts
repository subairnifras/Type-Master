import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Authorize Admin
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 403 });
    }

    // 2. Fetch aggregates
    const [usersCount] = await query('SELECT COUNT(*) as count FROM users') as any[];
    const [statsCount] = await query('SELECT COUNT(*) as count FROM typing_stats') as any[];
    const [avgStats] = await query('SELECT AVG(wpm) as avg_wpm, AVG(accuracy) as avg_acc FROM typing_stats') as any[];

    return NextResponse.json({
      success: true,
      analytics: {
        totalUsers: usersCount?.count || 0,
        totalTests: statsCount?.count || 0,
        avgWpm: avgStats?.avg_wpm ? Math.round(Number(avgStats.avg_wpm)) : 0,
        avgAccuracy: avgStats?.avg_acc ? Math.round(Number(avgStats.avg_acc)) : 0
      }
    });

  } catch (error: any) {
    console.error('Admin analytics API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve analytics' }, { status: 500 });
  }
}
