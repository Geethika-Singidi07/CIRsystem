import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ChevronRight, FilePlus2, ImageIcon, Search } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatusIndicator } from '../components/StatusIndicator';
import { useAuth } from '../context/AuthContext';
import { subscribeCitizenComplaints } from '../services/cirsService';
import { Complaint, ComplaintStatus } from '../types/cirs';

const STATUS_FILTERS: ('All' | ComplaintStatus)[] = ['All', 'Pending', 'In Progress', 'Resolved'];

function formatDate(ts?: { toDate?: () => Date }): string {
  if (!ts?.toDate) return 'Just now';
  return ts.toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function CitizenDashboard() {
  const { user, emailVerified, userProfile, authReady } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ComplaintStatus>('All');

  useEffect(() => {
    if (!authReady || !user || !emailVerified) return;

    setLoading(true);
    setError(null);
    const unsubscribe = subscribeCitizenComplaints(
      user.uid,
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
  }, [authReady, user, emailVerified]);

  const metrics = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === 'Pending').length,
      inProgress: complaints.filter((c) => c.status === 'In Progress').length,
      resolved: complaints.filter((c) => c.status === 'Resolved').length,
    };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return complaints.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.referenceId.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.communityName.toLowerCase().includes(q)
      );
    });
  }, [complaints, searchQuery, statusFilter]);

  return (
    <AppShell mode="citizen" breadcrumb="My Complaints">
      <div className="space-y-6">
        {/* Top Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-civic-navy tracking-tight">
              My Community Reports
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Welcome back, {userProfile?.fullName || user?.displayName || 'Resident'}. Track live
              status updates and municipal remarks for your submissions.
            </p>
          </div>
          <Link
            to="/submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-civic-royal hover:bg-civic-royal-hover rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <FilePlus2 className="w-4 h-4" aria-hidden="true" />
            <span>Submit New Complaint</span>
          </Link>
        </div>

        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">Total Submitted</p>
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

        {/* Search & Status Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference ID, title, or location..."
              aria-label="Search complaints"
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:bg-white"
            />
          </div>

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
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3 text-sm text-red-900">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to load your complaints</p>
              <p className="text-xs text-red-800 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
            {[1, 2, 3].map((row) => (
              <div key={row} className="p-5 flex items-center justify-between gap-4 animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-36 bg-slate-200 rounded" />
                  <div className="h-5 w-72 bg-slate-200 rounded" />
                  <div className="h-3 w-56 bg-slate-100 rounded" />
                </div>
                <div className="h-7 w-24 bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && complaints.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <h2 className="text-lg font-semibold text-civic-navy mb-2">
              No community issues reported yet
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              When you submit a civic issue, it receives a unique tracking reference ID and appears
              here with live status updates from municipal administrators.
            </p>
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-civic-royal hover:bg-civic-royal-hover rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-4 h-4" aria-hidden="true" />
              <span>File Your First Report</span>
            </Link>
          </div>
        )}

        {/* Filtered Empty State */}
        {!loading && !error && complaints.length > 0 && filteredComplaints.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm font-medium text-slate-700 mb-3">
              No complaints match your current search or status filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
              }}
              className="px-4 py-2 text-xs font-semibold text-civic-royal bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Populated Complaints List */}
        {!loading && !error && filteredComplaints.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
            {filteredComplaints.map((complaint) => (
              <Link
                key={complaint.id}
                to={`/complaints/${complaint.id}`}
                className="block p-5 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-civic-royal">
                        {complaint.referenceId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{complaint.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{complaint.communityName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatDate(complaint.createdAt)}</span>
                      {(complaint.hasImage || complaint.imageUrl) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Photo attached</span>
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-base font-semibold text-civic-navy group-hover:text-civic-royal transition-colors truncate">
                      {complaint.title}
                    </h2>

                    <p className="text-xs text-slate-600 truncate">
                      Location: {complaint.location}
                    </p>

                    {complaint.adminRemarks && (
                      <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-md px-2.5 py-1.5 mt-2 line-clamp-1">
                        Official Remark: {complaint.adminRemarks}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusIndicator status={complaint.status} />
                    <ChevronRight
                      className="w-4 h-4 text-slate-400 group-hover:text-civic-royal transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
