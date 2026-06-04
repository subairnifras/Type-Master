import { NextResponse } from 'next/server';
import { query, getDbPool } from '@/lib/db';

export async function GET() {
  try {
    // Ensure database is initialized
    await getDbPool();

    const texts = await query(
      'SELECT id, title, content, category FROM practice_texts ORDER BY created_at DESC'
    ) as any[];

    return NextResponse.json({ success: true, texts });
  } catch (error: any) {
    console.error('Fetch texts API error:', error);
    // Fallback texts in case of database connectivity issues during build or run
    const fallbackTexts = [
      {
        id: 1,
        title: 'The Mechanical Keyboard',
        category: 'hardware',
        content: 'The satisfying click-clack of a mechanical keyboard is music to a typist\'s ears. Tactile switches provide tactile feedback, while linear ones offer a smooth keystroke. Custom keycaps, stabilizers, and lubricated switches elevate the typing experience to an art form.'
      },
      {
        id: 2,
        title: 'A Glimpse into Space',
        category: 'science',
        content: 'Gazing up at the night sky, one cannot help but feel small in the face of the infinite cosmos. Billions of galaxies swirl in the dark expanse, each hosting countless stars and planets. Space exploration pushes the boundaries of human knowledge and sparks our imagination.'
      }
    ];
    return NextResponse.json({ success: true, texts: fallbackTexts });
  }
}
