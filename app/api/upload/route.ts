import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'studentimages',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'studentimages123',
  },
  forcePathStyle: true,
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const applicationId = formData.get('application_id') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Allowed: jpg, jpeg, png, webp' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Max 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${ext}`;
    const key = `profiles/${filename}`;

    // Convert to buffer and upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await s3.send(new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET || 'student-images',
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || 'http://5.189.191.35:9000';
    const bucket = process.env.MINIO_BUCKET || 'student-images';
    const imageUrl = `${publicEndpoint}/${bucket}/${key}`;

    // Save to student_profiles
    const targetId = applicationId || user.id;
    await supabase
      .from('student_profiles')
      .upsert({ application_id: targetId, photo_url: imageUrl }, { onConflict: 'application_id' });

    // Also save to applications
    await supabase
      .from('applications')
      .update({ photo_url: imageUrl })
      .eq('id', targetId);

    return NextResponse.json({ success: true, url: imageUrl, filename });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
