import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List guardians for an application
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId is required' },
        { status: 400 }
      );
    }

    const { data: guardians, error } = await supabase
      .from('guardians')
      .select('*')
      .eq('application_id', applicationId)
      .order('is_emergency_contact', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch guardians error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch guardians', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ guardians: guardians || [] });

  } catch (error: any) {
    console.error('Guardians list error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new guardian
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const {
      application_id,
      full_name,
      relationship,
      phone,
      alt_phone,
      email,
      occupation,
      postal_address,
      county,
      town,
      is_emergency_contact,
    } = body;

    if (!application_id || !full_name || !relationship || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: application_id, full_name, relationship, phone' },
        { status: 400 }
      );
    }

    const { data: guardian, error } = await supabase
      .from('guardians')
      .insert({
        application_id,
        full_name,
        relationship,
        phone,
        alt_phone: alt_phone || null,
        email: email || null,
        occupation: occupation || null,
        postal_address: postal_address || null,
        county: county || null,
        town: town || null,
        is_emergency_contact: is_emergency_contact ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Create guardian error:', error);
      return NextResponse.json(
        { error: 'Failed to create guardian', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      guardian,
      message: 'Guardian added successfully',
    });

  } catch (error: any) {
    console.error('Guardian create error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
