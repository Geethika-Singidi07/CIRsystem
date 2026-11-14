import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Copy,
  MapPin,
  MessageSquareText,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatusIndicator } from '../components/StatusIndicator';
import { useAuth } from '../context/AuthContext';
import { getComplaintById, getComplaintImage } from '../services/cirsService';
import { Complaint, ComplaintImage, COMPLAINT_STATUSES } from '../types/cirs';

function formatDateTime(ts?: { toDate?: () => Date }): string {
  if (!ts?.toDate) return 'Pending timestamp';
  return ts.toDate().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [attachedImage, setAttachedImage] = useState<ComplaintImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const record = await getComplaintById(id!);
        if (!active) return;
        if (!record) {
          setError('Complaint record not found or you do not have access to view it.');
          setLoading(false);
          return;
        }
        setComplaint(record);

        if (record.hasImage) {
          try {
            const img = await getComplaintImage(record.id);
            if (active) setAttachedImage(img);
          } catch {
            // Image fetch failure should not block main complaint view
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load complaint details.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id, user]);

  const handleCopyRef = async () => {
    if (!complaint) return;
    try {
      await navigator.clipboard.writeText(complaint.referenceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const shellMode = isAdmin ? 'admin' : 'citizen';
  const backPath = isAdmin ? '/admin' : '/dashboard';

  return (
    <AppShell mode={shellMode} breadcrumb={complaint?.referenceId || 'Complaint Detail'}>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={backPath}
            className="inline-flex items-center gap-2 text-sm font-semibold text-civic-navy hover:text-civic-royal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isAdmin ? 'Back to All Complaints' : 'Back to My Complaints'}</span>
          </Link>
        </div>

        {loading && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 animate-pulse space-y-4">
            <div className="h-5 w-44 bg-slate-200 rounded" />
            <div className="h-8 w-3/4 bg-slate-200 rounded" />
            <div className="h-24 w-full bg-slate-100 rounded" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3 text-sm text-red-900">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to Load Complaint</p>
              <p className="text-xs text-red-800 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && complaint && (
          <div className="space-y-6">
            {/* Header & Status Progress */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={handleCopyRef}
                      className="inline-flex items-center gap-1.5 font-mono font-semibold text-civic-royal hover:underline"
                      title="Copy reference ID"
                    >
                      <span>{complaint.referenceId}</span>
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-civic-green" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span aria-hidden="true">·</span>
                    <span>{complaint.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{complaint.communityName}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-civic-navy leading-snug">
                    {complaint.title}
                  </h1>
                </div>

                <StatusIndicator status={complaint.status} />
              </div>

              {/* 3-Step Status Stepper */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
                {COMPLAINT_STATUSES.map((step, index) => {
                  const currentIndex = COMPLAINT_STATUSES.indexOf(complaint.status);
                  const reached = index <= currentIndex;
                  return (
                    <div
                      key={step}
                      className={`p-3 rounded-lg border ${
                        reached
                          ? 'bg-blue-50/70 border-blue-200 text-civic-navy'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <p className="text-[11px] font-mono font-semibold">Step 0{index + 1}</p>
                      <p className="text-xs sm:text-sm font-semibold mt-0.5">{step}</p>
                    </div>
                  );
                })}
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="font-medium text-slate-900 mt-0.5">{complaint.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-slate-500">Submitted</p>
                    <p className="font-medium text-slate-900 tabular-nums mt-0.5">
                      {formatDateTime(complaint.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Building2
                    className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs text-slate-500">Assigned Department</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {complaint.assignedDepartment || 'Pending Assignment'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Evidence Image */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-civic-navy mb-2">Issue Description</h2>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {complaint.description}
                </p>
              </div>

              {(attachedImage?.dataUrl || complaint.imageUrl) && (
                <div className="pt-5 border-t border-slate-200 space-y-3">
                  <h2 className="text-sm font-semibold text-civic-navy">Submitted Photo</h2>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-w-xl">
                    <img
                      src={attachedImage?.dataUrl || complaint.imageUrl}
                      alt={`Evidence photo for ${complaint.title}`}
                      referrerPolicy="no-referrer"
                      className="w-full max-h-[420px] object-contain bg-slate-900/5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Official Admin Remarks */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4 text-civic-green" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-civic-navy">
                    Official Municipal Remarks
                  </h2>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  Updated: {formatDateTime(complaint.updatedAt)}
                </span>
              </div>

              {complaint.adminRemarks ? (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-950 leading-relaxed whitespace-pre-line">
                  {complaint.adminRemarks}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No municipal remarks have been posted yet. An administrator will add inspection
                  notes when reviewing your ticket.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
