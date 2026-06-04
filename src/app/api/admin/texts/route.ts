import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// Add new practice text
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, content, category } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    await query(
      'INSERT INTO practice_texts (title, content, category) VALUES (?, ?, ?)',
      [title, content, category || 'general']
    );

    return NextResponse.json({ success: true, message: 'Practice text added successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to add practice text' }, { status: 500 });
  }
}

// Edit existing practice text
export async function PUT(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { textId, title, content, category } = await request.json();

    if (!textId || !title || !content) {
      return NextResponse.json({ error: 'Text ID, title, and content are required' }, { status: 400 });
    }

    await query(
      'UPDATE practice_texts SET title = ?, content = ?, category = ? WHERE id = ?',
      [title, content, category || 'general', textId]
    );

    return NextResponse.json({ success: true, message: 'Practice text updated.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update practice text' }, { status: 500 });
  }
}

// Delete practice text
export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const textIdStr = searchParams.get('textId');
    if (!textIdStr) {
      return NextResponse.json({ error: 'Missing textId parameter' }, { status: 400 });
    }

    const textId = parseInt(textIdStr, 10);

    await query(
      'DELETE FROM practice_texts WHERE id = ?',
      [textId]
    );

    return NextResponse.json({ success: true, message: 'Practice text deleted.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete practice text' }, { status: 500 });
  }
}
