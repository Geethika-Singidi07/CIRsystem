import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Copy } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/cirsService';
import { FIELD_LIMITS } from '../types/cirs';

export function CitizenProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [communityName, setCommunityName] = useState(userProfile?.communityName || '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName);
      setCommunityName(userProfile.communityName);
    }
  }, [userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavedMsg(null);
    setErrorMsg(null);

    if (
      fullName.trim().length < FIELD_LIMITS.fullName.min ||
      fullName.trim().length > FIELD_LIMITS.fullName.max
    ) {
      setErrorMsg(
        `Full name must be between ${FIELD_LIMITS.fullName.min} and ${FIELD_LIMITS.fullName.max} characters.`
      );
      return;
    }

    if (
      communityName.trim().length < FIELD_LIMITS.communityName.min ||
      communityName.trim().length > FIELD_LIMITS.communityName.max
    ) {
      setErrorMsg(
        `Community name must be between ${FIELD_LIMITS.communityName.min} and ${FIELD_LIMITS.communityName.max} characters.`
      );
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user.uid, { fullName, communityName });
      await refreshProfile();
      setSavedMsg('Profile details saved to Cloud Firestore.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUid = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <AppShell mode="citizen" breadcrumb="Account Profile">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-civic-navy tracking-tight">Resident Profile</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your contact name and default neighborhood ward for faster complaint reporting.
          </p>
        </div>

        {savedMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-sm text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{savedMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-sm text-red-900">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <label htmlFor="profileEmail" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Verified Email Address
            </label>
            <input
              id="profileEmail"
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 text-sm bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="profileName" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              id="profileName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={FIELD_LIMITS.fullName.max}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
            />
          </div>

          <div>
            <label
              htmlFor="profileCommunity"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Default Community / Ward Name
            </label>
            <input
              id="profileCommunity"
              type="text"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              maxLength={FIELD_LIMITS.communityName.max}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-civic-royal hover:bg-civic-royal-hover disabled:opacity-60 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-700">Account Identifier (UID)</p>
            <p className="text-xs font-mono text-slate-500 mt-1 break-all">{user?.uid}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyUid}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-civic-navy bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {copiedUid ? <Check className="w-3.5 h-3.5 text-civic-green" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUid ? 'Copied UID' : 'Copy UID'}</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
