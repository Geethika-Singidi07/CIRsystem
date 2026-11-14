import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  ImageIcon,
  Search,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatusIndicator } from '../components/StatusIndicator';
import { useAuth } from '../context/AuthContext';
import {
  getComplaintImage,
  subscribeAllComplaints,
  updateComplaintAdminStatus,
} from '../services/cirsService';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  Complaint,
  ComplaintImage,
  ComplaintStatus,
  FIELD_LIMITS,
  MUNICIPAL_DEPARTMENTS,
} from '../types/cirs';

const STATUS_FILTERS: ('All' | ComplaintStatus)[] = ['All', 'Pending', 'In Progress', 'Resolved'];

function formatDate(ts?: { toDate?: () => Date }): string {
  if (!ts?.toDate) return 'Just now';
  return ts.toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AdminDashboard() {
  const { authReady, isAdmin } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ComplaintStatus>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [communityFilter, setCommunityFilter] = useState<string>('All');

  // Selected complaint drawer state
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [selectedImage, setSelectedImage] = useState<ComplaintImage | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const [editStatus, setEditStatus] = useState<ComplaintStatus>('Pending');
  const [editDepartment, setEditDepartment] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady || !isAdmin) return;

    setLoading(true);
    setError(null);
    const unsubscribe = subscribeAllComplaints(
      (items) => {
        setComplaints(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authReady, isAdmin]);

  const metrics = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === 'Pending').length,
      inProgress: complaints.filter((c) => c.status === 'In Progress').length,
      resolved: complaints.filter((c) => c.status === 'Resolved').length,
    };
  }, [complaints]);

  const communityOptions = useMemo(() => {
    const set = new Set<string>();
    complaints.forEach((c) => {
      if (c.communityName) set.add(c.communityName);
    });
    return Array.from(set).sort();
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return complaints.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (communityFilter !== 'All' && item.communityName !== communityFilter) return false;
      if (!q) return true;
      return (
        item.referenceId.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.citizenName.toLowerCase().includes(q) ||
        item.citizenEmail.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.communityName.toLowerCase().includes(q)
      );
    });
  }, [complaints, searchQuery, statusFilter, categoryFilter, communityFilter]);

  const openInspector = async (complaint: Complaint) => {
    setSelected(complaint);
    setEditStatus(complaint.status);
    setEditDepartment(complaint.assignedDepartment || '');
    setEditRemarks(complaint.adminRemarks || '');
    setSaveSuccess(null);
    setSaveError(null);
    setSelectedImage(null);

    if (complaint.hasImage) {
      setLoadingImage(true);
      try {
        const img = await getComplaintImage(complaint.id);
        setSelectedImage(img);
      } catch {
        setSelectedImage(null);
      } finally {
        setLoadingImage(false);
      }
    }
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setSaveSuccess(null);
    setSaveError(null);
    setSaving(true);
    try {
      await updateComplaintAdminStatus({
        complaintId: selected.id,
        status: editStatus,
        adminRemarks: editRemarks,
        assignedDepartment: editDepartment,
      });

      setSelected((prev) =>
        prev
          ? {
              ...prev,
              status: editStatus,
              adminRemarks: editRemarks.trim(),
              assignedDepartment: editDepartment.trim(),
            }
          : null
      );
      setSaveSuccess(`Updated ${selected.referenceId} to "${editStatus}".`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save status update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell mode="admin" breadcrumb="Complaints Overview">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-civic-navy tracking-tight">
            Municipal Complaints Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review citizen reports across all communities, inspect attached photos, assign
            departments, and publish status updates.
          </p>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Total Complaints</p>
            <p className="text-2xl font-bold text-civic-navy font-mono tabular-nums mt-1.5">
              {metrics.total}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Pending Review</p>
            <p className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1.5">
              {metrics.pending}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">In Progress</p>
            <p className="text-2xl font-bold text-civic-royal font-mono tabular-nums mt-1.5">
              {metrics.inProgress}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Resolved</p>
            <p className="text-2xl font-bold text-civic-green font-mono tabular-nums mt-1.5">
              {metrics.resolved}
            </p>
          </div>
        </div>

        {/* Search & Multi-Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by reference ID, title, citizen name, email, or street..."
                aria-label="Search all complaints"
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[420px]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal"
              >
                <option value="All">All Categories</option>
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={communityFilter}
                onChange={(e) => setCommunityFilter(e.target.value)}
                aria-label="Filter by community"
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal"
              >
                <option value="All">All Communities</option>
                {communityOptions.map((comm) => (
                  <option key={comm} value={comm}>
                    {comm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === status
                      ? 'bg-white text-civic-navy shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500 font-mono tabular-nums">
              Showing {filteredComplaints.length} of {complaints.length} reports
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3 text-sm text-red-900">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to load complaints queue</p>
              <p className="text-xs text-red-800 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="p-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-64 bg-slate-200 rounded" />
                <div className="h-4 w-28 bg-slate-100 rounded" />
                <div className="h-6 w-24 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredComplaints.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <h2 className="text-base font-semibold text-civic-navy mb-1">
              {complaints.length === 0
                ? 'No citizen complaints have been submitted yet'
                : 'No complaints match your active filters'}
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              {complaints.length === 0
                ? 'New resident issue reports will appear here in real time.'
                : 'Adjust your search terms or reset filters to view all reports.'}
            </p>
            {complaints.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setCategoryFilter('All');
                  setCommunityFilter('All');
                }}
                className="px-4 py-2 text-xs font-semibold text-civic-royal bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* High-Density Complaints Table */}
        {!loading && !error && filteredComplaints.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 whitespace-nowrap">Reference ID</th>
                    <th className="py-3 px-4">Issue &amp; Location</th>
                    <th className="py-3 px-4 whitespace-nowrap">Citizen</th>
                    <th className="py-3 px-4 whitespace-nowrap">Category</th>
                    <th className="py-3 px-4 whitespace-nowrap">Submitted</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredComplaints.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => void openInspector(item)}
                      className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-civic-royal whitespace-nowrap">
                        {item.referenceId}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-civic-navy truncate">
                            {item.title}
                          </span>
                          {(item.hasImage || item.imageUrl) && (
                            <ImageIcon
                              className="w-3.5 h-3.5 text-slate-400 shrink-0"
                              aria-label="Has attached photo"
                            />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {item.communityName} · {item.location}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-xs font-medium text-slate-900">{item.citizenName}</p>
                        <p className="text-[11px] text-slate-500">{item.citizenEmail}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {item.category}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 font-mono tabular-nums whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusIndicator status={item.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void openInspector(item);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-civic-royal bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Complaint Review & Update Slide-Over Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setSelected(null)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-full max-w-xl bg-white h-full overflow-y-auto border-l border-slate-200 flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 z-10">
              <div>
                <p className="text-xs font-mono font-semibold text-civic-royal">
                  {selected.referenceId}
                </p>
                <h2 className="text-base font-bold text-civic-navy truncate max-w-md">
                  {selected.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close detail drawer"
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* Metadata Summary */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                <div>
                  <p className="text-slate-500">Submitted By</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{selected.citizenName}</p>
                  <p className="text-slate-600">{selected.citizenEmail}</p>
                </div>
                <div>
                  <p className="text-slate-500">Community &amp; Category</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{selected.communityName}</p>
                  <p className="text-slate-600">{selected.category}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">Street Location</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{selected.location}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-700 mb-1.5">
                  Citizen Description
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 border border-slate-200 rounded-lg p-4">
                  {selected.description}
                </p>
              </div>

              {/* Uploaded Photo */}
              {(selected.hasImage || selected.imageUrl) && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 mb-2">
                    Submitted Evidence Photo
                  </h3>
                  {loadingImage ? (
                    <div className="h-44 rounded-lg bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-500">
                      Loading photo...
                    </div>
                  ) : selectedImage?.dataUrl || selected.imageUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={selectedImage?.dataUrl || selected.imageUrl}
                        alt={`Evidence for ${selected.referenceId}`}
                        referrerPolicy="no-referrer"
                        className="w-full max-h-72 object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Photo attachment unavailable.</p>
                  )}
                </div>
              )}

              {/* Admin Resolution Form */}
              <form
                onSubmit={handleSaveUpdate}
                className="pt-5 border-t border-slate-200 space-y-4"
              >
                <h3 className="text-sm font-bold text-civic-navy">
                  Update Status &amp; Official Remarks
                </h3>

                {saveSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-medium text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{saveSuccess}</span>
                  </div>
                )}

                {saveError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-medium text-red-900">
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Complaint Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {COMPLAINT_STATUSES.map((statusOption) => (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => setEditStatus(statusOption)}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                          editStatus === statusOption
                            ? 'bg-civic-navy text-white border-civic-navy'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="assignedDepartment"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Assigned Department
                  </label>
                  <select
                    id="assignedDepartment"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal"
                  >
                    <option value="">Unassigned</option>
                    {MUNICIPAL_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="adminRemarks"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Admin Remarks &amp; Citizen Feedback
                    </label>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {editRemarks.length}/{FIELD_LIMITS.adminRemarks.max}
                    </span>
                  </div>
                  <textarea
                    id="adminRemarks"
                    rows={4}
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    maxLength={FIELD_LIMITS.adminRemarks.max}
                    placeholder="Provide inspection findings, crew dispatch dates, or completion notes visible to the citizen..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-semibold text-white bg-civic-green hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {saving ? 'Saving Changes...' : 'Save Status & Remarks'}
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
