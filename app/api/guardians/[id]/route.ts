import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - Update guardian
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
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

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (relationship !== undefined) updates.relationship = relationship;
    if (phone !== undefined) updates.phone = phone;
    if (alt_phone !== undefined) updates.alt_phone = alt_phone;
    if (email !== undefined) updates.email = email;
    if (occupation !== undefined) updates.occupation = occupation;
    if (postal_address !== undefined) updates.postal_address = postal_address;
    if (county !== undefined) updates.county = county;
    if (town !== undefined) updates.town = town;
    if (is_emergency_contact !== undefined) updates.is_emergency_contact = is_emergency_contact;

    const { data: guardian, error } = await supabase
      .from('guardians')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update guardian error:', error);
      return NextResponse.json(
        { error: 'Failed to update guardian', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      guardian,
      message: 'Guardian updated successfully',
    });

  } catch (error: any) {
    console.error('Guardian update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove guardian
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('guardians')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete guardian error:', error);
      return NextResponse.json(
        { error: 'Failed to delete guardian', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Guardian removed successfully',
    });

  } catch (error: any) {
    console.error('Guardian delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
