import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Droplets,
  Lightbulb,
  MapPin,
  ShieldAlert,
  Trash2,
  Trees,
  Volume2,
  Wrench,
} from 'lucide-react';
import { PublicHeader } from '../components/PublicHeader';
import heroCivicPlaza from '../assets/images/hero_civic_plaza_1794640993400.jpg';

const WORKFLOW_STEPS = [
  {
    step: '01. Authenticate',
    title: 'Verify Resident Account',
    description:
      'Create an independent citizen account with email and password or Google Sign-In for secure session persistence.',
  },
  {
    step: '02. Document',
    title: 'Submit Location & Photo',
    description:
      'Describe the neighborhood issue, tag your community ward, and attach a compressed photo at zero storage cost.',
  },
  {
    step: '03. Reference ID',
    title: 'Receive Tracking Code',
    description:
      'Every report generates a unique CIRS-YYYY-XXXXXX identifier stored persistently in Cloud Firestore.',
  },
  {
    step: '04. Resolve',
    title: 'Track Official Remarks',
    description:
      'Follow real-time municipal progress from Pending to In Progress to Resolved with department remarks.',
  },
];

const SERVICE_CATEGORIES = [
  {
    name: 'Road & Potholes',
    detail: 'Pavement damage, cracked sidewalks, faded crosswalks, and signage hazards.',
    icon: MapPin,
  },
  {
    name: 'Streetlights & Power',
    detail: 'Outages, flickering fixtures, damaged poles, and exposed utility cabinets.',
    icon: Lightbulb,
  },
  {
    name: 'Water & Drainage',
    detail: 'Blocked storm drains, leaking mains, standing water, and culvert backups.',
    icon: Droplets,
  },
  {
    name: 'Waste & Sanitation',
    detail: 'Missed pickups, illegal dumping, overflowing public bins, and street sweeping.',
    icon: Trash2,
  },
  {
    name: 'Parks & Trees',
    detail: 'Fallen branches, overgrown visibility corridors, and damaged park benches.',
    icon: Trees,
  },
  {
    name: 'Public Safety',
    detail: 'Broken guardrails, obstructed fire hydrants, and blind-corner hazards.',
    icon: ShieldAlert,
  },
  {
    name: 'Noise & Nuisance',
    detail: 'After-hours construction, commercial equipment noise, and code violations.',
    icon: Volume2,
  },
  {
    name: 'Other Municipal Issues',
    detail: 'General neighborhood maintenance requests routed to community services.',
    icon: Wrench,
  },
];

export function HomePage() {
  const [imageError, setImageError] = useState(false);
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicHeader />

      {/* Split Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold text-civic-green tracking-wide mb-3">
                Community Issue Reporting System
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-civic-navy leading-[1.15] tracking-tight text-balance mb-5">
                Direct civic reporting from neighborhood streets to municipal action
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl mb-8">
                Report potholes, streetlight outages, drainage blockages, and public safety
                hazards with a verified resident account. Track every ticket from submission to
                resolution with transparent administrative remarks.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-civic-royal hover:bg-civic-royal-hover rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Submit a Complaint</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-civic-navy bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Municipal Admin Portal</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 flex">
              <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-civic-navy relative min-h-[280px] lg:min-h-[380px]">
                {!imageError ? (
                  <img
                    src={heroCivicPlaza}
                    alt="Modern civic center plaza and landscaped public park"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-civic-navy via-civic-navy-soft to-civic-royal flex flex-col items-center justify-center p-8 text-white text-center">
                    <Building2 className="w-12 h-12 text-emerald-300 mb-3" />
                    <p className="text-lg font-semibold">CIRS Municipal Operations</p>
                    <p className="text-sm text-slate-300 mt-1">
                      Transparent neighborhood issue tracking
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Column Workflow Strip directly below Hero */}
          <div
            id="how-it-works"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-10 border-t border-slate-200"
          >
            {WORKFLOW_STEPS.map((item) => (
              <div key={item.step} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-mono font-semibold text-civic-royal mb-2">
                  {item.step}
                </p>
                <h2 className="text-base font-semibold text-civic-navy mb-1.5">{item.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Civic Issue Categories */}
      <section id="categories" className="py-14 lg:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-civic-navy tracking-tight mb-3">
              Supported Civic Issue Categories
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Every submitted report is assigned a unique tracking code and routed to municipal
              administrators for department assignment and status updates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICE_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.name}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-civic-royal mb-4">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-semibold text-civic-navy mb-1.5">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{category.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Civic Security & Free Architecture Note */}
      <section className="pb-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="bg-civic-navy text-white rounded-xl p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <h2 className="text-2xl font-bold mb-2 text-balance">
                Built with role-isolated Firestore security and zero paid dependencies
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Citizens can only read and track their own complaints, while municipal
                administrators authenticate through a dedicated role-verified portal. Optional
                issue photos are compressed client-side to stay completely within the free
                Firebase Spark plan.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-civic-navy bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>Create Resident Account</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p className="font-medium text-slate-700">
            CIRS — Community Issue Reporting System
          </p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-civic-navy transition-colors">
              Citizen Login
            </Link>
            <Link to="/register" className="hover:text-civic-navy transition-colors">
              Register
            </Link>
            <Link to="/admin/login" className="hover:text-civic-navy transition-colors">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
