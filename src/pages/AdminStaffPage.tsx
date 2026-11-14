import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldPlus, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import {
  fetchAllCitizensForAdmin,
  grantAdminAccess,
  revokeAdminAccess,
  subscribeAdmins,
} from '../services/cirsService';
import {
  AdminRecord,
  BOOTSTRAPPED_ADMIN_EMAIL,
  MUNICIPAL_DEPARTMENTS,
  UserProfile,
} from '../types/cirs';

export function AdminStaffPage() {
  const { user, authReady, isAdmin } = useAuth();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [citizens, setCitizens] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [targetUid, setTargetUid] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState<string>(MUNICIPAL_DEPARTMENTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady || !isAdmin) return;

    setLoading(true);
    const unsub = subscribeAdmins(
      (list) => {
        setAdmins(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    void fetchAllCitizensForAdmin()
      .then((list) => setCitizens(list))
      .catch(() => {
        // Non-blocking directory assist
      });

    return () => unsub();
  }, [authReady, isAdmin]);

  const handleSelectCitizen = (uid: string) => {
    setTargetUid(uid);
    const matched = citizens.find((c) => c.uid === uid);
    if (matched) {
      setEmail(matched.email);
      setFullName(matched.fullName);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFeedback(null);
    setFormError(null);

    if (!targetUid.trim() || !/^[a-zA-Z0-9_-]{4,128}$/.test(targetUid.trim())) {
      setFormError('Please provide a valid Firebase User UID.');
      return;
    }
    if (!email.trim() || !fullName.trim()) {
      setFormError('Please provide the administrator name and email address.');
      return;
    }

    setSubmitting(true);
    try {
      await grantAdminAccess({
        uid: targetUid,
        email,
        fullName,
        department,
        grantedBy: user.uid,
      });
      setFeedback(`Granted administrator access to ${fullName.trim()} (${email.trim()}).`);
      setTargetUid('');
      setEmail('');
      setFullName('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to grant admin access.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (adminUid: string, adminEmail: string) => {
    if (adminUid === user?.uid) return;
    setFeedback(null);
    setFormError(null);
    try {
      await revokeAdminAccess(adminUid);
      setFeedback(`Revoked administrator access for ${adminEmail}.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to revoke admin access.');
    }
  };

  return (
    <AppShell mode="admin" breadcrumb="Admin Access">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-civic-navy tracking-tight">
            Administrator Access Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Only existing verified administrators can authorize additional municipal staff accounts.
            Citizens cannot elevate their own permissions.
          </p>
        </div>

        {/* Grant Admin Form */}
        <form
          onSubmit={handleGrant}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center gap-2">
            <ShieldPlus className="w-5 h-5 text-civic-royal" aria-hidden="true" />
            <h2 className="text-base font-bold text-civic-navy">Authorize New Administrator</h2>
          </div>

          {feedback && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-900">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {citizens.length > 0 && (
            <div>
              <label
                htmlFor="quickSelectCitizen"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Select from Registered Accounts (optional)
              </label>
              <select
                id="quickSelectCitizen"
                value={targetUid}
                onChange={(e) => handleSelectCitizen(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal"
              >
                <option value="">-- Enter UID manually or pick a verified user --</option>
                {citizens.map((c) => (
                  <option key={c.uid} value={c.uid}>
                    {c.fullName} ({c.email}) — {c.uid}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="adminUid" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Firebase User UID
              </label>
              <input
                id="adminUid"
                type="text"
                required
                value={targetUid}
                onChange={(e) => setTargetUid(e.target.value)}
                placeholder="Paste verified user UID"
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal"
              />
            </div>

            <div>
              <label
                htmlFor="staffEmail"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Staff Email
              </label>
              <input
                id="staffEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@municipality.gov"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal"
              />
            </div>

            <div>
              <label
                htmlFor="staffName"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="staffName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jordan Alvarez"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal"
              />
            </div>

            <div>
              <label
                htmlFor="staffDept"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Municipal Department
              </label>
              <select
                id="staffDept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal"
              >
                {MUNICIPAL_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-civic-royal hover:bg-civic-royal-hover disabled:opacity-60 rounded-lg transition-colors"
            >
              {submitting ? 'Authorizing...' : 'Grant Admin Access'}
            </button>
          </div>
        </form>

        {/* Active Administrators List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-civic-navy">Authorized Administrators</h2>
            <span className="text-xs text-slate-500">
              Primary Owner: {BOOTSTRAPPED_ADMIN_EMAIL}
            </span>
          </div>

          {error && (
            <div className="p-4 text-xs text-red-700 bg-red-50">{error}</div>
          )}

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading administrator directory...</div>
          ) : admins.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">
              No additional staff administrators added yet. The primary bootstrapped owner
              account has full administrator privileges.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {admins.map((admin) => (
                <div
                  key={admin.uid}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-civic-navy">{admin.fullName}</p>
                    <p className="text-xs text-slate-600">
                      {admin.email} · {admin.department}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{admin.uid}</p>
                  </div>
                  {admin.uid !== user?.uid && (
                    <button
                      type="button"
                      onClick={() => void handleRevoke(admin.uid, admin.email)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
