import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', 'bursary-form.pdf');
    const fileBuffer = await readFile(filePath);
    
    // Create a proper PDF response
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="bursary-form.pdf"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
    
    return response;
  } catch (error) {
    console.error('Error serving bursary form:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
