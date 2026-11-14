import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Info, Lock, Mail, ShieldCheck } from 'lucide-react';
import { mapFirebaseAuthError, useAuth } from '../context/AuthContext';
import { PublicHeader } from '../components/PublicHeader';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading, loginAdminWithEmail, loginAdminWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConsoleSetupGuide, setShowConsoleSetupGuide] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setShowConsoleSetupGuide(false);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your administrator email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await loginAdminWithEmail(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      setErrorMessage(mapped.message);
      if (mapped.isEmailPasswordDisabled) {
        setShowConsoleSetupGuide(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setErrorMessage(null);
    setShowConsoleSetupGuide(false);
    setSubmitting(true);
    try {
      await loginAdminWithGoogle();
      navigate('/admin', { replace: true });
    } catch (err) {
      const mapped = mapFirebaseAuthError(err);
      setErrorMessage(mapped.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicHeader />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-civic-navy px-6 sm:px-8 py-6 text-white">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Municipal Admin Portal</h1>
            <p className="text-xs text-slate-300 mt-1">
              Role-verified access for reviewing, assigning, and resolving citizen complaints.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-900">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {showConsoleSetupGuide && (
              <div className="mb-5 p-4 rounded-lg bg-blue-50 border border-blue-200 text-xs text-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-civic-navy">
                  <Info className="w-4 h-4 text-civic-royal shrink-0" />
                  <span>Enable Email/Password in Firebase Console</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                  <li>Open Firebase Console → Authentication → Sign-in method.</li>
                  <li>Enable Email/Password and save.</li>
                  <li>Add the staff UID in Firestore under the admins collection (or use Google Sign-In below).</li>
                </ol>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="adminEmail"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
                    aria-hidden="true"
                  />
                  <input
                    id="adminEmail"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@municipality.gov"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="adminPassword"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
                    aria-hidden="true"
                  />
                  <input
                    id="adminPassword"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter administrator password"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-civic-navy hover:bg-civic-navy-soft disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>{submitting ? 'Verifying Access...' : 'Sign In as Administrator'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-500">Or verify with Google</span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleGoogleAdminLogin}
              className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Admin Google Sign-In</span>
            </button>

            <p className="mt-6 text-center text-xs text-slate-500">
              Reporting a neighborhood issue?{' '}
              <Link to="/login" className="font-semibold text-civic-royal hover:underline">
                Go to Citizen Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
