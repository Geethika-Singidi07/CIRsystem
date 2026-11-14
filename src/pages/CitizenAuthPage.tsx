import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Info, Lock, Mail } from 'lucide-react';
import { mapFirebaseAuthError, useAuth } from '../context/AuthContext';
import { PublicHeader } from '../components/PublicHeader';
import { EmailVerificationNotice } from '../components/EmailVerificationNotice';
import { FIELD_LIMITS } from '../types/cirs';

export function CitizenAuthPage({ initialMode }: { initialMode?: 'login' | 'register' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, emailVerified, isAdmin, loading, registerCitizen, loginWithEmail, loginWithGoogle } =
    useAuth();

  const derivedMode =
    initialMode || (location.pathname === '/register' ? 'register' : 'login');
  const [mode, setMode] = useState<'login' | 'register'>(derivedMode);

  const [fullName, setFullName] = useState('');
  const [communityName, setCommunityName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConsoleSetupGuide, setShowConsoleSetupGuide] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode || (location.pathname === '/register' ? 'register' : 'login'));
    setErrorMessage(null);
    setInfoMessage(null);
    setShowConsoleSetupGuide(false);
  }, [initialMode, location.pathname]);

  useEffect(() => {
    if (!loading && user && emailVerified) {
      navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, emailVerified, isAdmin, loading, navigate]);

  if (!loading && user && !emailVerified) {
    return <EmailVerificationNotice />;
  }

  const validateForm = (): string | null => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return 'Please enter a valid email address.';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    if (mode === 'register') {
      const cleanName = fullName.trim();
      const cleanCommunity = communityName.trim();

      if (
        cleanName.length < FIELD_LIMITS.fullName.min ||
        cleanName.length > FIELD_LIMITS.fullName.max
      ) {
        return `Full name must be between ${FIELD_LIMITS.fullName.min} and ${FIELD_LIMITS.fullName.max} characters.`;
      }
      if (
        cleanCommunity.length < FIELD_LIMITS.communityName.min ||
        cleanCommunity.length > FIELD_LIMITS.communityName.max
      ) {
        return `Community name must be between ${FIELD_LIMITS.communityName.min} and ${FIELD_LIMITS.communityName.max} characters.`;
      }
      if (password !== confirmPassword) {
        return 'Passwords do not match. Please re-enter your confirmation password.';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setShowConsoleSetupGuide(false);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'register') {
        const result = await registerCitizen({
          fullName,
          email,
          password,
          communityName,
        });
        if (result.needsVerification) {
          setInfoMessage(
            'Account created! A verification email has been sent. Please verify your email to continue.'
          );
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        const signedInUser = await loginWithEmail(email, password);
        if (signedInUser.emailVerified) {
          navigate('/dashboard', { replace: true });
        }
      }
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

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setShowConsoleSetupGuide(false);
    setSubmitting(true);
    try {
      await loginWithGoogle(communityName);
      navigate('/dashboard', { replace: true });
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
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-civic-navy mb-1.5">
              {mode === 'register' ? 'Create Citizen Account' : 'Citizen Portal Sign In'}
            </h1>
            <p className="text-sm text-slate-600">
              {mode === 'register'
                ? 'Register an independent account to file and track community issues.'
                : 'Sign in with your verified email to view your submitted complaints.'}
            </p>
          </div>

          {/* Segmented Mode Switch */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setShowConsoleSetupGuide(false);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'login'
                  ? 'bg-white text-civic-navy shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setShowConsoleSetupGuide(false);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'register'
                  ? 'bg-white text-civic-navy shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {infoMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

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
                <span>How to Enable Email/Password in Firebase Console</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                <li>Open Firebase Console for your project and select Authentication.</li>
                <li>Click Sign-in method, then choose Email/Password.</li>
                <li>Toggle Enable to on and click Save.</li>
              </ol>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <>
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Maya Lin"
                    maxLength={FIELD_LIMITS.fullName.max}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
                  />
                </div>

                <div>
                  <label
                    htmlFor="communityName"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Community / Neighborhood Name
                  </label>
                  <input
                    id="communityName"
                    type="text"
                    required
                    value={communityName}
                    onChange={(e) => setCommunityName(e.target.value)}
                    placeholder="Oakridge Ward 4"
                    maxLength={FIELD_LIMITS.communityName.max}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
                  />
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@community.org"
                  maxLength={FIELD_LIMITS.email.max}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-civic-royal hover:bg-civic-royal-hover disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>
                {submitting
                  ? mode === 'register'
                    ? 'Creating Account...'
                    : 'Signing In...'
                  : mode === 'register'
                    ? 'Create Citizen Account'
                    : 'Sign In to Portal'}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogleSignIn}
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
            <span>Continue with Google</span>
          </button>

          <p className="mt-6 text-center text-xs text-slate-500">
            Municipal staff member?{' '}
            <Link to="/admin/login" className="font-semibold text-civic-navy hover:underline">
              Sign in via Admin Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
