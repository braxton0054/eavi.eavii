import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create client lazily to avoid build-time errors
const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// PUT - Update announcement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id } = await params;
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
    } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.body = content;
    if (category !== undefined) updates.category = category;
    if (audience !== undefined) updates.audience = Array.isArray(audience) ? audience : [audience];
    if (campus !== undefined) updates.campus = campus || null;
    if (is_pinned !== undefined) updates.is_pinned = is_pinned;
    if (publish_at !== undefined) updates.publish_at = publish_at;
    if (expire_at !== undefined) updates.expire_at = expire_at || null;
    updates.updated_at = new Date().toISOString();

    const { data: announcement, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update announcement error:', error);
      return NextResponse.json(
        { error: 'Failed to update announcement', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
      message: 'Announcement updated successfully',
    });

  } catch (error: any) {
    console.error('Announcement update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id } = await params;
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete announcement error:', error);
      return NextResponse.json(
        { error: 'Failed to delete announcement', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
    });

  } catch (error: any) {
    console.error('Announcement delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
