import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List announcements (with filters)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get('campus');
    const audience = searchParams.get('audience');
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabase
      .from('announcements')
      .select(`
        *,
        creator:created_by (full_name)
      `)
      .order('is_pinned', { ascending: false })
      .order('publish_at', { ascending: false });

    if (campus) {
      query = query.or(`campus.eq.${campus},campus.is.null`);
    }

    if (audience) {
      query = query.contains('audience', [audience]);
    }

    if (activeOnly) {
      const now = new Date().toISOString();
      query = query
        .lte('publish_at', now)
        .or(`expire_at.is.null,expire_at.gt.${now}`);
    }

    const { data: announcements, error } = await query;

    if (error) {
      console.error('Fetch announcements error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch announcements', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ announcements: announcements || [] });

  } catch (error: any) {
    console.error('Announcements list error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create announcement
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const {
      title,
      body: content,
      category,
      audience,
      campus,
      is_pinned,
      publish_at,
      expire_at,
      created_by,
    } = body;

    if (!title || !content || !category || !audience) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body, category, audience' },
        { status: 400 }
      );
    }

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        title,
        body: content,
        category,
        audience: Array.isArray(audience) ? audience : [audience],
        campus: campus || null,
        is_pinned: is_pinned || false,
        publish_at: publish_at || new Date().toISOString(),
        expire_at: expire_at || null,
        created_by,
      })
      .select()
      .single();

    if (error) {
      console.error('Create announcement error:', error);
      return NextResponse.json(
        { error: 'Failed to create announcement', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
      message: 'Announcement created successfully',
    });

  } catch (error: any) {
    console.error('Announcement create error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
