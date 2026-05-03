import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch single application with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id } = await params;
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Application not found', details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch application', details: err.message },
      { status: 500 }
    );
  }
}

// PUT - Update application with extended fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id } = await params;
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('applications')
      .update({
        // Personal Info
        full_name: body.full_name,
        phone: body.phone,
        email: body.email,
        date_of_birth: body.date_of_birth,
        national_id: body.national_id,
        passport_number: body.passport_number,
        nationality: body.nationality,
        gender: body.gender,
        
        // Address
        county: body.county,
        sub_county: body.sub_county,
        town: body.town,
        postal_address: body.postal_address,
        
        // Photo
        photo_url: body.photo_url,
        
        // Disability
        disability_status: body.disability_status,
        disability_description: body.disability_description,
        
        // Education
        kcse_grade: body.kcse_grade,
        previous_school: body.previous_school,
        previous_qualification: body.previous_qualification,
        
        // Course
        course: body.course,
        course_type: body.course_type,
        campus: body.campus,
        
        // Sponsorship
        sponsorship_type: body.sponsorship_type,
        sponsor_name: body.sponsor_name,
        sponsor_phone: body.sponsor_phone,
        
        // Document checklist
        has_national_id: body.has_national_id,
        has_birth_certificate: body.has_birth_certificate,
        has_kcse_certificate: body.has_kcse_certificate,
        has_kcse_result_slip: body.has_kcse_result_slip,
        has_kcpe_certificate: body.has_kcpe_certificate,
        has_kcpe_result_slip: body.has_kcpe_result_slip,
        has_passport_photo: body.has_passport_photo,
        has_passport_document: body.has_passport_document,
        has_spring_file: body.has_spring_file,
        has_rem_paper: body.has_rem_paper,
        has_kcse_photocopy: body.has_kcse_photocopy,
        has_kcpe_photocopy: body.has_kcpe_photocopy,
        has_transfer_letter: body.has_transfer_letter,
        has_sponsor_letter: body.has_sponsor_letter,
        has_medical_certificate: body.has_medical_certificate,
        has_school_leaving: body.has_school_leaving,
        
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update application', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to update application', details: err.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    const { id } = await params;
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete application', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to delete application', details: err.message },
      { status: 500 }
    );
  }
}
