import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PublicHeader() {
  const { user, isAdmin } = useAuth();

  const primaryActionPath = user ? (isAdmin ? '/admin' : '/dashboard') : '/login';
  const primaryActionLabel = user ? 'Open Dashboard' : 'Report an Issue';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        <Link
          to="/"
          className="text-lg font-bold tracking-tight text-civic-navy whitespace-nowrap shrink-0"
        >
          CIRS Civic Portal
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <Link
            to="/#how-it-works"
            className="hover:text-civic-navy transition-colors whitespace-nowrap shrink-0"
          >
            How It Works
          </Link>
          <Link
            to="/#categories"
            className="hover:text-civic-navy transition-colors whitespace-nowrap shrink-0"
          >
            Issue Categories
          </Link>
          <Link
            to="/login"
            className="hover:text-civic-navy transition-colors whitespace-nowrap shrink-0"
          >
            Citizen Login
          </Link>
          <Link
            to="/admin/login"
            className="hover:text-civic-navy transition-colors whitespace-nowrap shrink-0"
          >
            Admin Portal
          </Link>
        </nav>

        <div className="shrink-0">
          <Link
            to={primaryActionPath}
            className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-civic-royal hover:bg-civic-royal-hover rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {primaryActionLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
