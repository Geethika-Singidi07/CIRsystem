import { CheckCircle2, Clock, Wrench } from 'lucide-react';
import { ComplaintStatus } from '../types/cirs';

export function StatusIndicator({ status }: { status: ComplaintStatus }) {
  if (status === 'Resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
        <span>Resolved</span>
      </span>
    );
  }

  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
        <Wrench className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
        <span>In Progress</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
      <span>Pending</span>
    </span>
  );
}
