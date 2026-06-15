import { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, TrendingUp, FileWarning, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import {
  AuditProject, AuditFinding, AuditPage, WCAG_CRITERIA,
  SEVERITY_CONFIG, SCORE_CONFIG, RISK_CONFIG,
  WCAGPrinciple,
} from './types';

interface Props {
  project: AuditProject;
  findings: AuditFinding[];
  pages: AuditPage[];
  onScoreChange: (score: AuditProject['overallScore']) => void;
  onRiskChange: (risk: AuditProject['riskLevel']) => void;
}

const PRINCIPLE_COLORS: Record<WCAGPrinciple, { pass: string; fail: string; label: string }> = {
  perceivable:    { pass: '#3b82f6', fail: '#bfdbfe', label: 'Perceivable' },
  operable:       { pass: '#8b5cf6', fail: '#ddd6fe', label: 'Operable' },
  understandable: { pass: '#f59e0b', fail: '#fde68a', label: 'Understandable' },
  robust:         { pass: '#10b981', fail: '#a7f3d0', label: 'Robust' },
};

const SEVERITY_COLORS = {
  blocker:  '#ef4444',
  serious:  '#f97316',
  moderate: '#eab308',
  minor:    '#94a3b8',
};

// SVG donut chart — no external library
function DonutChart({ segments, size = 160 }: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No findings recorded yet</div>
  );
  const r = 56;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.filter(s => s.value > 0).map(s => {
    const pct = s.value / total;
    const dash = pct * circumference;
    const arc = { ...s, dash, offset, pct };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={22} />
        {arcs.map(arc => (
          <circle
            key={arc.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={22}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
          />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px`, fontSize: 22, fontWeight: 700, fill: '#1d4ed8' }}>
          {total}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px`, fontSize: 10, fill: '#6b7280' }}>
          total
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {arcs.map(arc => (
          <div key={arc.label} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: arc.color }} />
            <span className="text-gray-600">{arc.label}</span>
            <span className="font-semibold text-gray-800 ml-1">{arc.value}</span>
            <span className="text-gray-400 text-xs">({Math.round(arc.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Horizontal bar chart — no external library
function HBarChart({ bars, max }: { bars: { label: string; value: number; color: string }[]; max: number }) {
  if (bars.every(b => b.value === 0)) return (
    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No issues recorded yet</div>
  );
  return (
    <div className="space-y-3">
      {bars.map(bar => (
        <div key={bar.label} className="flex items-center gap-3">
          <span className="w-20 text-xs text-gray-600 text-right shrink-0">{bar.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-5 rounded-full transition-all duration-500"
              style={{ width: max > 0 ? `${(bar.value / max) * 100}%` : '0%', background: bar.color, minWidth: bar.value > 0 ? 20 : 0 }}
            />
          </div>
          <span className="w-6 text-xs font-semibold text-gray-700 shrink-0">{bar.value}</span>
        </div>
      ))}
    </div>
  );
}

// Grouped bar chart for WCAG principles
function PrincipleChart({ data }: { data: { name: string; principle: WCAGPrinciple; pass: number; fail: number }[] }) {
  const max = Math.max(...data.flatMap(d => [d.pass, d.fail]), 1);
  return (
    <div className="space-y-4">
      {data.map(d => {
        const colors = PRINCIPLE_COLORS[d.principle];
        return (
          <div key={d.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">{d.name}</span>
              <span className="text-xs text-gray-400">{d.pass} pass · {d.fail} fail</span>
            </div>
            <div className="flex gap-1 h-4">
              <div className="flex-1 bg-gray-100 rounded-l-full overflow-hidden flex justify-end">
                <div
                  className="h-full rounded-l-sm transition-all duration-500"
                  style={{ width: `${(d.pass / max) * 100}%`, background: colors.pass }}
                  title={`Pass: ${d.pass}`}
                />
              </div>
              <div className="w-px bg-gray-300" />
              <div className="flex-1 bg-gray-100 rounded-r-full overflow-hidden">
                <div
                  className="h-full rounded-r-sm transition-all duration-500"
                  style={{ width: `${(d.fail / max) * 100}%`, background: '#ef4444' }}
                  title={`Fail: ${d.fail}`}
                />
              </div>
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Pass</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Fail</span>
      </div>
    </div>
  );
}

export function Dashboard({ project, findings, pages, onScoreChange, onRiskChange }: Props) {
  const stats = useMemo(() => {
    const failed = findings.filter(f => f.conformance === 'fail');
    const passed = findings.filter(f => f.conformance === 'pass');
    const na = findings.filter(f => f.conformance === 'na');

    const bySeverity = {
      blocker:  failed.filter(f => f.severity === 'blocker').length,
      serious:  failed.filter(f => f.severity === 'serious').length,
      moderate: failed.filter(f => f.severity === 'moderate').length,
      minor:    failed.filter(f => f.severity === 'minor').length,
    };

    const conformanceRate = passed.length + failed.length > 0
      ? Math.round((passed.length / (passed.length + failed.length)) * 100)
      : 0;

    const byPrinciple = (['perceivable', 'operable', 'understandable', 'robust'] as WCAGPrinciple[]).map(p => {
      const criteria = WCAG_CRITERIA.filter(c => c.principle === p);
      const criteriaIds = criteria.map(c => c.id);
      const pf = findings.filter(f => criteriaIds.includes(f.criterionId));
      return {
        name: PRINCIPLE_COLORS[p].label,
        principle: p,
        pass: pf.filter(f => f.conformance === 'pass').length,
        fail: pf.filter(f => f.conformance === 'fail').length,
      };
    });

    return { failed, passed, na, bySeverity, conformanceRate, byPrinciple };
  }, [findings]);

  const scoreConf = SCORE_CONFIG[project.overallScore];
  const riskConf = RISK_CONFIG[project.riskLevel];

  const conformanceSegments = [
    { label: 'Pass', value: stats.passed.length, color: '#22c55e' },
    { label: 'Fail', value: stats.failed.length, color: '#ef4444' },
    { label: 'N/A',  value: stats.na.length,     color: '#94a3b8' },
  ];

  const severityBars = [
    { label: 'Blocker',  value: stats.bySeverity.blocker,  color: SEVERITY_COLORS.blocker },
    { label: 'Serious',  value: stats.bySeverity.serious,  color: SEVERITY_COLORS.serious },
    { label: 'Moderate', value: stats.bySeverity.moderate, color: SEVERITY_COLORS.moderate },
    { label: 'Minor',    value: stats.bySeverity.minor,    color: SEVERITY_COLORS.minor },
  ];
  const sevMax = Math.max(...severityBars.map(b => b.value), 1);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-xl border-2 p-5 ${scoreConf.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Overall Score</span>
            <ShieldCheck className={`w-5 h-5 ${scoreConf.color}`} />
          </div>
          <select
            value={project.overallScore}
            onChange={e => onScoreChange(e.target.value as AuditProject['overallScore'])}
            className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${scoreConf.color}`}
          >
            {Object.entries(SCORE_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">WCAG 2.2 Level A & AA</p>
        </div>

        <div className={`rounded-xl border-2 p-5 ${riskConf.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Risk Level</span>
            <AlertTriangle className={`w-5 h-5 ${riskConf.color}`} />
          </div>
          <select
            value={project.riskLevel}
            onChange={e => onRiskChange(e.target.value as AuditProject['riskLevel'])}
            className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${riskConf.color}`}
          >
            {Object.entries(RISK_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">Based on impact & context {project.context ? `(${project.context})` : ''}</p>
        </div>

        <div className="rounded-xl border-2 border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-500">Conformance Rate</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-4xl font-bold text-blue-700">
            {stats.passed.length + stats.failed.length === 0 ? '—' : `${stats.conformanceRate}%`}
          </div>
          <p className="mt-1 text-xs text-gray-500">{stats.passed.length} passed / {stats.failed.length} failed / {stats.na.length} N/A</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} label="Passed" value={stats.passed.length} color="text-green-700" />
        <MetricCard icon={<XCircle className="w-5 h-5 text-red-500" />} label="Failed" value={stats.failed.length} color="text-red-700" />
        <MetricCard icon={<MinusCircle className="w-5 h-5 text-gray-400" />} label="Not Applicable" value={stats.na.length} color="text-gray-600" />
        <MetricCard icon={<FileWarning className="w-5 h-5 text-orange-500" />} label="Total Issues" value={stats.failed.length} color="text-orange-700" />
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['blocker', 'serious', 'moderate', 'minor'] as const).map(s => {
          const conf = SEVERITY_CONFIG[s];
          return (
            <div key={s} className={`rounded-lg border p-4 ${conf.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${conf.dot}`} />
                <span className="text-sm font-semibold">{conf.label}</span>
              </div>
              <div className="text-3xl font-bold">{stats.bySeverity[s]}</div>
              <div className="text-xs mt-1 opacity-80">{conf.definition.split('.')[0]}.</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Overall Conformance</h3>
          <DonutChart segments={conformanceSegments} />
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Severity Distribution</h3>
          <HBarChart bars={severityBars} max={sevMax} />
        </div>
      </div>

      {/* By principle */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Results by WCAG Principle</h3>
        <PrincipleChart data={stats.byPrinciple} />
      </div>

      {/* Project summary */}
      {project.productName && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Audit Summary</h3>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><dt className="text-gray-500">Product</dt><dd className="font-medium">{project.productName || '—'}</dd></div>
            <div><dt className="text-gray-500">Conducted by</dt><dd className="font-medium">{project.conductedBy || '—'}</dd></div>
            <div><dt className="text-gray-500">Date range</dt><dd className="font-medium">{project.dateFrom || '—'} {project.dateTo ? `→ ${project.dateTo}` : ''}</dd></div>
            <div><dt className="text-gray-500">Pages audited</dt><dd className="font-medium">{pages.filter(p => p.url).length}</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </div>
    </div>
  );
}
