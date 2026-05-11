'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BridgeGroup {
  id: string;
  group_name: string;
  intake: string;
  campus: string;
  start_date: string;
  sync_target_date: string;
  acceleration_factor: number;
  milestone_module: number;
  milestone_semester: number;
  catch_up_hours_needed: number;
  catch_up_hours_completed: number;
  status: 'active' | 'merged' | 'cancelled';
  merged_date: string | null;
  academic_calendar: { academic_year: string };
}

export default function BridgeGroupsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [bridgeGroups, setBridgeGroups] = useState<BridgeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ campus: '', status: '' });
  const [showForm, setShowForm] = useState(false);
  const [academicCalendars, setAcademicCalendars] = useState<any[]>([]);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login/admin');
        return;
      }

      const userRole = session.user?.user_metadata?.role;
      if (userRole !== 'admin') {
        router.push('/login/admin');
        return;
      }

      fetchBridgeGroups();
      fetchAcademicCalendars();
    };

    checkAuth();
  }, [supabase, filter]);

  const fetchBridgeGroups = async () => {
    try {
      let url = '/api/bridge-groups?';
      if (filter.campus) url += `campus=${filter.campus}&`;
      if (filter.status) url += `status=${filter.status}&`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setBridgeGroups(data || []);
    } catch (err) {
      console.error('Failed to fetch bridge groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicCalendars = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_calendar')
        .select('id, academic_year')
        .order('academic_year', { ascending: false });

      if (!error) {
        setAcademicCalendars(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch academic calendars:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/bridge-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_name: formData.get('group_name'),
          intake: formData.get('intake'),
          academic_calendar_id: formData.get('academic_calendar_id'),
          campus: formData.get('campus'),
          start_date: formData.get('start_date'),
          sync_target_date: formData.get('sync_target_date'),
          acceleration_factor: parseFloat(formData.get('acceleration_factor') as string),
          milestone_module: parseInt(formData.get('milestone_module') as string),
          milestone_semester: parseInt(formData.get('milestone_semester') as string),
          catch_up_hours_needed: parseInt(formData.get('catch_up_hours_needed') as string) || 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to create');

      setShowForm(false);
      fetchBridgeGroups();
    } catch (err) {
      alert('Failed to create bridge group');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'merged':
        return 'bg-blue-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const calculateProgress = (completed: number, needed: number) => {
    if (!needed) return 0;
    return Math.min(100, Math.round((completed / needed) * 100));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading bridge groups...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bridge Groups</h1>
            <p className="text-gray-600 mt-1">
              Accelerated learning groups for catching up to main stream
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create Bridge Group
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 rounded-lg shadow p-4 mb-6 flex gap-4">
          <select
            value={filter.campus}
            onChange={(e) => setFilter({ ...filter, campus: e.target.value })}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Campuses</option>
            <option value="main">Main Campus</option>
            <option value="west">West Campus</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="merged">Merged</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={() => setFilter({ campus: '', status: '' })}
            className="text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-green-600">
              {bridgeGroups.filter(g => g.status === 'active').length}
            </p>
            <p className="text-sm text-gray-600">Active Groups</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-blue-600">
              {bridgeGroups.filter(g => g.status === 'merged').length}
            </p>
            <p className="text-sm text-gray-600">Merged Groups</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-purple-600">
              {bridgeGroups.length}
            </p>
            <p className="text-sm text-gray-600">Total Groups</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-orange-600">
              {bridgeGroups.reduce((acc, g) => acc + (g.acceleration_factor || 1), 0).toFixed(1)}x
            </p>
            <p className="text-sm text-gray-600">Avg Acceleration</p>
          </div>
        </div>

        {/* Bridge Groups List */}
        <div className="bg-gray-50 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm">Group Name</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Campus</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Intake</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Acceleration</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Target</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Progress</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bridgeGroups.map((group) => (
                <tr key={group.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{group.group_name}</div>
                    <div className="text-xs text-gray-500">
                      {group.academic_calendar?.academic_year}
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize">{group.campus}</td>
                  <td className="py-3 px-4">{group.intake}</td>
                  <td className="py-3 px-4">
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                      {group.acceleration_factor}x speed
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      Module {group.milestone_module}, Sem {group.milestone_semester}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(group.sync_target_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${calculateProgress(group.catch_up_hours_completed, group.catch_up_hours_needed)}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {group.catch_up_hours_completed}/{group.catch_up_hours_needed} hrs
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(group.status)}`}>
                      {group.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/bridge-groups/${group.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {bridgeGroups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No bridge groups found. Create one to get started.
            </div>
          )}
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
            <div className="bg-gray-50 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
              <h2 className="text-xl font-bold mb-4">Create Bridge Group</h2>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Group Name *</label>
                  <input
                    name="group_name"
                    type="text"
                    required
                    placeholder="e.g., Bridge Group A - May 2024"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Campus *</label>
                    <select name="campus" required className="w-full border rounded-lg px-3 py-2">
                      <option value="main">Main Campus</option>
                      <option value="west">West Campus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Intake *</label>
                    <input
                      name="intake"
                      type="text"
                      required
                      placeholder="e.g., May 2024"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Academic Year *</label>
                  <select name="academic_calendar_id" required className="w-full border rounded-lg px-3 py-2">
                    <option value="">Select academic year</option>
                    {academicCalendars.map((cal) => (
                      <option key={cal.id} value={cal.id}>{cal.academic_year}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date *</label>
                    <input
                      name="start_date"
                      type="date"
                      required
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Merge Date *</label>
                    <input
                      name="sync_target_date"
                      type="date"
                      required
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Acceleration *</label>
                    <select name="acceleration_factor" required className="w-full border rounded-lg px-3 py-2">
                      <option value="1.5">1.5x (50% faster)</option>
                      <option value="2.0">2.0x (2x speed)</option>
                      <option value="2.5">2.5x</option>
                      <option value="3.0">3.0x</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Module *</label>
                    <input
                      name="milestone_module"
                      type="number"
                      min="1"
                      max="6"
                      defaultValue="1"
                      required
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Semester *</label>
                    <input
                      name="milestone_semester"
                      type="number"
                      min="1"
                      max="3"
                      defaultValue="1"
                      required
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Catch-up Hours Needed</label>
                  <input
                    name="catch_up_hours_needed"
                    type="number"
                    defaultValue="0"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total hours required to catch up to main stream
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border rounded-lg py-2 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
