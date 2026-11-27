import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  CircleDot,
  ShieldCheck,
} from 'lucide-react';

const STATUS_STYLES = {
  // Green: paid, confirmed, successful
  paid: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: CheckCircle2,
  },
  settled: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: CheckCircle2,
  },
  confirmed: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: ShieldCheck,
  },
  'fully funded': {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: CheckCircle2,
  },
  active: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: CheckCircle2,
  },
  'on track': {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: CheckCircle2,
  },
  // Amber: pending, upcoming, partial
  pending: {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: Clock,
  },
  'pending verification': {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: Clock,
  },
  'partially funded': {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: CircleDot,
  },
  'partial payment': {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: CircleDot,
  },
  upcoming: {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: Clock,
  },
  unpaid: {
    bg: 'bg-slate-100 border-slate-200 text-slate-700',
    icon: Clock,
  },
  unfunded: {
    bg: 'bg-slate-100 border-slate-200 text-slate-700',
    icon: CircleDot,
  },
  'near limit': {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: AlertTriangle,
  },
  high: {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: AlertTriangle,
  },
  normal: {
    bg: 'bg-[#E6FBFC] border-[#00DCE5]/40 text-[#0E7490]',
    icon: CircleDot,
  },
  low: {
    bg: 'bg-slate-100 border-slate-200 text-slate-600',
    icon: CircleDot,
  },
  // Red: rejected, overdue, critical
  rejected: {
    bg: 'bg-red-50 border-red-200 text-red-700',
    icon: XCircle,
  },
  overdue: {
    bg: 'bg-red-50 border-red-200 text-red-700',
    icon: AlertTriangle,
  },
  'over budget': {
    bg: 'bg-red-50 border-red-200 text-red-700',
    icon: AlertTriangle,
  },
  urgent: {
    bg: 'bg-red-50 border-red-200 text-red-700',
    icon: AlertTriangle,
  },
  inactive: {
    bg: 'bg-slate-100 border-slate-200 text-slate-600',
    icon: XCircle,
  },
  // Roles
  administrator: {
    bg: 'bg-[#E6FBFC] border-[#00DCE5]/50 text-[#0E7490]',
    icon: ShieldCheck,
  },
  member: {
    bg: 'bg-slate-100 border-slate-200 text-slate-700',
    icon: CircleDot,
  },
};

export default function StatusBadge({ status, size = 'sm', className = '' }) {
  const key = String(status || '').toLowerCase().trim();
  const config = STATUS_STYLES[key] || {
    bg: 'bg-slate-100 border-slate-200 text-slate-700',
    icon: CircleDot,
  };
  const Icon = config.icon;
  const sizeCls =
    size === 'md'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : 'px-2 py-0.5 text-[11px] gap-1';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border whitespace-nowrap shrink-0 ${config.bg} ${sizeCls} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
