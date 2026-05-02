'use client';

import { useState } from 'react';

interface StudentEnrollmentFormProps {
  applicationId?: string;
  onSubmit?: (data: any) => void;
  readOnly?: boolean;
  initialData?: any;
}

const SPONSORSHIP_TYPES = [
  { value: 'self', label: 'Self-sponsored' },
  { value: 'government', label: 'Government Sponsored' },
  { value: 'bursary', label: 'Bursary' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'employer', label: 'Employer Sponsored' },
];

const COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu',
  'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
  'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
];

export default function StudentEnrollmentForm({ 
  applicationId, 
  onSubmit, 
  readOnly = false,
  initialData = {}
}: StudentEnrollmentFormProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Info
    full_name: initialData.full_name || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    date_of_birth: initialData.date_of_birth || '',
    national_id: initialData.national_id || '',
    passport_number: initialData.passport_number || '',
    nationality: initialData.nationality || 'Kenyan',
    gender: initialData.gender || '',
    
    // Address
    county: initialData.county || '',
    sub_county: initialData.sub_county || '',
    town: initialData.town || '',
    postal_address: initialData.postal_address || '',
    
    // Photo
    photo_url: initialData.photo_url || '',
    
    // Disability
    disability_status: initialData.disability_status || false,
    disability_description: initialData.disability_description || '',
    
    // Education
    kcse_grade: initialData.kcse_grade || '',
    previous_school: initialData.previous_school || '',
    previous_qualification: initialData.previous_qualification || '',
    
    // Course
    course: initialData.course || '',
    course_type: initialData.course_type || '',
    campus: initialData.campus || 'main',
    
    // Sponsorship
    sponsorship_type: initialData.sponsorship_type || 'self',
    sponsor_name: initialData.sponsor_name || '',
    sponsor_phone: initialData.sponsor_phone || '',
    
    // Document Checklist (for new applications)
    has_spring_file: initialData.has_spring_file || false,
    has_rem_paper: initialData.has_rem_paper || false,
    has_kcse_photocopy: initialData.has_kcse_photocopy || false,
    has_kcpe_photocopy: initialData.has_kcpe_photocopy || false,
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (readOnly) return;
    
    setSaving(true);
    try {
      const url = applicationId 
        ? `/api/applications/${applicationId}` 
        : '/api/applications';
      const method = applicationId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      onSubmit?.(data);
      alert(applicationId ? 'Student updated successfully!' : 'Student enrolled successfully!');
    } catch (err) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Information', icon: '👤' },
    { number: 2, title: 'Contact & Address', icon: '📍' },
    { number: 3, title: 'Education Background', icon: '🎓' },
    { number: 4, title: 'Course & Sponsorship', icon: '📚' },
    { number: 5, title: 'Documents & Photo', icon: '📄' },
  ];

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Step 1: Personal Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  disabled={readOnly}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  disabled={readOnly}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">National ID / Passport *</label>
                <input
                  type="text"
                  value={formData.national_id}
                  onChange={(e) => handleChange('national_id', e.target.value)}
                  disabled={readOnly}
                  placeholder="e.g., 12345678"
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Passport Number (if foreign)</label>
                <input
                  type="text"
                  value={formData.passport_number}
                  onChange={(e) => handleChange('passport_number', e.target.value)}
                  disabled={readOnly}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nationality</label>
                <select
                  value={formData.nationality}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  disabled={readOnly}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Kenyan">Kenyan</option>
                  <option value="Ugandan">Ugandan</option>
                  <option value="Tanzanian">Tanzanian</option>
                  <option value="Rwandan">Rwandan</option>
                  <option value="Burundian">Burundian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  disabled={readOnly}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Disability Section */}
            <div className="border-t pt-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.disability_status}
                  onChange={(e) => handleChange('disability_status', e.target.checked)}
                  disabled={readOnly}
                  className="w-4 h-4"
                />
                <span className="font-medium">Person with Disability</span>
              </label>
              
              {formData.disability_status && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Nature of Disability</label>
                  <textarea
                    value={formData.disability_description}
                    onChange={(e) => handleChange('disability_description', e.target.value)}
                    disabled={readOnly}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Describe the disability and any special requirements..."
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Step 2: Contact & Address</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={readOnly}
                  placeholder="e.g., 0712345678"
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={readOnly}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">County *</label>
              <select
                value={formData.county}
                onChange={(e) => handleChange('county', e.target.value)}
                disabled={readOnly}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select county</option>
                {COUNTIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sub-County</label>
                <input
                  type="text"
                  value={formData.sub_county}
                  onChange={(e) => handleChange('sub_county', e.target.value)}
                  disabled={readOnly}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Town / City</label>
                <input
                  type="text"
                  value={formData.town}
                  onChange={(e) => handleChange('town', e.target.value)}
                  disabled={readOnly}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Postal Address</label>
              <input
                type="text"
                value={formData.postal_address}
                onChange={(e) => handleChange('postal_address', e.target.value)}
                disabled={readOnly}
                placeholder="P.O. Box 123, Nairobi"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Step 3: Education Background</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">KCSE Grade *</label>
              <select
                value={formData.kcse_grade}
                onChange={(e) => handleChange('kcse_grade', e.target.value)}
                disabled={readOnly}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select grade</option>
                <option value="A">A</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B">B</option>
                <option value="B-">B-</option>
                <option value="C+">C+</option>
                <option value="C">C</option>
                <option value="C-">C-</option>
                <option value="D+">D+</option>
                <option value="D">D</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Previous School / Institution</label>
              <input
                type="text"
                value={formData.previous_school}
                onChange={(e) => handleChange('previous_school', e.target.value)}
                disabled={readOnly}
                placeholder="Name of high school or previous college"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Previous Qualification (if any)</label>
              <input
                type="text"
                value={formData.previous_qualification}
                onChange={(e) => handleChange('previous_qualification', e.target.value)}
                disabled={readOnly}
                placeholder="e.g., Certificate in IT, Diploma in Business"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Step 4: Course & Sponsorship</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course *</label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => handleChange('course', e.target.value)}
                  disabled={readOnly}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Course Type</label>
                <select
                  value={formData.course_type}
                  onChange={(e) => handleChange('course_type', e.target.value)}
                  disabled={readOnly}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select type</option>
                  <option value="diploma">Diploma</option>
                  <option value="certificate">Certificate</option>
                  <option value="artisan">Artisan</option>
                  <option value="craft">Craft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Campus *</label>
              <select
                value={formData.campus}
                onChange={(e) => handleChange('campus', e.target.value)}
                disabled={readOnly}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="main">Main Campus</option>
                <option value="west">West Campus</option>
              </select>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Sponsorship Information</h4>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Sponsorship Type</label>
                <select
                  value={formData.sponsorship_type}
                  onChange={(e) => handleChange('sponsorship_type', e.target.value)}
                  disabled={readOnly}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  {SPONSORSHIP_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {formData.sponsorship_type !== 'self' && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Sponsor Name</label>
                    <input
                      type="text"
                      value={formData.sponsor_name}
                      onChange={(e) => handleChange('sponsor_name', e.target.value)}
                      disabled={readOnly}
                      placeholder="e.g., County Government, Company Name"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Sponsor Phone</label>
                    <input
                      type="tel"
                      value={formData.sponsor_phone}
                      onChange={(e) => handleChange('sponsor_phone', e.target.value)}
                      disabled={readOnly}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Step 5: Documents & Photo</h3>
            
            {/* Passport Photo */}
            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">Passport Photo</label>
              {formData.photo_url ? (
                <div className="flex items-center gap-4">
                  <img 
                    src={formData.photo_url} 
                    alt="Passport" 
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  {!readOnly && (
                    <button
                      onClick={() => handleChange('photo_url', '')}
                      className="text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <p className="text-gray-500 mb-2">Photo upload placeholder</p>
                  <p className="text-xs text-gray-400">(Integration with photo upload system needed)</p>
                </div>
              )}
            </div>

            {/* Required Documents Checklist */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Required Documents Brought</h4>
              <p className="text-sm text-gray-500 mb-3">Check all documents the student has physically brought:</p>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_spring_file}
                    onChange={(e) => handleChange('has_spring_file', e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4"
                  />
                  <span>Spring File (Required)</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_rem_paper}
                    onChange={(e) => handleChange('has_rem_paper', e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4"
                  />
                  <span>REM Paper (Required)</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_kcse_photocopy}
                    onChange={(e) => handleChange('has_kcse_photocopy', e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4"
                  />
                  <span>KCSE Certificate Photocopy (Required)</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_kcpe_photocopy}
                    onChange={(e) => handleChange('has_kcpe_photocopy', e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4"
                  />
                  <span>KCPE Certificate Photocopy (Optional)</span>
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Enrollment Summary</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Name:</strong> {formData.full_name || 'Not entered'}</p>
                <p><strong>ID:</strong> {formData.national_id || 'Not entered'}</p>
                <p><strong>Course:</strong> {formData.course || 'Not selected'}</p>
                <p><strong>Campus:</strong> {formData.campus === 'west' ? 'West Campus' : 'Main Campus'}</p>
                <p><strong>Sponsorship:</strong> {SPONSORSHIP_TYPES.find(t => t.value === formData.sponsorship_type)?.label}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Progress Steps */}
      <div className="border-b px-6 py-4">
        <div className="flex justify-between">
          {steps.map((s) => (
            <button
              key={s.number}
              onClick={() => !readOnly && setStep(s.number)}
              disabled={readOnly}
              className={`flex flex-col items-center ${
                step === s.number 
                  ? 'text-blue-600' 
                  : step > s.number 
                    ? 'text-green-600' 
                    : 'text-gray-400'
              }`}
            >
              <span className="text-xl mb-1">{s.icon}</span>
              <span className="text-xs font-medium">Step {s.number}</span>
              <span className="text-xs">{s.title}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      {!readOnly && (
        <div className="border-t px-6 py-4 flex justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          
          {step < steps.length ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : applicationId ? 'Update Student' : 'Enroll Student'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
