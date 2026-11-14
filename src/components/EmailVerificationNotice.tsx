import { useState } from 'react';
import { MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function EmailVerificationNotice() {
  const { user, resendVerification, refreshVerificationStatus, logout } = useAuth();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleRefresh = async () => {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const verified = await refreshVerificationStatus();
      if (!verified) {
        setErrorMsg(
          'Email is not yet verified. Please open the verification link sent to your inbox, then click Check Verification Status again.'
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not refresh verification status.');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setBusy(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await resendVerification();
      setStatusMsg('A fresh verification email has been sent to your inbox.');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not resend verification email. Please wait a minute before retrying.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8">
        <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-civic-royal mb-5">
          <MailCheck className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold text-civic-navy mb-2">Verify Your Email Address</h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          We sent a verification link to <span className="font-semibold text-slate-900">{user?.email}</span>.
          To prevent spam and enforce Firestore security rules, please confirm your email before
          submitting or tracking community reports.
        </p>

        {statusMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
            {statusMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            disabled={busy}
            onClick={handleRefresh}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-civic-royal hover:bg-civic-royal-hover disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            <span>I&apos;ve Verified My Email</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleResend}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Resend Link
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Signed in with a different email?</span>
          <button
            type="button"
            onClick={() => void logout()}
            className="font-semibold text-civic-royal hover:underline"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
