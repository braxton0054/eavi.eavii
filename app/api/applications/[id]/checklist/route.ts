import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch document checklist status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id } = await params;
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        has_spring_file,
        has_rem_paper,
        has_kcse_photocopy,
        has_kcpe_photocopy
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Fetch checklist error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch checklist', details: error.message },
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      checklist: {
        has_spring_file: application.has_spring_file || false,
        has_rem_paper: application.has_rem_paper || false,
        has_kcse_photocopy: application.has_kcse_photocopy || false,
        has_kcpe_photocopy: application.has_kcpe_photocopy || false,
      },
    });

  } catch (error: any) {
    console.error('Checklist fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update document checklist status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id } = await params;
    const body = await request.json();
    const { has_spring_file, has_rem_paper, has_kcse_photocopy, has_kcpe_photocopy } = body;

    // Build update object with only provided fields
    const updates: any = {};
    if (has_spring_file !== undefined) updates.has_spring_file = has_spring_file;
    if (has_rem_paper !== undefined) updates.has_rem_paper = has_rem_paper;
    if (has_kcse_photocopy !== undefined) updates.has_kcse_photocopy = has_kcse_photocopy;
    if (has_kcpe_photocopy !== undefined) updates.has_kcpe_photocopy = has_kcpe_photocopy;
    updates.updated_at = new Date().toISOString();

    const { data: application, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select(`
        has_spring_file,
        has_rem_paper,
        has_kcse_photocopy,
        has_kcpe_photocopy
      `)
      .single();

    if (error) {
      console.error('Update checklist error:', error);
      return NextResponse.json(
        { error: 'Failed to update checklist', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checklist: {
        has_spring_file: application.has_spring_file || false,
        has_rem_paper: application.has_rem_paper || false,
        has_kcse_photocopy: application.has_kcse_photocopy || false,
        has_kcpe_photocopy: application.has_kcpe_photocopy || false,
      },
      message: 'Checklist updated successfully',
    });

  } catch (error: any) {
    console.error('Checklist update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
